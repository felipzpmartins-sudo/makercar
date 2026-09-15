import { Camera, KeyRound, Loader2 } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UrgentWhatsAppNotice } from "@/components/UrgentWhatsAppNotice";
import type { PickupDraft, Reservation, Vehicle } from "@/data/vehicles";
import { buildPhotoChecklistDataUrl, imageFileToDataUrl } from "@/utils/imageUpload";
import {
  clearPickupDraft,
  markPickupInProgress,
  readPickupDraftFields,
  readPickupPhotos,
  savePickupDraftFields,
  savePickupPhotos,
} from "@/utils/pickupDraft";

interface PickupModalProps {
  open: boolean;
  reservation?: Reservation;
  vehicles: Vehicle[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (draft: PickupDraft) => Promise<boolean> | boolean | void;
}

type ChecklistKey =
  | "spareTire"
  | "wheelWrench"
  | "jack"
  | "triangle"
  | "cleanNoDamage"
  | "documents"
  | "tires"
  | "lights"
  | "noPanelWarnings";

type PhotoKey = "panel" | "front" | "rear" | "leftSide" | "rightSide";

const checklistItems: Array<{ key: ChecklistKey; label: string }> = [
  { key: "spareTire", label: "Estepe presente e em boas condicoes" },
  { key: "wheelWrench", label: "Chave de roda presente" },
  { key: "jack", label: "Macaco presente" },
  { key: "triangle", label: "Triangulo presente" },
  { key: "cleanNoDamage", label: "Veiculo limpo e sem avarias aparentes" },
  { key: "documents", label: "Documentacao do veiculo presente" },
  { key: "tires", label: "Pneus em boas condicoes" },
  { key: "lights", label: "Farois e lanternas funcionando" },
  { key: "noPanelWarnings", label: "Nao ha luzes de alerta acesas no painel" },
];

type PhotoItem = { key: PhotoKey; label: string; required: boolean };

/*
 * O painel com o KM e o unico item que todo veiculo pede. Os veiculos marcados
 * com "checklist simplificado" no painel do admin (hoje so o carro de apoio de
 * Leme) param por aqui; os demais seguem com as quatro fotos abaixo.
 */
const panelPhotoItem: PhotoItem = {
  key: "panel",
  label: "Foto do painel mostrando o KM",
  required: true,
};

const vehiclePhotoItems: PhotoItem[] = [
  { key: "front", label: "Foto da parte frontal do veiculo", required: true },
  { key: "rear", label: "Foto da parte traseira do veiculo", required: true },
  {
    key: "leftSide",
    label: "Foto da lateral do veiculo (lado do motorista)",
    required: true,
  },
  {
    key: "rightSide",
    label: "Foto da lateral do veiculo (lado do abastecimento)",
    required: true,
  },
];

const allPhotoItems: PhotoItem[] = [panelPhotoItem, ...vehiclePhotoItems];

const fuelLevels = ["Cheio", "3/4", "1/2", "1/4", "Reserva ou vazio"];

function createChecklistState() {
  return checklistItems.reduce(
    (state, item) => ({ ...state, [item.key]: false }),
    {} as Record<ChecklistKey, boolean>,
  );
}

function createPhotoState() {
  return allPhotoItems.reduce(
    (state, item) => ({ ...state, [item.key]: "" }),
    {} as Record<PhotoKey, string>,
  );
}

export function PickupModal({
  open,
  reservation,
  vehicles,
  onOpenChange,
  onConfirm,
}: PickupModalProps) {
  const [requesterName, setRequesterName] = useState("");
  const [tookReservedVehicle, setTookReservedVehicle] = useState(true);
  const [usedVehicleId, setUsedVehicleId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [kmStart, setKmStart] = useState("");
  const [fuelLevel, setFuelLevel] = useState("");
  const [vehicleCondition, setVehicleCondition] = useState("");
  const [damages, setDamages] = useState("");
  const [checklist, setChecklist] = useState(createChecklistState);
  const [notes, setNotes] = useState("");
  const [destination, setDestination] = useState("");
  const [photos, setPhotos] = useState(createPhotoState);
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const [isDraftReady, setIsDraftReady] = useState(false);
  /* Espelha as fotos para grava-las sem depender do estado da renderizacao. */
  const photosRef = useRef(photos);
  const loadedReservationIdRef = useRef<string | undefined>(undefined);

  const reservedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === reservation?.requestedVehicleId),
    [reservation?.requestedVehicleId, vehicles],
  );
  const reservedVehicleKm = reservedVehicle?.km;
  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === usedVehicleId),
    [usedVehicleId, vehicles],
  );

  /*
   * A exigencia segue o veiculo que saiu de fato, nao o reservado: sem isso
   * bastaria reservar o carro de apoio e retirar outro para escapar das fotos.
   * Veiculo desconhecido cai no caso mais rigoroso.
   */
  const photoItems = useMemo(
    () => (selectedVehicle?.simplifiedChecklist ? [panelPhotoItem] : allPhotoItems),
    [selectedVehicle?.simplifiedChecklist],
  );

  const hasRequiredPhotos = photoItems
    .filter((item) => item.required)
    .every((item) => Boolean(photos[item.key]));

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    if (!open || !reservation) {
      loadedReservationIdRef.current = undefined;
      setIsDraftReady(false);
      return;
    }

    /*
     * O guarda por id e o que impede o formulario de se apagar sozinho: a frota
     * e recarregada a cada volta ao app (inclusive ao voltar da camera) e o
     * objeto da reserva vem novo em folha, sem que nada tenha mudado de fato.
     */
    if (loadedReservationIdRef.current === reservation.id) return;
    loadedReservationIdRef.current = reservation.id;

    const reservationId = reservation.id;
    let isCurrentDraft = true;
    setIsDraftReady(false);
    markPickupInProgress(reservationId);

    const savedFields = readPickupDraftFields<ChecklistKey>(reservationId);
    if (savedFields) {
      setRequesterName(savedFields.requesterName);
      setTookReservedVehicle(savedFields.tookReservedVehicle);
      setUsedVehicleId(savedFields.usedVehicleId);
      setDate(savedFields.date);
      setTime(savedFields.time);
      setKmStart(savedFields.kmStart);
      setFuelLevel(savedFields.fuelLevel);
      setVehicleCondition(savedFields.vehicleCondition);
      setDamages(savedFields.damages);
      setChecklist(savedFields.checklist);
      setNotes(savedFields.notes);
      setDestination(savedFields.destination ?? "");
    } else {
      const now = new Date();
      setRequesterName(reservation.requesterName);
      setTookReservedVehicle(true);
      setUsedVehicleId(reservation.requestedVehicleId);
      setDate(formatLocalDate(now));
      setTime(formatLocalTime(now));
      setKmStart(String(reservedVehicleKm ?? ""));
      setFuelLevel("");
      setVehicleCondition("");
      setDamages("");
      setChecklist(createChecklistState());
      setNotes("");
      setDestination("");
    }

    // As fotos moram no IndexedDB, entao chegam um instante depois dos campos.
    void readPickupPhotos<PhotoKey>(reservationId).then((savedPhotos) => {
      if (!isCurrentDraft) return;
      setPhotos({ ...createPhotoState(), ...savedPhotos });
      setIsDraftReady(true);
      if (savedFields) {
        toast.info("Checklist de retirada restaurado.");
      }
    });

    return () => {
      isCurrentDraft = false;
    };
    // O KM do veiculo entra pelo efeito abaixo: incluir aqui faria a leitura de
    // quilometragem, que se repete a cada 30s, reiniciar o checklist.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reservation]);

  /*
   * Quando o modal abre antes de a frota chegar, o KM da retirada nasce vazio.
   * Este efeito o preenche assim que o veiculo aparece, sem tocar no que o
   * motorista ja digitou nem no que veio do rascunho.
   */
  useEffect(() => {
    if (!open || !isDraftReady) return;
    if (kmStart !== "" || reservedVehicleKm === undefined) return;
    if (!tookReservedVehicle) return;

    setKmStart(String(reservedVehicleKm));
  }, [isDraftReady, kmStart, open, reservedVehicleKm, tookReservedVehicle]);

  useEffect(() => {
    if (!open || !reservation || !isDraftReady) return;

    savePickupDraftFields<ChecklistKey>(reservation.id, {
      requesterName,
      tookReservedVehicle,
      usedVehicleId,
      date,
      time,
      kmStart,
      fuelLevel,
      vehicleCondition,
      damages,
      checklist,
      notes,
      destination,
    });
  }, [
    checklist,
    damages,
    date,
    destination,
    fuelLevel,
    isDraftReady,
    kmStart,
    notes,
    open,
    requesterName,
    reservation,
    time,
    tookReservedVehicle,
    usedVehicleId,
    vehicleCondition,
  ]);

  if (!reservation) return null;
  const currentReservation = reservation;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasRequiredPhotos || isPreparingPhoto) return;
    if (!destination.trim()) {
      toast.error("Informe para onde o veiculo sera utilizado.");
      return;
    }

    /*
     * O backend guarda uma unica photo_url por registro, entao as fotos viram
     * uma colagem so — com a legenda de cada uma — igual ao que era feito antes
     * do checklist ser simplificado. Com uma foto apenas nao ha o que montar.
     */
    const filledPhotos = photoItems.filter((item) => photos[item.key]);
    const photoDataUrl =
      filledPhotos.length === 1
        ? photos[filledPhotos[0].key]
        : await buildPhotoChecklistDataUrl(
            filledPhotos.map((item) => ({ label: item.label, dataUrl: photos[item.key] })),
          );

    const success = await onConfirm({
      reservationId: currentReservation.id,
      requesterName,
      usedVehicleId,
      tookReservedVehicle,
      date,
      time,
      kmStart: Number(kmStart),
      fuelLevel: "",
      vehicleCondition: "",
      damages: "",
      // Mesmo formato do checklist de devolucao: linhas "- Item: valor" e um
      // bloco "Observacoes" no fim. E o que parseChecklistNotes (AdminPanel)
      // espera para exibir o checklist em tabela em vez de texto cru.
      notes: buildChecklistNotes({
        title: "Checklist de retirada",
        rows: [
          ["Destino", destination.trim()],
          ...checklistItems.map(
            (item) => [item.label, checklist[item.key] ? "Sim" : "Nao"] as [string, string],
          ),
        ],
        notes,
      }),
      photoDataUrl,
    });
    if (success !== false) {
      await clearPickupDraft(currentReservation.id);
    }
  }

  async function handlePhotoChange(key: PhotoKey, file?: File) {
    if (!file) return;
    setIsPreparingPhoto(true);
    try {
      const dataUrl = await imageFileToDataUrl(file);
      const nextPhotos = { ...photosRef.current, [key]: dataUrl };
      photosRef.current = nextPhotos;
      setPhotos(nextPhotos);
      /*
       * Grava antes da proxima ida a camera — e nela que o sistema costuma
       * reiniciar o app, e o que nao estiver salvo aqui se perde.
       */
      await savePickupPhotos<PhotoKey>(currentReservation.id, nextPhotos);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel preparar esta foto.");
    } finally {
      setIsPreparingPhoto(false);
    }
  }

  function toggleChecklist(key: ChecklistKey, checked: boolean) {
    setChecklist((current) => ({ ...current, [key]: checked }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar retirada</DialogTitle>
          <DialogDescription>
            {currentReservation.vehicleName} - {currentReservation.plate}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do solicitante" htmlFor="pickupRequester">
              <Input id="pickupRequester" value={requesterName} readOnly className="bg-muted" />
            </Field>
            <Field label="Veiculo reservado" htmlFor="reservedVehicle">
              <Input
                id="reservedVehicle"
                value={reservedVehicle?.plate ?? currentReservation.plate}
                readOnly
              />
            </Field>
          </div>

          <div className="rounded-lg border border-border bg-muted p-4">
            <p className="text-sm font-medium text-foreground">Retirou o veiculo reservado?</p>
            <div className="mt-3 flex gap-3">
              <Button
                type="button"
                variant={tookReservedVehicle ? "default" : "outline"}
                onClick={() => {
                  setTookReservedVehicle(true);
                  setUsedVehicleId(currentReservation.requestedVehicleId);
                  setKmStart(String(reservedVehicle?.km ?? ""));
                }}
                className={tookReservedVehicle ? " " : ""}
              >
                Sim
              </Button>
              <Button
                type="button"
                variant={!tookReservedVehicle ? "default" : "outline"}
                onClick={() => setTookReservedVehicle(false)}
              >
                Nao
              </Button>
            </div>
          </div>

          {!tookReservedVehicle ? (
            <Field label="Veiculo realmente retirado" htmlFor="usedVehicleId">
              <NativeSelect
                id="usedVehicleId"
                value={usedVehicleId}
                onChange={(event) => {
                  const nextVehicleId = event.target.value;
                  const nextVehicle = vehicles.find((vehicle) => vehicle.id === nextVehicleId);
                  setUsedVehicleId(nextVehicleId);
                  setKmStart(String(nextVehicle?.km ?? ""));
                }}
                className="w-full"
                required
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          ) : null}

          <div>
            <Field label="KM na retirada" htmlFor="kmStart">
              <Input
                id="kmStart"
                type="number"
                min={selectedVehicle?.km ?? 0}
                value={kmStart}
                onChange={(event) => setKmStart(event.target.value)}
                required
              />
            </Field>
          </div>

          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {photoItems.length > 1 ? "Fotos obrigatorias" : "Foto obrigatoria"}
              </h3>
              {photoItems.length > 1 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Tire uma foto de cada lado mostrando o veiculo inteiro, de frente a tras. Sao elas
                  que provam o estado do carro na saida.
                </p>
              ) : null}
            </div>
            <div className={photoItems.length > 1 ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"}>
              {photoItems.map((item) => (
                <PhotoField
                  key={item.key}
                  id={`pickupPhoto-${item.key}`}
                  label={item.label}
                  required={item.required}
                  previewUrl={photos[item.key]}
                  onChange={(file) => {
                    void handlePhotoChange(item.key, file);
                  }}
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Checklist do veiculo</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Confira cada item antes de sair. O que ficar desmarcado sera registrado como
                &quot;Nao&quot; no historico da retirada.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {checklistItems.map((item) => (
                <label
                  key={item.key}
                  className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2 text-sm text-foreground"
                >
                  <Checkbox
                    checked={checklist[item.key]}
                    onCheckedChange={(checked) => toggleChecklist(item.key, checked === true)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </section>

          <Field label="Local de destino" htmlFor="pickupDestination">
            <Input
              id="pickupDestination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Ex.: cliente, filial ou endereco"
              required
            />
          </Field>

          <div className="space-y-3">
            <UrgentWhatsAppNotice />

            <Field label="Observacoes (opcional)" htmlFor="pickupNotes">
              <Textarea
                id="pickupNotes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-24"
                placeholder="Registre algum problema ou outra observacao sobre o veiculo."
              />
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void clearPickupDraft(currentReservation.id);
                onOpenChange(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!hasRequiredPhotos || isPreparingPhoto}>
              {isPreparingPhoto ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Confirmar retirada
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function PhotoField({
  id,
  label,
  required,
  previewUrl,
  onChange,
}: {
  id: string;
  label: string;
  required: boolean;
  previewUrl: string;
  onChange: (file?: File) => void;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <Input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => onChange(event.target.files?.[0])}
        required={required}
      />
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={`Previa - ${label}`}
          className="mt-3 h-32 w-full rounded-md border border-border object-cover"
        />
      ) : (
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Camera className="h-4 w-4" />
          {required ? "Foto obrigatoria." : "Foto opcional."}
        </p>
      )}
    </Field>
  );
}

function buildChecklistNotes({
  title,
  rows,
  notes,
}: {
  title: string;
  rows: Array<[string, string]>;
  notes: string;
}) {
  const checklistText = rows.map(([label, value]) => `- ${label}: ${value}`).join("\n");
  const trimmedNotes = notes.trim();
  return `${title}\n${checklistText}\n\nObservacoes:\n${trimmedNotes || "Sem observacoes."}`;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLocalTime(date: Date) {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}
