import type { ReactNode } from "react";

interface PlatformNavItem {
  id: string;
  href?: string;
  label: string;
  description?: string;
  icon: ReactNode;
}

interface PlatformSidebarProps {
  title?: string;
  items: PlatformNavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
}

/*
 * Navegacao principal.
 *
 * O item ativo e marcado por tres sinais somados, nenhum deles gritante:
 * uma barra vertical na cor da marca, um fundo levemente tingido e o icone
 * colorido. No celular a mesma lista vira uma faixa rolavel horizontal.
 */
export function PlatformSidebar({
  title = "Navegacao",
  items,
  activeId,
  onSelect,
}: PlatformSidebarProps) {
  function getItemClass(isActive: boolean) {
    return [
      "group relative flex w-full items-start gap-3 rounded-md py-2.5 pl-4 pr-3 text-left text-sm",
      "transition-colors duration-150 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar",
      // Barra indicadora: cresce da altura zero para 60% quando ativa.
      "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:rounded-r-full before:bg-primary",
      "before:transition-all before:duration-200 before:ease-out before:w-[3px]",
      isActive
        ? "bg-primary-subtle/60 before:h-3/5"
        : "hover:bg-accent before:h-0 hover:before:h-2/5 hover:before:bg-border-strong",
    ].join(" ");
  }

  function getMobileItemClass(isActive: boolean) {
    return [
      "inline-flex h-9 shrink-0 snap-start items-center gap-2 rounded-md border px-3 text-sm font-medium",
      "transition-colors duration-150 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      isActive
        ? "border-primary/25 bg-primary-subtle text-primary-subtle-foreground"
        : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
    ].join(" ");
  }

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-xl border border-border bg-sidebar p-2 shadow-xs">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <nav className="space-y-0.5" aria-label={title}>
            {items.map((item) => {
              const isActive = item.id === activeId;
              const content = (
                <>
                  <span
                    className={`mt-0.5 transition-colors duration-150 [&_svg]:h-4 [&_svg]:w-4 ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block font-medium transition-colors duration-150 ${
                        isActive ? "text-primary-subtle-foreground" : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </>
              );

              return item.href ? (
                <a
                  key={item.id}
                  href={item.href}
                  className={getItemClass(isActive)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {content}
                </a>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  className={getItemClass(isActive)}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onSelect?.(item.id)}
                >
                  {content}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 lg:hidden">
        <nav
          className="flex max-w-[calc(100vw-1.5rem)] snap-x gap-2 overflow-x-auto rounded-xl border border-border bg-sidebar p-2 shadow-xs scrollbar-none"
          aria-label={title}
        >
          {items.map((item) => {
            const isActive = item.id === activeId;
            const content = (
              <>
                <span
                  className={`[&_svg]:h-4 [&_svg]:w-4 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </>
            );

            return item.href ? (
              <a
                key={item.id}
                href={item.href}
                className={getMobileItemClass(isActive)}
                aria-current={isActive ? "page" : undefined}
              >
                {content}
              </a>
            ) : (
              <button
                key={item.id}
                type="button"
                className={getMobileItemClass(isActive)}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onSelect?.(item.id)}
              >
                {content}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
