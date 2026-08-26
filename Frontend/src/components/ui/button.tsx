import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/*
 * Linguagem de botao do MakerCar.
 *
 * Todas as variantes compartilham a mesma mecanica de interacao:
 *   hover   escurece/realca levemente
 *   active  afunda 1px (translate-y) — resposta tatil, sem exagero
 *   focus   anel de 2px no --ring, sempre visivel para teclado
 *   disabled  50% de opacidade, sem ponteiro
 *
 * Transicoes em 150ms: rapidas o bastante para nao atrasar, lentas o
 * bastante para nao piscar.
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md",
    "text-sm font-medium cursor-pointer select-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out",
    "active:translate-y-px",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/95",
        destructive:
          "bg-danger text-danger-foreground shadow-xs hover:bg-danger/90 active:bg-danger/95",
        success:
          "bg-success text-success-foreground shadow-xs hover:bg-success/90 active:bg-success/95",
        outline:
          "border border-border bg-card text-foreground shadow-xs hover:border-border-strong hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/70 active:bg-secondary/80",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Troca o conteudo por um spinner e bloqueia o clique.
   * Ignorado com asChild, que renderiza o filho como esta.
   */
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, isLoading = false, children, disabled, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    if (asChild) {
      return (
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
