import { render, screen, waitFor, within } from "@testing-library/react";
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

/** Return the stored posts after a user-facing save operation. */
function getStoredPosts() {
  return JSON.parse(localStorage.getItem(POSTS_KEY));
}

/** Fill the required fields on the shared create/edit form. */
async function fillRequiredFields(user, title, content) {
  await user.clear(screen.getByLabelText("Title"));
  await user.type(screen.getByLabelText("Title"), title);
  await user.clear(screen.getByLabelText("Content"));
  await user.type(screen.getByLabelText("Content"), content);
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
    expect(getStoredPosts()).toEqual([
      {
        id: "new-post-id",
        title: "A local story",
        content: "A complete local body.",
        coverImage: "",
        gallery: [],
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
    expect(getStoredPosts()[0].content).toBe("Keep this.");
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
    expect(getStoredPosts()).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Delete story" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Stories" }),
      ).toBeInTheDocument(),
    );
    expect(getStoredPosts()).toEqual([]);
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it("creates a post with a free cover and multiple free gallery images", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("crypto", { randomUUID: () => "free-images-post" });
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
      "2025-03-04T05:06:07.000Z",
    );
    renderAt("/write");

    const coverSection = screen.getByRole("group", {
      name: "Cover image (optional)",
    });
    const gallerySection = screen.getByRole("group", {
      name: "Image gallery (optional)",
    });
    await user.click(
      within(coverSection).getByRole("button", {
        name: "Snow-capped mountains rising above a quiet valley",
      }),
    );
    await user.click(
      within(gallerySection).getByRole("button", {
        name: "Ocean waves rolling toward a sunlit shore",
      }),
    );
    await user.click(
      within(gallerySection).getByRole("button", {
        name: "Tall forest trees surrounding a shaded woodland path",
      }),
    );
    await fillRequiredFields(user, "Free image story", "Free image body.");
    await user.click(screen.getByRole("button", { name: "Publish story" }));

    await screen.findByRole("heading", { name: "Free image story" });
    expect(getStoredPosts()).toEqual([
      {
        id: "free-images-post",
        title: "Free image story",
        content: "Free image body.",
        coverImage: "/images/free/mountains.jpg",
        gallery: [
          "/images/free/ocean.jpg",
          "/images/free/forest.jpg",
        ],
        authorId: "writer-1",
        authorName: "Avery Writer",
        authorRole: "user",
        createdAt: "2025-03-04T05:06:07.000Z",
      },
    ]);
    vi.unstubAllGlobals();
  });

  it("replaces a selected cover with an upload and appends gallery uploads", async () => {
    const user = userEvent.setup();
    renderAt("/write");

    const coverSection = screen.getByRole("group", {
      name: "Cover image (optional)",
    });
    const gallerySection = screen.getByRole("group", {
      name: "Image gallery (optional)",
    });
    await user.click(
      within(coverSection).getByRole("button", {
        name: "Snow-capped mountains rising above a quiet valley",
      }),
    );
    await user.upload(
      within(coverSection).getByLabelText("Upload cover image"),
      new File(["cover-bytes"], "cover.png", { type: "image/png" }),
    );
    await user.click(
      within(gallerySection).getByRole("button", {
        name: "Ocean waves rolling toward a sunlit shore",
      }),
    );
    await user.upload(
      within(gallerySection).getByLabelText("Upload gallery images"),
      new File(["gallery-bytes"], "gallery.png", { type: "image/png" }),
    );
    await waitFor(() =>
      expect(within(gallerySection).getAllByAltText(/Gallery preview/)).toHaveLength(2),
    );
    await fillRequiredFields(user, "Mixed image story", "Mixed image body.");
    await user.click(screen.getByRole("button", { name: "Publish story" }));

    await screen.findByRole("heading", { name: "Mixed image story" });
    const storedPost = getStoredPosts()[0];
    expect(storedPost.coverImage).toBe("data:image/png;base64,Y292ZXItYnl0ZXM=");
    expect(storedPost.gallery).toEqual([
      "/images/free/ocean.jpg",
      "data:image/png;base64,Z2FsbGVyeS1ieXRlcw==",
    ]);
  });

  it("removes only the selected gallery preview before saving", async () => {
    const user = userEvent.setup();
    renderAt("/write");

    const gallerySection = screen.getByRole("group", {
      name: "Image gallery (optional)",
    });
    for (const name of [
      "Snow-capped mountains rising above a quiet valley",
      "Ocean waves rolling toward a sunlit shore",
      "Tall forest trees surrounding a shaded woodland path",
    ]) {
      await user.click(within(gallerySection).getByRole("button", { name }));
    }
    await user.click(
      within(gallerySection).getByRole("button", {
        name: "Remove gallery image 2",
      }),
    );
    await fillRequiredFields(user, "Trimmed gallery", "Gallery removal body.");
    await user.click(screen.getByRole("button", { name: "Publish story" }));

    await screen.findByRole("heading", { name: "Trimmed gallery" });
    expect(getStoredPosts()[0].gallery).toEqual([
      "/images/free/mountains.jpg",
      "/images/free/forest.jpg",
    ]);
  });

  it("prefills editable images and preserves immutable metadata while changing them", async () => {
    const user = userEvent.setup();
    seedPosts([
      {
        id: "editable-images",
        title: "Original title",
        content: "Original content.",
        coverImage: "/images/free/mountains.jpg",
        gallery: [
          "/images/free/ocean.jpg",
          "/images/free/forest.jpg",
        ],
        authorId: "writer-1",
        authorName: "Avery Writer",
        authorRole: "user",
        createdAt: "2024-06-01T10:20:30.000Z",
        customMetadata: "preserve me",
      },
    ]);
    renderAt("/edit/editable-images");

    const coverSection = await screen.findByRole("group", {
      name: "Cover image (optional)",
    });
    const gallerySection = screen.getByRole("group", {
      name: "Image gallery (optional)",
    });
    expect(
      within(coverSection).getByRole("button", {
        name: "Snow-capped mountains rising above a quiet valley",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(gallerySection).getByRole("button", {
        name: "Ocean waves rolling toward a sunlit shore",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(within(gallerySection).getAllByAltText(/Gallery preview/)).toHaveLength(2);

    await user.click(
      within(coverSection).getByRole("button", {
        name: "Modern city skyline viewed across the waterfront",
      }),
    );
    await user.click(
      within(gallerySection).getByRole("button", {
        name: "Remove gallery image 1",
      }),
    );
    await fillRequiredFields(user, "Updated title", "Updated content.");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await screen.findByRole("heading", { name: "Updated title" });
    expect(getStoredPosts()).toEqual([
      {
        id: "editable-images",
        title: "Updated title",
        content: "Updated content.",
        coverImage: "/images/free/city.jpg",
        gallery: ["/images/free/forest.jpg"],
        authorId: "writer-1",
        authorName: "Avery Writer",
        authorRole: "user",
        createdAt: "2024-06-01T10:20:30.000Z",
        customMetadata: "preserve me",
      },
    ]);
  });

  it("loads a legacy post without image fields and saves normalized values", async () => {
    const user = userEvent.setup();
    seedPosts([
      {
        id: "legacy-post",
        title: "Legacy title",
        content: "Legacy content.",
        authorId: "writer-1",
        authorName: "Avery Writer",
        authorRole: "user",
        createdAt: "2023-01-02T03:04:05.000Z",
      },
    ]);
    renderAt("/edit/legacy-post");

    await screen.findByRole("group", { name: "Cover image (optional)" });
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await screen.findByRole("heading", { name: "Legacy title" });
    expect(getStoredPosts()[0]).toEqual({
      id: "legacy-post",
      title: "Legacy title",
      content: "Legacy content.",
      coverImage: "",
      gallery: [],
      authorId: "writer-1",
      authorName: "Avery Writer",
      authorRole: "user",
      createdAt: "2023-01-02T03:04:05.000Z",
    });
  });

  it("rejects oversize and non-image uploads without replacing selected values", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderAt("/write");

    const coverSection = screen.getByRole("group", {
      name: "Cover image (optional)",
    });
    const gallerySection = screen.getByRole("group", {
      name: "Image gallery (optional)",
    });
    await user.click(
      within(coverSection).getByRole("button", {
        name: "Snow-capped mountains rising above a quiet valley",
      }),
    );
    await user.click(
      within(gallerySection).getByRole("button", {
        name: "Ocean waves rolling toward a sunlit shore",
      }),
    );
    await user.upload(
      within(coverSection).getByLabelText("Upload cover image"),
      new File([new Uint8Array(500 * 1024 + 1)], "too-large.png", {
        type: "image/png",
      }),
    );
    expect(
      await within(coverSection).findByRole("alert"),
    ).toHaveTextContent("exceeds the maximum size of 500 KB");
    await user.upload(
      within(gallerySection).getByLabelText("Upload gallery images"),
      new File(["plain text"], "notes.txt", { type: "text/plain" }),
    );
    expect(
      await within(gallerySection).findByRole("alert"),
    ).toHaveTextContent("must have a valid image MIME type");

    await fillRequiredFields(user, "Rejected uploads", "Rejected upload body.");
    await user.click(screen.getByRole("button", { name: "Publish story" }));

    await screen.findByRole("heading", { name: "Rejected uploads" });
    expect(getStoredPosts()[0].coverImage).toBe(
      "/images/free/mountains.jpg",
    );
    expect(getStoredPosts()[0].gallery).toEqual([
      "/images/free/ocean.jpg",
    ]);
    expect(JSON.stringify(getStoredPosts()[0])).not.toContain("too-large");
    expect(JSON.stringify(getStoredPosts()[0])).not.toContain("notes.txt");
  });
});
