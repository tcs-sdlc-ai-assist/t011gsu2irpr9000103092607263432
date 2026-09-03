import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import tailwindConfig from "../../tailwind.config";
import htmlSource from "../../index.html?raw";
import AuthenticatedShell from "../components/AuthenticatedShell";
import PublicShell from "../components/PublicShell";
import ThemeToggle from "../components/ThemeToggle";
import LandingPage from "./LandingPage";

const adminSession = {
  userId: "admin-1",
  username: "admin",
  displayName: "Admin Writer",
  role: "Admin",
};

/** Render a component with the router context used by navigational controls. */
function renderWithRouter(element, path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      {element}
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("NolanAI-inspired visual foundation", () => {
  it("uses the audited font and ink/signal Tailwind tokens without removing class dark mode", () => {
    expect(tailwindConfig.darkMode).toBe("class");
    expect(tailwindConfig.plugins).toEqual([]);
    expect(tailwindConfig.theme.extend.fontFamily.sans).toEqual([
      "Lexend Deca",
      "ui-sans-serif",
      "system-ui",
      "sans-serif",
    ]);
    expect(tailwindConfig.theme.extend.colors).toMatchObject({
      ink: { 950: "#191b1f", 900: "#222429", 800: "#2b2e34" },
      signal: { 400: "#2c79ea", 500: "#1d6ee3", 600: "#175fc8" },
    });
    expect(htmlSource).toMatch(
      /rel="preload"[\s\S]*href="\/fonts\/lexend-deca\.woff2"[\s\S]*type="font\/woff2"[\s\S]*crossorigin/,
    );
  });

  it("renders an asymmetric ink/signal hero without the banned gradient palette", () => {
    renderWithRouter(<LandingPage />);

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Your thoughts. Your space. Beautifully simple.",
    });
    const hero = heading.closest("section");
    expect(hero).toHaveClass("bg-[#f4f4f7]", "dark:bg-ink-950");
    expect(hero.innerHTML).toContain("lg:grid-cols-[1.1fr_0.9fr]");
    expect(hero.innerHTML).toContain("bg-signal-500");
    expect(hero.className).not.toMatch(/from-indigo|via-violet|to-pink/);
    expect(hero.innerHTML).not.toMatch(/from-indigo|via-violet|to-pink/);
  });

  it("uses only bundled hero images with one eager LCP image and lazy support images", () => {
    renderWithRouter(<LandingPage />);

    const mountains = screen.getByAltText("Mountain landscape inspiring a new story");
    const books = screen.getByAltText("Open books ready for reading and research");
    const coffee = screen.getByAltText("Coffee beside a quiet writing space");
    const heroImages = [mountains, books, coffee];

    heroImages.forEach((image) => {
      expect(image.getAttribute("src")).toMatch(/^\/images\/free\/(mountains|books|coffee)\.jpg$/);
      expect(image.getAttribute("src")).not.toMatch(/^https?:/);
    });
    expect(mountains).toHaveAttribute("loading", "eager");
    expect(mountains).toHaveAttribute("fetchpriority", "high");
    expect(books).toHaveAttribute("loading", "lazy");
    expect(coffee).toHaveAttribute("loading", "lazy");
  });

  it("keeps public shell links while exposing a sticky translucent pill navigation and mobile panel", async () => {
    const user = userEvent.setup();
    renderWithRouter(<PublicShell><h1>Public content</h1></PublicShell>);

    const header = screen.getByRole("banner");
    const desktopNavigation = screen.getByRole("navigation", { name: "Public navigation" });
    expect(header).toHaveClass("sticky", "top-0", "z-20", "backdrop-blur-xl");
    expect(desktopNavigation).toHaveClass("whitespace-nowrap");
    expect(within(desktopNavigation).getByRole("link", { name: "Home" })).toHaveClass("rounded-full");
    expect(within(desktopNavigation).getByRole("link", { name: "Create account" })).toHaveClass(
      "rounded-full",
      "bg-signal-500",
    );

    const menuButton = screen.getByRole("button", { name: "Toggle navigation menu" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    const mobileNavigation = screen.getByRole("navigation", { name: "Mobile public navigation" });
    expect(mobileNavigation.firstElementChild).toHaveClass("rounded-2xl", "dark:bg-ink-900");
    expect(within(mobileNavigation).getByRole("link", { name: "Stories" })).toHaveAttribute("href", "/blogs");
  });

  it("keeps authenticated role-aware routes and ghost logout inside the matching shell system", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <AuthenticatedShell session={adminSession}>
        <h1>Admin content</h1>
      </AuthenticatedShell>,
      "/blogs",
    );

    const header = screen.getByRole("banner");
    expect(header).toHaveClass("sticky", "backdrop-blur-xl", "dark:border-slate-700");
    expect(screen.getByRole("link", { name: "WriteSpace" })).toHaveAttribute("href", "/blogs");
    const desktopNavigation = screen.getByRole("navigation", { name: "Authenticated navigation" });
    expect(within(desktopNavigation).getByRole("link", { name: "User management" })).toHaveAttribute("href", "/users");
    expect(within(desktopNavigation).getByRole("button", { name: "Log out" })).toHaveClass("rounded-full", "border");

    await user.click(screen.getByRole("button", { name: "Toggle navigation menu" }));
    expect(
      within(screen.getByRole("navigation", { name: "Mobile authenticated navigation" }))
        .getByRole("link", { name: "Admin" }),
    ).toHaveAttribute("href", "/admin");
  });

  it("keeps the exact accessible theme toggle contract with signal focus and tactile styling", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const toggle = screen.getByRole("button", { name: "Toggle dark mode" });
    expect(toggle).toHaveClass(
      "h-9",
      "w-9",
      "rounded-full",
      "focus-visible:ring-signal-500",
      "transition-colors",
      "active:scale-[0.98]",
    );
    expect(toggle).toHaveTextContent("🌙");
    await user.click(toggle);
    expect(toggle).toHaveTextContent("☀️");
    expect(document.documentElement).toHaveClass("dark");
  });
});