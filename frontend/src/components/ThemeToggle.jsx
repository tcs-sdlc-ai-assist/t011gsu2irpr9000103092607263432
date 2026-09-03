import { useState } from "react";
import { getTheme, toggleTheme } from "../utils/theme";

/**
 * Render an accessible control that switches the saved color theme.
 *
 * Returns:
 *   The theme toggle button.
 */
export default function ThemeToggle() {
  const [theme, setCurrentTheme] = useState(getTheme);

  /** Apply the opposite theme and update the visible icon. */
  function handleClick() {
    setCurrentTheme(toggleTheme());
  }

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-base leading-none text-slate-600 transition-colors duration-200 hover:bg-black/5 hover:text-ink-950 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:!border-white/15 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:!bg-white/10 dark:hover:text-white dark:focus-visible:ring-signal-400 dark:focus-visible:ring-offset-slate-950"
      onClick={handleClick}
    >
      <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
