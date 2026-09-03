/** Manage the persisted WriteSpace color theme and document root class. */

const THEME_STORAGE_KEY = "writespace_theme";

/**
 * Read the saved theme, failing closed to light mode.
 *
 * Returns:
 *   The saved dark theme or the light theme fallback.
 */
export function getTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/**
 * Normalize, persist, and synchronously apply a theme.
 *
 * Args:
 *   theme: The requested theme value. Only dark selects dark mode.
 * Returns:
 *   The normalized theme that was applied.
 */
export function setTheme(theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";

  document.documentElement.classList.toggle("dark", normalizedTheme === "dark");

  try {
    localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  } catch {
    // Persistence is best-effort; the document theme is already applied.
  }

  return normalizedTheme;
}

/**
 * Flip the current theme and apply the new preference.
 *
 * Returns:
 *   The newly applied theme.
 */
export function toggleTheme() {
  const nextTheme = getTheme() === "dark" ? "light" : "dark";
  setTheme(nextTheme);
  return nextTheme;
}
