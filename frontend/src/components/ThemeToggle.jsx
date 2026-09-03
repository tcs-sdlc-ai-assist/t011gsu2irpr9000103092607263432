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
      className="w-fit rounded-md px-2.5 py-2 text-base leading-none text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-slate-950"
      onClick={handleClick}
    >
      <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
