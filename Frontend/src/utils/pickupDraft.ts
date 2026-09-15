/*
 * Rascunho da retirada — precisa sobreviver ao app ser reiniciado.
 *
 * No Android a camera derruba a WebView com frequencia: o sistema mata a
 * Activity do MakerCar para liberar memoria enquanto a camera esta em primeiro
 * plano e, na volta, a pagina recarrega do zero. Com cinco fotos obrigatorias
 * sao cinco chances de isso acontecer no meio do checklist, entao nada do que o
 * motorista ja preencheu pode viver apenas na memoria do React.
 *
 * Os campos do formulario ficam no localStorage: sao poucos bytes e precisam
 * ser lidos de forma sincrona, ja no primeiro render. As fotos vao para o
 * IndexedDB — em data URL elas somam alguns MB e estouravam a cota do
 * localStorage, que respondia descartando em silencio justamente as fotos que
 * o motorista tinha acabado de tirar.
 */

export interface PickupDraftFields<TChecklistKey extends string = string> {
  requesterName: string;
  tookReservedVehicle: boolean;
  usedVehicleId: string;
  date: string;
  time: string;
  kmStart: string;
  fuelLevel: string;
  vehicleCondition: string;
  damages: string;
  checklist: Record<TChecklistKey, boolean>;
  notes: string;
  /* Opcional: rascunhos salvos antes desta versao nao tinham o destino. */
  destination?: string;
  /* Idem para as fotos, que moraram aqui ate a migracao para o IndexedDB. */
  photos?: Record<string, string>;
}

const DRAFT_KEY_PREFIX = "makercar:pickup-draft:";
const IN_PROGRESS_KEY = "makercar:pickup-in-progress";

/*
 * Uma retirada leva minutos. Seis horas e folga de sobra para o motorista
 * terminar e curta o bastante para um marcador esquecido nao prender ninguem
 * na tela de retirada no dia seguinte.
 */
const IN_PROGRESS_TTL_MS = 6 * 60 * 60 * 1000;

const DB_NAME = "makercar";
const DB_VERSION = 1;
const PHOTO_STORE = "pickup-photos";

function draftStorageKey(reservationId: string) {
  return `${DRAFT_KEY_PREFIX}${reservationId}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readPickupDraftFields<TChecklistKey extends string = string>(
  reservationId: string,
): PickupDraftFields<TChecklistKey> | undefined {
  if (!canUseStorage()) return undefined;

  try {
    const rawDraft = window.localStorage.getItem(draftStorageKey(reservationId));
    if (!rawDraft) return undefined;
    return JSON.parse(rawDraft) as PickupDraftFields<TChecklistKey>;
  } catch {
    return undefined;
  }
}

export function savePickupDraftFields<TChecklistKey extends string = string>(
  reservationId: string,
  fields: PickupDraftFields<TChecklistKey>,
) {
  if (!canUseStorage()) return;

  try {
    // As fotos vivem no IndexedDB; guardar uma copia aqui traria de volta o
    // estouro de cota que fazia o rascunho inteiro ser descartado.
    const { photos: _photos, ...fieldsWithoutPhotos } = fields;
    window.localStorage.setItem(
      draftStorageKey(reservationId),
      JSON.stringify(fieldsWithoutPhotos),
    );
  } catch {
    // O checklist continua utilizavel mesmo se o armazenamento local estiver bloqueado.
  }
}

export async function clearPickupDraft(reservationId: string) {
  if (canUseStorage()) {
    try {
      window.localStorage.removeItem(draftStorageKey(reservationId));
    } catch {
      // Nada a fazer se o navegador bloquear o armazenamento local.
    }
  }

  clearPickupInProgress();
  await deletePickupPhotos(reservationId);
}

/*
 * Marcador da retirada aberta. E ele que permite a tela voltar sozinha para o
 * checklist quando o app reinicia — sem isso o motorista cai na Central de
 * Reservas e precisa refazer o caminho ate o formulario a cada foto.
 */
export function markPickupInProgress(reservationId: string) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify({ reservationId, at: Date.now() }));
  } catch {
    // Sem o marcador a retirada ainda funciona; so nao se reabre sozinha.
  }
}

export function readPickupInProgress(): string | undefined {
  if (!canUseStorage()) return undefined;

  try {
    const rawMarker = window.localStorage.getItem(IN_PROGRESS_KEY);
    if (!rawMarker) return undefined;

    const marker = JSON.parse(rawMarker) as { reservationId?: string; at?: number };
    if (!marker.reservationId || typeof marker.at !== "number") return undefined;
    if (Date.now() - marker.at > IN_PROGRESS_TTL_MS) {
      clearPickupInProgress();
      return undefined;
    }

    return marker.reservationId;
  } catch {
    return undefined;
  }
}

export function clearPickupInProgress() {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(IN_PROGRESS_KEY);
  } catch {
    // Nada a fazer se o navegador bloquear o armazenamento local.
  }
}

function openPhotoDatabase() {
  return new Promise<IDBDatabase | null>((resolve) => {
    if (typeof window === "undefined" || typeof window.indexedDB === "undefined") {
      resolve(null);
      return;
    }

    let request: IDBOpenDBRequest;
    try {
      request = window.indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PHOTO_STORE)) {
        database.createObjectStore(PHOTO_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

export async function readPickupPhotos<TPhotoKey extends string = string>(
  reservationId: string,
): Promise<Partial<Record<TPhotoKey, string>>> {
  const database = await openPhotoDatabase();

  if (database) {
    try {
      const storedPhotos = await new Promise<Partial<Record<TPhotoKey, string>> | undefined>(
        (resolve) => {
          try {
            const request = database
              .transaction(PHOTO_STORE, "readonly")
              .objectStore(PHOTO_STORE)
              .get(reservationId);
            request.onsuccess = () =>
              resolve(request.result as Partial<Record<TPhotoKey, string>> | undefined);
            request.onerror = () => resolve(undefined);
          } catch {
            resolve(undefined);
          }
        },
      );

      if (storedPhotos) return storedPhotos;
    } finally {
      database.close();
    }
  }

  // Rascunho criado antes desta versao: as fotos ainda estao no localStorage.
  const legacyPhotos = readPickupDraftFields(reservationId)?.photos;
  return (legacyPhotos ?? {}) as Partial<Record<TPhotoKey, string>>;
}

export async function savePickupPhotos<TPhotoKey extends string = string>(
  reservationId: string,
  photos: Partial<Record<TPhotoKey, string>>,
) {
  const database = await openPhotoDatabase();
  if (!database) return;

  try {
    await new Promise<void>((resolve) => {
      try {
        const transaction = database.transaction(PHOTO_STORE, "readwrite");
        transaction.objectStore(PHOTO_STORE).put(photos, reservationId);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
        transaction.onabort = () => resolve();
      } catch {
        resolve();
      }
    });
  } finally {
    database.close();
  }
}

async function deletePickupPhotos(reservationId: string) {
  const database = await openPhotoDatabase();
  if (!database) return;

  try {
    await new Promise<void>((resolve) => {
      try {
        const transaction = database.transaction(PHOTO_STORE, "readwrite");
        transaction.objectStore(PHOTO_STORE).delete(reservationId);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
        transaction.onabort = () => resolve();
      } catch {
        resolve();
      }
    });
  } finally {
    database.close();
  }
}
