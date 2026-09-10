import { DoorOpen } from "lucide-react";
import { useEffect, useState } from "react";

interface RoomPhotoProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

/*
 * Foto da sala com queda suave.
 *
 * Uma sala pode estar cadastrada antes de alguem tirar a foto — foi o caso da
 * Sala 1 no cadastro inicial. Sem isto, o card mostraria o icone de imagem
 * quebrada do navegador, que parece defeito do sistema. Aqui a ausencia vira
 * um espaco neutro com o icone de porta: le-se como "sem foto ainda".
 */
export function RoomPhoto({ src, alt, className = "", loading = "lazy" }: RoomPhotoProps) {
  const [hasFailed, setHasFailed] = useState(false);

  // Trocar de sala precisa dar nova chance à imagem: sem isto, uma falha
  // deixaria o espaço vazio mesmo depois de selecionar uma sala com foto.
  useEffect(() => {
    setHasFailed(false);
  }, [src]);

  if (!src || hasFailed) {
    return (
      <span
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
        role="img"
        aria-label={`${alt} (sem foto cadastrada)`}
      >
        <DoorOpen className="h-1/4 max-h-10 w-auto opacity-50" aria-hidden />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      onError={() => setHasFailed(true)}
    />
  );
}
