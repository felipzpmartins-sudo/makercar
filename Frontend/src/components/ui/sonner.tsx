import { Toaster as Sonner } from "sonner";

import { useTheme } from "@/hooks/useTheme";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/*
 * Avisos do sistema.
 *
 * Duas correcoes em relacao ao padrao do shadcn:
 *  - o fundo era bg-background, a superficie MAIS escura no tema escuro, o
 *    que fazia o aviso afundar; agora usa bg-elevated, o topo da escada;
 *  - o Sonner nao sabia do nosso seletor de tema e pintava os avisos de
 *    sucesso/erro pelo esquema do sistema operacional.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      offset={16}
      gap={10}
      toastOptions={{
        classNames: {
          toast: [
            "group toast",
            "group-[.toaster]:bg-elevated group-[.toaster]:text-foreground",
            "group-[.toaster]:border group-[.toaster]:border-border",
            "group-[.toaster]:rounded-lg group-[.toaster]:shadow-lg",
          ].join(" "),
          title: "group-[.toast]:font-medium",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md",
          success: "group-[.toaster]:border-success/25",
          error: "group-[.toaster]:border-danger/25",
          warning: "group-[.toaster]:border-warning/25",
          info: "group-[.toaster]:border-info/25",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
