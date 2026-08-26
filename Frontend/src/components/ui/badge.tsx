import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * Badge de estado.
 *
 * As variantes `*-subtle` sao as usadas no dia a dia do sistema (status de
 * veiculo e de reserva): fundo suave, texto de alto contraste e anel discreto.
 * As variantes solidas ficam para contagens e destaques pontuais.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5 transition-colors duration-150",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-danger text-danger-foreground",
        outline: "border-border text-foreground",

        success: "border-success/20 bg-success-subtle text-success-subtle-foreground",
        warning: "border-warning/20 bg-warning-subtle text-warning-subtle-foreground",
        info: "border-info/20 bg-info-subtle text-info-subtle-foreground",
        danger: "border-danger/20 bg-danger-subtle text-danger-subtle-foreground",
        neutral: "border-border-strong bg-neutral-subtle text-neutral-subtle-foreground",
        brand: "border-primary/20 bg-primary-subtle text-primary-subtle-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** Bolinha colorida antes do texto — ajuda a ler o estado sem depender so da cor de fundo. */
  dot?: string;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot ? <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} aria-hidden /> : null}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
