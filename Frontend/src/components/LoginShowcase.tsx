import { Pause, Play } from "lucide-react";
import { type AnimationEvent, useEffect, useRef, useState } from "react";

const CAR_IMAGE = "/makercar-assets/kwid-white.webp";
const DOG_IMAGE = "/makercar-assets/robo-cachorro.webp";
const ROOM_IMAGE = "/makercar-assets/sala-1.jpg";

/* A ordem segue o titulo: veiculos, equipamentos e salas. */
const SCENES = ["veiculos", "equipamentos", "salas"] as const;

interface LoginShowcaseProps {
  /** "panel" e o painel azul do computador; "compact", a faixa do celular. */
  variant: "panel" | "compact";
}

/*
 * Vitrine animada do login.
 *
 * Mostra o que se reserva no sistema, um item por vez, cada um com o gesto de
 * chegada do mundo real: o carro para e pisca os farois, como quando se
 * destrava pela chave; o robo cachorro chega trotando; a sala acende as
 * lampadas. A palavra do titulo que corresponde a cena acende e ganha um
 * sublinhado que enche no tempo da cena, entao o titulo e tambem o indice.
 *
 * O tempo e todo do CSS: a cena troca quando o sublinhado termina de encher
 * (animationend). Assim nada se desencontra quando a aba fica em segundo plano
 * e o navegador congela as animacoes.
 */
export function LoginShowcase({ variant }: LoginShowcaseProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isStatic, setIsStatic] = useState(false);
  const isCompact = variant === "compact";

  // Quem pediu menos movimento no sistema ve so o carro, parado.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setIsStatic(query.matches);
      if (query.matches) setScene(0);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /*
   * Baixa as fotos das proximas cenas enquanto o carro ainda esta na tela, para
   * nao entrarem pela metade. So a vitrine visivel faz isso: a outra variante
   * fica escondida pelo CSS e nao precisa de nada.
   */
  useEffect(() => {
    if (isStatic) return;
    const timer = window.setTimeout(() => {
      if (!rootRef.current || rootRef.current.offsetParent === null) return;
      for (const src of [DOG_IMAGE, ROOM_IMAGE]) {
        const image = new Image();
        image.src = src;
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [isStatic]);

  function handleProgressEnd(event: AnimationEvent<HTMLSpanElement>) {
    if (event.animationName !== "login-progress") return;
    setScene((current) => (current + 1) % SCENES.length);
  }

  // A pontuacao fica colada na palavra: sem isso a virgula caia sozinha na
  // linha de baixo, porque a palavra e um bloco em linha.
  const word = (index: number, text: string, punctuation = "") => {
    const isActive = isStatic || index === scene;
    return (
      <span className="whitespace-nowrap">
        <span
          className={`login-word ${
            isActive ? "text-brand-panel-foreground" : "text-brand-panel-foreground/45"
          }`}
        >
          {text}
          {!isStatic && index === scene ? (
            <span className="login-track" aria-hidden>
              <span key={scene} className="login-progress" onAnimationEnd={handleProgressEnd} />
            </span>
          ) : null}
        </span>
        {punctuation}
      </span>
    );
  };

  return (
    <div
      ref={rootRef}
      className={`login-showcase relative flex min-w-0 flex-col ${isCompact ? "" : "flex-1"}`}
      data-paused={isPaused ? "" : undefined}
      data-static={isStatic ? "" : undefined}
    >
      <div className={isCompact ? "mt-4" : "my-auto max-w-xl py-10"}>
        <h1
          className={
            isCompact
              ? "text-balance text-[1.5rem] font-bold leading-[1.15] tracking-tight"
              : "text-balance text-[clamp(2.5rem,3.3vw,3.4rem)] font-bold leading-[1.08] tracking-tight"
          }
        >
          Reserve {word(0, "veículos", ",")} {word(1, "equipamentos")} e {word(2, "salas")} da MKR.
        </h1>
        {isCompact ? null : (
          <p className="mt-5 max-w-md text-base leading-7 text-brand-panel-foreground/80">
            Entre com a sua conta para ver o que está livre, fazer a reserva e acompanhar o seu
            histórico.
          </p>
        )}
      </div>

      <div
        className={`relative shrink-0 ${
          isCompact ? "-mx-5 h-[clamp(96px,16vh,170px)]" : "-mx-10 h-[clamp(260px,42vh,420px)]"
        }`}
      >
        <div className="login-stage absolute inset-0">
          <div className="login-glow" aria-hidden />
          <div className="login-floor" aria-hidden />
          <div key={scene} className="login-scene">
            {SCENES[scene] === "veiculos" ? <CarScene /> : null}
            {SCENES[scene] === "equipamentos" ? <DogScene /> : null}
            {SCENES[scene] === "salas" ? <RoomScene /> : null}
          </div>
        </div>

        {isStatic ? null : (
          <button
            type="button"
            onClick={() => setIsPaused((current) => !current)}
            aria-label={isPaused ? "Retomar animação" : "Pausar animação"}
            title={isPaused ? "Retomar animação" : "Pausar animação"}
            className={`absolute bottom-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-brand-panel-foreground/80 ring-1 ring-white/20 transition-colors hover:bg-white/20 hover:text-brand-panel-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              isCompact ? "right-3" : "right-10"
            }`}
          >
            {isPaused ? (
              <Play className="h-4 w-4" aria-hidden />
            ) : (
              <Pause className="h-4 w-4" aria-hidden />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function CarScene() {
  return (
    <div className="login-car-drive">
      <div className="login-car-body">
        <span className="login-shadow login-shadow--car" aria-hidden />
        <img src={CAR_IMAGE} alt="Renault Kwid branco da frota da MKR" decoding="async" />
        {/* Farois: posicao medida sobre a foto do Kwid. */}
        <span className="login-headlight" style={{ left: "19.5%", top: "51.5%" }} aria-hidden />
        <span className="login-headlight" style={{ left: "45%", top: "53%" }} aria-hidden />
      </div>
    </div>
  );
}

function DogScene() {
  return (
    <div className="login-dog-walk">
      <div className="login-dog-trot">
        <span className="login-shadow login-shadow--dog" aria-hidden />
        <img src={DOG_IMAGE} alt="Robô cachorro da MKR" decoding="async" />
      </div>
    </div>
  );
}

function RoomScene() {
  return (
    <figure className="login-room">
      <img src={ROOM_IMAGE} alt="Sala de reunião 1 da MKR" decoding="async" />
    </figure>
  );
}
