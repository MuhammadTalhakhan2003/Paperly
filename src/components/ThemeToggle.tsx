"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore storage errors */
    }
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      className="btn btn-secondary btn-icon"
      aria-label="Toggle light and dark theme"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {/* Avoid a hydration mismatch: render a neutral icon until mounted */}
      <span aria-hidden>{!mounted ? "◐" : theme === "dark" ? "☀" : "☾"}</span>
    </button>
  );
}
