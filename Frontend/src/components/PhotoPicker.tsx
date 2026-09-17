import { Camera, Images } from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

interface PhotoPickerProps {
  id: string;
  label: string;
  previewUrl: string;
  /** Texto mostrado enquanto nao ha foto ("Foto obrigatoria."). */
  hint: string;
  onChange: (file?: File) => void;
}

/*
 * Foto dos checklists de retirada e devolucao, pela camera ou pela galeria.
 *
 * Um input com `capture` abre direto a camera e nao deixa escolher uma foto ja
 * tirada; sem `capture`, cada navegador decide se oferece a camera no menu.
 * Dois inputs escondidos, um de cada jeito, deixam a escolha explicita e a um
 * toque.
 *
 * Nenhum dos dois e `required`: a foto pode ter voltado do rascunho com o input
 * vazio, e a validacao nativa travaria o envio. Quem exige a foto e o
 * formulario, pelo botao de confirmar.
 */
export function PhotoPicker({ id, label, previewUrl, hint, onChange }: PhotoPickerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Sem limpar, escolher de novo o mesmo arquivo nao dispararia o onChange.
    event.target.value = "";
    onChange(file);
  }

  return (
    <div id={id} role="group" aria-label={label}>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full px-3"
          aria-label={`Tirar foto: ${label}`}
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera />
          Tirar foto
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full px-3"
          aria-label={`Galeria: ${label}`}
          onClick={() => galleryInputRef.current?.click()}
        >
          <Images />
          Galeria
        </Button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={handleChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={handleChange}
      />

      {previewUrl ? (
        <img
          src={previewUrl}
          alt={`Prévia - ${label}`}
          className="mt-3 h-32 w-full rounded-md border border-border object-cover"
        />
      ) : (
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Camera className="h-4 w-4" />
          {hint}
        </p>
      )}
    </div>
  );
}
