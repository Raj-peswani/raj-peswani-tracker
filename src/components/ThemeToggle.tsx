"use client";

import { useEffect, useState } from "react";

const themeKey = "raj-tracker-theme";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setDark(document.documentElement.classList.contains("dark")));
  }, []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem(themeKey, next ? "dark" : "light");
    setDark(next);
  }

  return <button type="button" onClick={toggleTheme} className="theme-toggle fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-[#c9ccc4] bg-white px-4 py-2.5 text-xs font-semibold shadow-lg transition hover:-translate-y-0.5" aria-label={`Switch to ${dark ? "light" : "dark"} mode`}><span aria-hidden="true">{dark ? "☀" : "☾"}</span>{dark ? "Light" : "Dark"}</button>;
}
