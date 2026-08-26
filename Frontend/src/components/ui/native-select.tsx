import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/*
 * Select nativo com a aparencia do design system.
 *
 * Preferimos o <select> do navegador ao menu do Radix nos filtros e nas
 * tabelas: no celular ele abre a roda nativa, que e mais rapida de usar do
 * que uma lista custom. O que fazemos aqui e so vesti-lo — remover a seta
 * padrao do sistema (que ignora o tema escuro no Windows) e desenhar a
 * nossa por cima.
 *
 * Importante: o <option> continua sendo pintado pelo sistema operacional,
 * entao definimos bg/color nele tambem — sem isso a lista aberta fica com
 * texto claro em fundo claro no tema escuro.
 */
const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { sizeVariant?: "sm" | "default" }
>(({ className, children, sizeVariant = "default", ...props }, ref) => {
  return (
    <div className="relative inline-flex w-full items-center">
      <select
        ref={ref}
        className={cn(
          [
            "w-full appearance-none rounded-md border border-input bg-card pr-8 text-foreground shadow-xs",
            "transition-[border-color,box-shadow] duration-150 ease-out",
            "hover:border-border-strong",
            "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
            "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
            "[&>option]:bg-elevated [&>option]:text-foreground",
            sizeVariant === "sm" ? "h-8 pl-2.5 text-xs" : "h-9 pl-3 text-sm",
          ].join(" "),
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className={cn(
          "pointer-events-none absolute right-2.5 shrink-0 text-muted-foreground",
          sizeVariant === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
        )}
        aria-hidden
      />
    </div>
  );
});
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
