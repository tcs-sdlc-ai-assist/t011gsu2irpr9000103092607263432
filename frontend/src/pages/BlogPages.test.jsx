import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { POSTS_KEY } from "../utils/storage";

const writerSession = {
  userId: "writer-1",
  username: "writer",
  displayName: "Avery Writer",
  role: "user",
};
const otherSession = {
  userId: "reader-2",
  username: "reader",
  displayName: "Rowan Reader",
  role: "user",
};

/** Render the application at a route with a valid local session. */
function renderAt(path, session = writerSession) {
  localStorage.setItem("writespace_session", JSON.stringify(session));
  window.history.pushState({}, "", path);
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}

/** Persist a complete local post array for a test scenario. */
function seedPosts(posts) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
  vi.restoreAllMocks();
});

describe("blog pages", () => {
  it("lists posts newest-first with excerpts and an owner-only edit link", async () => {
    seedPosts([
      {
        id: "old",
        title: "Older idea",
        content: "Old content",
        authorId: "reader-2",
        authorName: "Rowan Reader",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "new",
        title: "Newest idea",
        content: "New content",
        authorId: "writer-1",
        authorName: "Avery Writer",
        createdAt: "2024-02-01T00:00:00.000Z",
      },
    ]);
    renderAt("/blogs");

    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Newest idea",
      "Older idea",
    ]);
    expect(screen.getByText("New content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/edit/new",
    );
  });

  it("shows a safe missing-post state without management actions", async () => {
    renderAt("/blog/missing");

    expect(
      await screen.findByRole("heading", { name: "Post not found" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete story" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to stories" }),
    ).toHaveAttribute("href", "/blogs");
  });

  it("creates complete post metadata and navigates to the rendered story", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("crypto", { randomUUID: () => "new-post-id" });
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
      "2025-02-03T04:05:06.000Z",
    );
    renderAt("/write");

    await user.type(screen.getByLabelText("Title"), "A local story");
    await user.type(screen.getByLabelText("Content"), "A complete local body.");
    await user.click(screen.getByRole("button", { name: "Publish story" }));

    expect(
      await screen.findByRole("heading", { name: "A local story" }),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(POSTS_KEY))).toEqual([
      {
        id: "new-post-id",
        title: "A local story",
        content: "A complete local body.",
        authorId: "writer-1",
        authorName: "Avery Writer",
        authorRole: "user",
        createdAt: "2025-02-03T04:05:06.000Z",
      },
    ]);
    vi.unstubAllGlobals();
  });

  it("redirects an unauthorized editor before it can alter another author post", async () => {
    seedPosts([
      {
        id: "protected",
        title: "Protected",
        content: "Keep this.",
        authorId: "writer-1",
        authorName: "Avery Writer",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    ]);
    renderAt("/edit/protected", otherSession);

    expect(
      await screen.findByRole("heading", { name: "Stories" }),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(POSTS_KEY))[0].content).toBe(
      "Keep this.",
    );
  });

  it("keeps a post when deletion is declined and removes it when accepted", async () => {
    const user = userEvent.setup();
    seedPosts([
      {
        id: "delete-me",
        title: "Delete me",
        content: "Temporary.",
        authorId: "writer-1",
        authorName: "Avery Writer",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    ]);
    const confirm = vi
      .spyOn(window, "confirm")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    renderAt("/blog/delete-me");

    await user.click(
      await screen.findByRole("button", { name: "Delete story" }),
    );
    expect(JSON.parse(localStorage.getItem(POSTS_KEY))).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Delete story" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Stories" }),
      ).toBeInTheDocument(),
    );
    expect(JSON.parse(localStorage.getItem(POSTS_KEY))).toEqual([]);
    expect(confirm).toHaveBeenCalledTimes(2);
  });
});
