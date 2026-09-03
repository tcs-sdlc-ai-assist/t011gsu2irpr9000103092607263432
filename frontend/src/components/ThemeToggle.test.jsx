import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ThemeToggle from "./ThemeToggle";

/** Reset persisted and applied theme state before each component test. */
beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

/** Restore browser APIs and root classes after each component test. */
afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.classList.remove("dark");
});

describe("ThemeToggle", () => {
  it("renders an accessible moon button for the default light theme", () => {
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: "Toggle dark mode" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveTextContent("🌙");
  });

  it("switches to dark mode, persists it, and shows the sun", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Toggle dark mode" }));

    expect(localStorage.getItem("writespace_theme")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(screen.getByRole("button", { name: "Toggle dark mode" })).toHaveTextContent("☀️");
  });

  it("switches back to light mode after a second click", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Toggle dark mode" });

    await user.click(button);
    await user.click(button);

    expect(localStorage.getItem("writespace_theme")).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(button).toHaveTextContent("🌙");
  });

  it("initializes with the sun when dark is stored", () => {
    localStorage.setItem("writespace_theme", "dark");

    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Toggle dark mode" })).toHaveTextContent("☀️");
  });

  it("updates the class and icon when persistence fails", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage unavailable");
    });
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Toggle dark mode" }));

    expect(document.documentElement).toHaveClass("dark");
    expect(screen.getByRole("button", { name: "Toggle dark mode" })).toHaveTextContent("☀️");
  });
});
