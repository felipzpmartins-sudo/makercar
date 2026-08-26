import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const THEME_KEY = "makercar:theme";

/**
 * Script injetado no <head> antes da hidratacao.
 *
 * Sem ele a pagina pinta clara no primeiro frame e pisca ao trocar para o
 * escuro. Precisa ser sincrono, minusculo e nao depender de nada do bundle.
 * Mantenha em sincronia com resolveTheme() abaixo.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" || value === "system" ? value : "system";
  } catch {
    return "system";
  }
}

function prefersDark() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Converte a preferencia ("system") no tema efetivamente aplicado. */
function resolveTheme(theme: Theme) {
  return theme === "dark" || (theme === "system" && prefersDark()) ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  // colorScheme faz o navegador pintar scrollbars e controles nativos no tom certo.
  document.documentElement.style.colorScheme = resolved;
}

/**
 * Preferencia de tema do usuario, persistida no navegador.
 *
 * Retorna tambem `resolvedTheme` ("light" | "dark"), que e o tema realmente
 * aplicado — util quando a preferencia e "system".
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  // Antes de montar no cliente nao sabemos o tema real; o toggle usa isso
  // para nao renderizar um icone que muda sozinho logo apos a hidratacao.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    setResolvedTheme(resolveTheme(stored));
    applyTheme(stored);
    setIsReady(true);
  }, []);

  // Enquanto a preferencia for "system", acompanha a troca no sistema operacional.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (readStoredTheme() !== "system") return;
      applyTheme("system");
      setResolvedTheme(resolveTheme("system"));
    };

    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setResolvedTheme(resolveTheme(next));
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // Navegacao privada pode bloquear a escrita: o tema vale so nesta sessao.
    }
  }, []);

  /** Alterna claro <-> escuro a partir do que esta visivel agora. */
  const toggleTheme = useCallback(() => {
    setTheme(resolveTheme(readStoredTheme()) === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { theme, resolvedTheme, isReady, setTheme, toggleTheme };
}
