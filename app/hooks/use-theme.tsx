import * as React from "react";

const THEME_STORAGE_KEY = "theme";

function applyThemePreference(theme: "light" | "dark" | "system") {
  if (typeof window === "undefined") return;

  if (theme === "system") {
    localStorage.removeItem(THEME_STORAGE_KEY);
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } else if (theme === "dark") {
    document.documentElement.classList.add("dark");
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem(THEME_STORAGE_KEY, "light");
  }
}

export function useTheme() {
  const getInitialTheme = (): "light" | "dark" | "system" => {
    if (typeof window === "undefined") return "system";
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as
      | "light"
      | "dark"
      | null;
    return storedTheme || "system";
  };

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    applyThemePreference(getInitialTheme());

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        if (mediaQuery.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = React.useCallback((newTheme: "light" | "dark" | "system") => {
    applyThemePreference(newTheme);
  }, []);

  return { setTheme };
}
