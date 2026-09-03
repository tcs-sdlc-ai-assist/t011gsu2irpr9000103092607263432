import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { POSTS_KEY, USERS_KEY } from "../utils/storage";

const writerSession = {
  userId: "writer-1",
  username: "writer",
  displayName: "Avery Writer",
  role: "user",
};

const adminSession = {
  userId: "admin",
  username: "admin",
  displayName: "Admin",
  role: "Admin",
};

const storedPost = {
  id: "dark-post",
  title: "A dark mode story",
  content: "Readable content on a dark reader surface.",
  authorId: "writer-1",
  authorName: "Avery Writer",
  authorRole: "user",
  createdAt: "2025-01-02T00:00:00.000Z",
};

/** Render WriteSpace at a browser route with optional local session data. */
function renderAt(path, session = null) {
  if (session) {
    localStorage.setItem("writespace_session", JSON.stringify(session));
  }
  window.history.pushState({}, "", path);
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
  vi.restoreAllMocks();
});

describe("dark page surfaces", () => {
  it("styles public landing, login, and registration surfaces for dark mode", () => {
    localStorage.setItem(POSTS_KEY, JSON.stringify([storedPost]));
    const landing = renderAt("/");

    const latestSection = screen
      .getByRole("heading", { name: "Latest stories" })
      .closest("section");
    const latestCard = screen
      .getByRole("heading", { name: storedPost.title })
      .closest("article");
    expect(latestSection).toHaveClass(
      "dark:bg-slate-900",
      "dark:text-slate-100",
    );
    expect(latestCard).toHaveClass(
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-700",
    );
    landing.unmount();

    const login = renderAt("/login");
    const loginHeading = screen.getByRole("heading", {
      name: "Log in to WriteSpace",
    });
    expect(loginHeading.closest("div")).toHaveClass(
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-700",
    );
    expect(screen.getByLabelText("Username")).toHaveClass(
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-600",
    );
    login.unmount();

    renderAt("/register");
    expect(
      screen
        .getByRole("heading", { name: "Create your account" })
        .closest("div"),
    ).toHaveClass(
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-700",
    );
    expect(screen.getByLabelText("Confirm password")).toHaveClass(
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-600",
    );
  });

  it("styles the stored blogs listing and reader surfaces with readable metadata", async () => {
    localStorage.setItem(POSTS_KEY, JSON.stringify([storedPost]));
    const listing = renderAt("/blogs", writerSession);

    const storyHeading = await screen.findByRole("heading", {
      name: storedPost.title,
    });
    const storyCard = storyHeading.closest("article");
    expect(storyHeading.closest("section")).toHaveClass(
      "dark:bg-slate-900",
      "dark:text-slate-100",
    );
    expect(storyCard).toHaveClass(
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-700",
    );
    expect(screen.getByText("Avery Writer")).toHaveClass("dark:text-slate-300");
    expect(storyCard.querySelector(".border-t.border-slate-100")).toHaveClass(
      "dark:border-slate-700",
    );
    listing.unmount();

    renderAt("/blog/dark-post", writerSession);
    const readerHeading = await screen.findByRole("heading", {
      name: storedPost.title,
    });
    const article = readerHeading.closest("article");
    expect(article).toHaveClass(
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-700",
    );
    expect(screen.getByText(storedPost.content)).toHaveClass(
      "dark:text-slate-300",
    );
    expect(screen.getByRole("button", { name: "Delete story" })).toHaveClass(
      "dark:text-rose-300",
    );
  });

  it("uses the required dark input tokens in both create and edit modes", async () => {
    const createPage = renderAt("/write", writerSession);

    for (const field of [
      screen.getByLabelText("Title"),
      screen.getByLabelText("Content"),
    ]) {
      expect(field).toHaveClass(
        "dark:bg-slate-800",
        "dark:text-slate-100",
        "dark:border-slate-600",
      );
    }
    expect(screen.getByText("0 characters")).toHaveClass("dark:text-slate-400");
    createPage.unmount();

    localStorage.setItem(POSTS_KEY, JSON.stringify([storedPost]));
    renderAt("/edit/dark-post", writerSession);
    expect(await screen.findByDisplayValue(storedPost.title)).toHaveClass(
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-600",
    );
    expect(screen.getByDisplayValue(storedPost.content)).toHaveClass(
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-600",
    );
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveClass(
      "dark:text-slate-300",
      "dark:hover:bg-slate-700",
    );
  });

  it("keeps admin statistic accents while styling statistics and recent posts", async () => {
    localStorage.setItem(POSTS_KEY, JSON.stringify([storedPost]));
    renderAt("/admin", adminSession);

    const statisticLabel = await screen.findByText("Total Posts");
    const statisticCard = statisticLabel.closest("div.overflow-hidden");
    expect(statisticCard).toHaveClass(
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-700",
    );
    expect(statisticCard.firstElementChild).toHaveClass(
      "from-violet-600",
      "to-indigo-600",
    );

    const recentHeading = screen.getByRole("heading", { name: "Recent posts" });
    const recentSurface = recentHeading.closest("section");
    expect(recentSurface).toHaveClass(
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-700",
    );
    expect(screen.getByRole("list", { name: "Recent posts" })).toHaveClass(
      "dark:divide-slate-700",
    );
    expect(screen.getByRole("link", { name: "Edit" })).toHaveClass(
      "dark:border-slate-600",
      "dark:text-slate-100",
    );
  });

  it("styles user management form, fields, table, and mobile records", async () => {
    localStorage.setItem(
      USERS_KEY,
      JSON.stringify([
        {
          id: "writer-1",
          displayName: "Avery Writer",
          username: "writer",
          password: "password",
          role: "user",
          createdAt: "2025-01-02T00:00:00.000Z",
        },
      ]),
    );
    const { container } = renderAt("/users", adminSession);

    const form = (
      await screen.findByRole("heading", { name: "Add a user" })
    ).closest("form");
    expect(form).toHaveClass(
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-700",
    );
    for (const field of [
      screen.getByLabelText("Display name"),
      screen.getByLabelText("Username"),
      screen.getByLabelText("Password"),
      screen.getByLabelText("Role"),
    ]) {
      expect(field).toHaveClass(
        "dark:bg-slate-800",
        "dark:text-slate-100",
        "dark:border-slate-600",
      );
    }

    const table = screen.getByRole("table");
    expect(table).toHaveClass(
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-700",
    );
    expect(
      screen.getByRole("columnheader", { name: "Display name" }),
    ).toHaveClass("dark:border-slate-700");
    const mobileRecords = container.querySelector(
      "[aria-label='User records']",
    );
    expect(mobileRecords.querySelector("article")).toHaveClass(
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-700",
    );
  });
});
