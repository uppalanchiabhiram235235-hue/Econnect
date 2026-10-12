import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const KEY = 'econnect.theme';

const systemPrefersDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

export function ThemeProvider({ children }) {
  // null = follow the operating system
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return saved === 'light' || saved === 'dark' ? saved : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.setAttribute('data-theme', theme);
    else root.removeAttribute('data-theme');
    try {
      if (theme) localStorage.setItem(KEY, theme);
      else localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);

  const isDark = theme ? theme === 'dark' : systemPrefersDark();
  const toggle = useCallback(() => setTheme(isDark ? 'light' : 'dark'), [isDark]);
  const value = useMemo(() => ({ theme, isDark, toggle }), [theme, isDark, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
