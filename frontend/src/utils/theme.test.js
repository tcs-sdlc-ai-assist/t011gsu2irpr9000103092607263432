import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTheme, setTheme, toggleTheme } from "./theme";

/** Reset theme state and storage spies between utility tests. */
beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

/** Restore browser APIs after each utility test. */
afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.classList.remove("dark");
});

describe("theme utilities", () => {
  it("defaults missing and invalid stored values to light", () => {
    expect(getTheme()).toBe("light");

    localStorage.setItem("writespace_theme", "sepia");
    expect(getTheme()).toBe("light");
  });

  it("returns dark only when dark is stored", () => {
    localStorage.setItem("writespace_theme", "dark");

    expect(getTheme()).toBe("dark");
  });

  it("persists and applies dark mode", () => {
    expect(setTheme("dark")).toBe("dark");

    expect(localStorage.getItem("writespace_theme")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("normalizes other values to light and removes the dark class", () => {
    document.documentElement.classList.add("dark");

    expect(setTheme("unexpected")).toBe("light");
    expect(localStorage.getItem("writespace_theme")).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("toggles from light to dark and back", () => {
    expect(toggleTheme()).toBe("dark");
    expect(localStorage.getItem("writespace_theme")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");

    expect(toggleTheme()).toBe("light");
    expect(localStorage.getItem("writespace_theme")).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("returns light when storage cannot be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage unavailable");
    });

    expect(getTheme()).toBe("light");
  });

  it("still updates the document class when storage cannot be written", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage unavailable");
    });

    expect(setTheme("dark")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");

    expect(setTheme("light")).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });
});
