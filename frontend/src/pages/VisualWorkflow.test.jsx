import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import ImagePicker from "../components/ImagePicker";
import ImageUpload from "../components/ImageUpload";
import { FREE_IMAGES } from "../utils/images";

const writerSession = {
  userId: "visual-writer",
  username: "visual-writer",
  displayName: "Visual Writer",
  role: "user",
};

const adminSession = {
  userId: "admin",
  username: "admin",
  displayName: "Admin",
  role: "Admin",
};

const visualPost = {
  id: "visual-story",
  title: "A visual workflow story",
  content: "Reader content remains available through the visual redesign.",
  coverImage: "/images/free/mountains.jpg",
  gallery: ["/images/free/ocean.jpg", "/images/free/forest.jpg"],
  authorId: writerSession.userId,
  authorName: writerSession.displayName,
  authorRole: writerSession.role,
  createdAt: "2025-05-06T07:08:09.000Z",
};

/** Render the application at a browser route with an optional local session. */
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

describe("visual workflows", () => {
  it("uses signal pills and rounded story cards while preserving image and dark contracts", async () => {
    localStorage.setItem(
      "writespace_posts",
      JSON.stringify([
        visualPost,
        {
          ...visualPost,
          id: "placeholder-story",
          title: "A story without a cover",
          coverImage: undefined,
          createdAt: "2025-05-05T07:08:09.000Z",
        },
      ]),
    );
    renderAt("/blogs", writerSession);

    const primaryAction = screen.getByRole("link", { name: "Write a story" });
    expect(primaryAction).toHaveClass("rounded-full", "bg-signal-600");

    const coveredCard = (
      await screen.findByRole("link", { name: visualPost.title })
    ).closest("article");
    expect(coveredCard).toHaveClass(
      "rounded-2xl",
      "border-indigo-500",
      "dark:bg-slate-800",
      "dark:!bg-ink-900",
    );
    expect(within(coveredCard).getByAltText(`${visualPost.title} cover`)).toHaveAttribute(
      "loading",
      "lazy",
    );

    const placeholderCard = screen
      .getByRole("link", { name: "A story without a cover" })
      .closest("article");
    expect(
      placeholderCard.querySelector("[aria-hidden='true'].bg-gradient-to-r"),
    ).toHaveClass("from-signal-600", "via-signal-500", "to-ink-800");
  });

  it("keeps reader content, gallery, and authorized actions in the rounded reference system", async () => {
    localStorage.setItem("writespace_posts", JSON.stringify([visualPost]));
    renderAt(`/blog/${visualPost.id}`, writerSession);

    const heading = await screen.findByRole("heading", { name: visualPost.title });
    const article = heading.closest("article");
    expect(article).toHaveClass(
      "rounded-2xl",
      "dark:bg-slate-800",
      "dark:!bg-ink-900",
    );
    expect(heading).toHaveClass("text-[2.125rem]", "sm:text-5xl");
    expect(screen.getByText(visualPost.content)).toBeInTheDocument();

    const gallery = screen.getAllByRole("img", { name: /Gallery image/ });
    expect(gallery).toHaveLength(2);
    gallery.forEach((image) => expect(image).toHaveClass("rounded-xl"));
    expect(screen.getByRole("link", { name: "Edit story" })).toHaveClass(
      "rounded-full",
      "bg-signal-600",
    );
    expect(screen.getByRole("button", { name: "Delete story" })).toHaveClass(
      "rounded-full",
      "border-rose-300",
    );
  });

  it("styles login, registration, and writing fields without changing labels or dark tokens", async () => {
    const login = renderAt("/login");
    for (const label of ["Username", "Password"]) {
      expect(screen.getByLabelText(label)).toHaveClass(
        "rounded-xl",
        "focus:border-signal-600",
        "dark:bg-slate-800",
        "dark:text-slate-100",
        "dark:border-slate-600",
      );
    }
    expect(screen.getByRole("button", { name: "Log in" })).toHaveClass(
      "rounded-full",
      "bg-signal-600",
    );
    login.unmount();

    const registration = renderAt("/register");
    expect(screen.getByLabelText("Display name")).toHaveClass(
      "rounded-xl",
      "focus:ring-signal-100",
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-600",
    );
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    registration.unmount();

    renderAt("/write", writerSession);
    for (const label of ["Title", "Content"]) {
      expect(screen.getByLabelText(label)).toHaveClass(
        "rounded-xl",
        "focus:border-signal-600",
        "dark:bg-slate-800",
        "dark:text-slate-100",
        "dark:border-slate-600",
      );
    }
    expect(screen.getByRole("group", { name: "Cover image (optional)" })).toHaveClass(
      "rounded-2xl",
    );
    expect(screen.getByRole("button", { name: "Publish story" })).toHaveClass(
      "rounded-full",
      "bg-signal-600",
    );
  });

  it("keeps admin metrics and user table semantics on rounded ink surfaces", async () => {
    localStorage.setItem("writespace_posts", JSON.stringify([visualPost]));
    localStorage.setItem(
      "writespace_users",
      JSON.stringify([
        {
          id: "stored-writer",
          displayName: "Stored Writer",
          username: "stored-writer",
          password: "password",
          role: "user",
          createdAt: "2025-05-01T00:00:00.000Z",
        },
      ]),
    );
    const dashboard = renderAt("/admin", adminSession);

    const totalPosts = await screen.findByText("Total Posts");
    expect(totalPosts.nextElementSibling).toHaveTextContent("1");
    expect(totalPosts.closest("div.overflow-hidden")).toHaveClass(
      "rounded-2xl",
      "dark:!bg-ink-900",
    );
    expect(totalPosts.closest("div.overflow-hidden").firstElementChild).toHaveClass(
      "from-violet-600",
      "to-indigo-600",
      "!from-signal-600",
    );
    expect(screen.getByRole("list", { name: "Recent posts" })).toHaveClass(
      "dark:divide-slate-700",
    );
    dashboard.unmount();

    const users = renderAt("/users", adminSession);
    const form = (
      await screen.findByRole("heading", { name: "Add a user" })
    ).closest("form");
    expect(form).toHaveClass("rounded-2xl", "dark:!bg-ink-900");
    expect(screen.getByLabelText("Role")).toHaveClass(
      "rounded-xl",
      "focus:border-signal-600",
      "dark:bg-slate-800",
      "dark:text-slate-100",
      "dark:border-slate-600",
    );
    expect(screen.getByRole("table")).toHaveClass("rounded-2xl", "md:table");
    expect(screen.getByRole("columnheader", { name: "Display name" })).toHaveAttribute(
      "scope",
      "col",
    );
    expect(users.container.querySelector("[aria-label='User records'] article")).toHaveClass(
      "rounded-2xl",
      "dark:bg-slate-800",
      "dark:!bg-ink-900",
    );
  });

  it("keeps image selection and upload errors accessible with signal and rounded states", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onSelect = vi.fn();
    const picker = render(
      <ImagePicker value={FREE_IMAGES[0].path} onChange={onSelect} />,
    );

    const selected = screen.getByRole("button", { name: FREE_IMAGES[0].alt });
    expect(selected).toHaveAttribute("aria-pressed", "true");
    expect(selected).toHaveClass(
      "rounded-xl",
      "border-signal-600",
      "ring-signal-200",
    );
    expect(selected.closest("div.grid").parentElement).toHaveClass(
      "rounded-2xl",
      "dark:bg-slate-800",
      "dark:!bg-ink-900",
    );
    picker.unmount();

    const onUpload = vi.fn();
    render(
      <ImageUpload
        value="/images/free/coffee.jpg"
        onChange={onUpload}
      />,
    );
    const input = screen.getByLabelText("Upload cover image");
    expect(input).toHaveClass("rounded-xl", "focus:border-signal-600");
    expect(screen.getByAltText("Cover preview").parentElement).toHaveClass(
      "rounded-xl",
    );
    expect(screen.getByRole("button", { name: "Remove cover image" })).toHaveClass(
      "rounded-full",
      "bg-ink-900",
    );

    await user.upload(
      input,
      new File(["plain text"], "notes.txt", { type: "text/plain" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/image MIME type/i),
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("presents the empty story state as a rounded surface with a signal action", async () => {
    localStorage.setItem("writespace_posts", "[]");
    renderAt("/blogs", writerSession);

    const heading = await screen.findByRole("heading", { name: "No stories yet" });
    expect(heading.closest("div")).toHaveClass(
      "rounded-2xl",
      "dark:bg-slate-800",
      "dark:!bg-ink-900",
    );
    expect(screen.getAllByRole("link", { name: "Write a story" })[1]).toHaveClass(
      "rounded-full",
      "bg-signal-600",
    );
  });

  it("keeps the missing-reader recovery state rounded and navigable", async () => {
    localStorage.setItem("writespace_posts", "[]");
    renderAt("/blog/missing", writerSession);

    const heading = await screen.findByRole("heading", { name: "Post not found" });
    expect(heading.closest("div")).toHaveClass(
      "rounded-2xl",
      "dark:bg-slate-800",
      "dark:!bg-ink-900",
    );
    expect(screen.getByRole("link", { name: "Back to stories" })).toHaveAttribute(
      "href",
      "/blogs",
    );
  });

  it("retains accessible registration errors inside the redesigned field system", async () => {
    const user = userEvent.setup();
    renderAt("/register");

    await user.click(screen.getByRole("button", { name: "Create account" }));

    const displayName = screen.getByLabelText("Display name");
    expect(displayName).toHaveAttribute("aria-invalid", "true");
    expect(displayName).toHaveAttribute("aria-describedby", "displayName-error");
    expect(displayName).toHaveClass("rounded-xl", "focus:ring-signal-100");
    expect(screen.getByText("Display name is required.")).toHaveAttribute(
      "role",
      "alert",
    );
  });

  it("uses signal and pill controls throughout the user creation form", async () => {
    renderAt("/users", adminSession);

    const createUser = await screen.findByRole("button", { name: "Create user" });
    expect(createUser).toHaveClass("rounded-full", "bg-signal-600");
    expect(screen.getByLabelText("Display name")).toHaveClass(
      "rounded-xl",
      "dark:bg-slate-800",
      "dark:border-slate-600",
    );
    expect(screen.getByRole("button", { name: "Refresh" })).toHaveClass(
      "rounded-full",
      "text-signal-600",
    );
  });

  it("updates signal selection state and removes a rounded upload preview", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const picker = render(
      <ImagePicker value="" onChange={onChange} />,
    );
    const firstImage = screen.getByRole("button", { name: FREE_IMAGES[0].alt });

    await user.click(firstImage);
    expect(onChange).toHaveBeenCalledWith(FREE_IMAGES[0].path);
    expect(firstImage).toHaveAttribute("aria-pressed", "false");
    picker.unmount();

    const onRemove = vi.fn();
    render(
      <ImageUpload value="/images/free/coffee.jpg" onChange={onRemove} />,
    );
    const remove = screen.getByRole("button", { name: "Remove cover image" });
    expect(remove).toHaveClass("rounded-full", "bg-ink-900");
    await user.click(remove);
    expect(onRemove).toHaveBeenCalledWith("");
  });
});
