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

export function PlatformSidebar({
  title = "Navegacao",
  items,
  activeId,
  onSelect,
}: PlatformSidebarProps) {
  function getItemClass(isActive: boolean) {
    return [
      "group flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
      isActive
        ? "bg-blue-50 text-blue-800 ring-1 ring-blue-100"
        : "text-slate-600 hover:bg-blue-50 hover:text-blue-700",
    ].join(" ");
  }

  function getMobileItemClass(isActive: boolean) {
    return [
      "inline-flex h-10 shrink-0 snap-start items-center gap-2 rounded-md border px-3 text-sm font-medium",
      isActive
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : "border-slate-200 bg-slate-50 text-slate-700",
    ].join(" ");
  }

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">{title}</p>
          <nav className="mt-1 space-y-1" aria-label={title}>
            {items.map((item) => {
              const isActive = item.id === activeId;
              const content = (
                <>
                  <span
                    className={`mt-0.5 [&_svg]:h-4 [&_svg]:w-4 ${
                      isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block font-medium ${
                        isActive ? "text-blue-900" : "text-slate-800 group-hover:text-blue-800"
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className="mt-0.5 block text-xs leading-4 text-slate-500">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </>
              );

              return item.href ? (
                <a key={item.id} href={item.href} className={getItemClass(isActive)}>
                  {content}
                </a>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  className={getItemClass(isActive)}
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
          className="flex max-w-[calc(100vw-1.5rem)] snap-x gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={title}
        >
          {items.map((item) => {
            const isActive = item.id === activeId;
            const content = (
              <>
                <span className="text-blue-600 [&_svg]:h-4 [&_svg]:w-4">{item.icon}</span>
                <span className="whitespace-nowrap">{item.label}</span>
              </>
            );

            return item.href ? (
              <a key={item.id} href={item.href} className={getMobileItemClass(isActive)}>
                {content}
              </a>
            ) : (
              <button
                key={item.id}
                type="button"
                className={getMobileItemClass(isActive)}
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
