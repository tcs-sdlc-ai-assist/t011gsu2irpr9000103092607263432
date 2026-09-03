import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import Home from "./Home";
import LandingPage from "./LandingPage";
import ReadBlog from "./ReadBlog";
import { SESSION_KEY } from "../utils/auth";
import { POSTS_KEY } from "../utils/storage";

const session = {
  userId: "writer-1",
  username: "writer",
  displayName: "Writer One",
  role: "user",
};

/** Create a complete persisted post with overridable image fields. */
function makePost(overrides = {}) {
  return {
    id: "post-1",
    title: "Rendered story",
    content: "Visible story content.",
    authorId: session.userId,
    authorName: session.displayName,
    authorRole: session.role,
    createdAt: "2024-06-01T10:00:00.000Z",
    coverImage: "/images/free/mountains.jpg",
    gallery: [],
    ...overrides,
  };
}

/** Persist posts and an authenticated session for a component render. */
function seedState(posts) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** Render a page inside a memory router at the requested path. */
function renderRoute(element, path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      {element}
    </MemoryRouter>,
  );
}

/** Render the reader with the same route parameter contract as the app. */
function renderReader(post) {
  seedState([post]);
  return render(
    <MemoryRouter initialEntries={[`/blog/${post.id}`]}>
      <Routes>
        <Route path="/blog/:id" element={<ReadBlog />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("post image rendering", () => {
  it("renders a lazy landing cover and safely omits an absent cover", () => {
    seedState([
      makePost({ id: "covered", title: "Covered landing story" }),
      makePost({ id: "plain", title: "Plain landing story", coverImage: undefined }),
    ]);
    renderRoute(<LandingPage />);

    const cover = screen.getByAltText("Covered landing story cover");
    expect(cover).toHaveAttribute("loading", "lazy");
    expect(cover).toHaveClass("aspect-video", "object-cover");
    expect(screen.queryByAltText("Plain landing story cover")).not.toBeInTheDocument();
    expect(screen.getByText("Plain landing story")).toBeInTheDocument();
  });

  it("renders a lazy Home cover and cycles the exact four accent classes", async () => {
    const posts = [
      makePost({ id: "one", title: "Story one", createdAt: "2024-06-04T00:00:00.000Z" }),
      makePost({ id: "two", title: "Story two", createdAt: "2024-06-03T00:00:00.000Z" }),
      makePost({ id: "three", title: "Story three", createdAt: "2024-06-02T00:00:00.000Z" }),
      makePost({ id: "four", title: "Story four", createdAt: "2024-06-01T00:00:00.000Z" }),
    ];
    seedState(posts);
    renderRoute(<Home />, "/blogs");

    const expectedAccents = [
      "border-indigo-500",
      "border-violet-500",
      "border-pink-500",
      "border-teal-500",
    ];
    await screen.findByRole("link", { name: "Story one" });
    posts.forEach((post, index) => {
      const article = screen.getByRole("link", { name: post.title }).closest("article");
      expect(article).toHaveClass(expectedAccents[index]);
    });
    const cover = screen.getByAltText("Story one cover");
    expect(cover).toHaveAttribute("loading", "lazy");
    expect(cover).toHaveClass("aspect-video", "object-cover");
  });

  it("uses gradient placeholders for absent and malformed Home covers", async () => {
    seedState([
      makePost({ id: "absent", title: "Absent cover", coverImage: undefined }),
      makePost({ id: "malformed", title: "Malformed cover", coverImage: { src: "bad" } }),
    ]);
    renderRoute(<Home />, "/blogs");

    await screen.findByRole("link", { name: "Absent cover" });
    ["Absent cover", "Malformed cover"].forEach((title) => {
      const article = screen.getByRole("link", { name: title }).closest("article");
      expect(article.querySelector("img")).toBeNull();
      expect(article.querySelector("[aria-hidden='true'].bg-gradient-to-r")).not.toBeNull();
    });
  });

  it("places the lazy reader cover before the story heading", async () => {
    renderReader(makePost());

    const heading = await screen.findByRole("heading", { name: "Rendered story" });
    const cover = screen.getByAltText("Rendered story cover");
    expect(cover).toHaveAttribute("loading", "lazy");
    expect(cover).toHaveClass("object-cover");
    expect(cover.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("filters and links a responsive lazy reader gallery below content", async () => {
    renderReader(
      makePost({
        gallery: ["/images/free/ocean.jpg", "", null, "/images/free/forest.jpg"],
      }),
    );

    const content = await screen.findByText("Visible story content.");
    const galleryImages = screen.getAllByRole("img", { name: /Gallery image/ });
    expect(galleryImages).toHaveLength(2);
    const grid = galleryImages[0].closest("div");
    expect(grid).toHaveClass("grid-cols-2", "md:grid-cols-3");
    expect(content.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    galleryImages.forEach((image) => {
      expect(image).toHaveAttribute("loading", "lazy");
      expect(image).toHaveClass("h-40", "object-cover", "dark:border-slate-700");
      expect(image.closest("a")).toHaveAttribute("target", "_blank");
      expect(image.closest("a")).toHaveAttribute("rel", "noreferrer");
    });
  });

  it("renders malformed legacy image fields without images while preserving content and actions", async () => {
    renderReader(makePost({ coverImage: 42, gallery: "not-an-array" }));

    expect(await screen.findByText("Visible story content.")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /cover|Gallery image/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit story" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete story" })).toBeInTheDocument();
  });

  it("marks every newly rendered cover and gallery image for lazy loading", async () => {
    renderReader(
      makePost({
        gallery: ["/images/free/ocean.jpg", "/images/free/forest.jpg"],
      }),
    );

    await waitFor(() => {
      expect(screen.getAllByRole("img", { name: /cover|Gallery image/ })).toHaveLength(3);
    });
    within(screen.getByRole("article")).getAllByRole("img").forEach((image) => {
      expect(image).toHaveAttribute("loading", "lazy");
    });
  });
});
