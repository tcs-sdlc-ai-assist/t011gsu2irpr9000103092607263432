import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { POSTS_KEY, USERS_KEY } from "../utils/storage";

const adminSession = {
  userId: "admin",
  username: "admin",
  displayName: "Admin",
  role: "Admin",
};

/** Render the app at an admin route with a safe seeded session. */
function renderAt(path, session = adminSession) {
  localStorage.setItem("writespace_session", JSON.stringify(session));
  window.history.pushState({}, "", path);
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}

/** Seed a complete local post array. */
function seedPosts(posts) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

/** Seed a complete local user array. */
function seedUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
  vi.restoreAllMocks();
});

describe("administration pages", () => {
  it("renders exact metrics and caps the newest-first recent list at five posts", async () => {
    seedPosts(
      Array.from({ length: 6 }, (_, index) => ({
        id: `post-${index}`,
        title: `Post ${index}`,
        authorName: "Writer",
        createdAt: `2025-01-0${index + 1}T00:00:00.000Z`,
      })),
    );
    seedUsers([
      { id: "one", displayName: "One", username: "one", role: "user" },
      { id: "two", displayName: "Two", username: "two", role: "Admin" },
    ]);
    renderAt("/admin");

    expect(await screen.findByText("Total Posts")).toBeInTheDocument();
    expect(
      screen.getByText("Total Users").nextElementSibling,
    ).toHaveTextContent("3");
    expect(
      screen.getByText("Total Admins").nextElementSibling,
    ).toHaveTextContent("2");
    expect(
      screen.getByText("Total users").nextElementSibling,
    ).toHaveTextContent("1");
    const recentPosts = screen.getByRole("list", { name: "Recent posts" });
    expect(recentPosts.children).toHaveLength(5);
    expect(recentPosts).toHaveTextContent("Post 5");
    expect(recentPosts).not.toHaveTextContent("Post 0");
  });

  it("keeps a recent post when deletion is cancelled and removes it when confirmed", async () => {
    const user = userEvent.setup();
    seedPosts([
      {
        id: "remove",
        title: "Remove me",
        authorName: "Writer",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ]);
    vi.spyOn(window, "confirm")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    renderAt("/admin");

    await user.click(await screen.findByRole("button", { name: "Delete" }));
    expect(JSON.parse(localStorage.getItem(POSTS_KEY))).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(screen.getByText("Post deleted.")).toBeInTheDocument(),
    );
    expect(JSON.parse(localStorage.getItem(POSTS_KEY))).toEqual([]);
  });

  it("creates a user with the selected role and persists exactly one new record", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("crypto", { randomUUID: () => "new-user-id" });
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
      "2025-02-03T04:05:06.000Z",
    );
    renderAt("/users");

    await user.type(await screen.findByLabelText("Display name"), "New Admin");
    await user.type(screen.getByLabelText("Username"), "new-admin");
    await user.type(screen.getByLabelText("Password"), "safe-password");
    await user.selectOptions(screen.getByLabelText("Role"), "Admin");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByText("User created.")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(USERS_KEY))).toEqual([
      {
        id: "new-user-id",
        displayName: "New Admin",
        username: "new-admin",
        password: "safe-password",
        role: "Admin",
        createdAt: "2025-02-03T04:05:06.000Z",
      },
    ]);
    expect(screen.getAllByText("New Admin").length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });

  it("rejects usernames that duplicate either the built-in admin or a stored user", async () => {
    const user = userEvent.setup();
    seedUsers([
      {
        id: "writer",
        displayName: "Writer",
        username: "writer",
        password: "password",
        role: "user",
      },
    ]);
    renderAt("/users");

    await user.type(await screen.findByLabelText("Display name"), "Another");
    await user.type(screen.getByLabelText("Username"), " ADMIN ");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Create user" }));
    expect(
      await screen.findByText("This username is already in use."),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(USERS_KEY))).toHaveLength(1);

    await user.clear(screen.getByLabelText("Username"));
    await user.type(screen.getByLabelText("Username"), "WRITER");
    await user.click(screen.getByRole("button", { name: "Create user" }));
    expect(JSON.parse(localStorage.getItem(USERS_KEY))).toHaveLength(1);
  });

  it("visibly renders the virtual Admin and prevents its direct deletion", async () => {
    const user = userEvent.setup();
    renderAt("/users");

    expect(
      await screen.findByText(
        "The built-in Admin account is always available.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    expect(
      screen.getByText("Default admin cannot be deleted."),
    ).toBeInTheDocument();
  });

  it("prevents deletion of the active session record without changing storage", async () => {
    const currentAdmin = {
      userId: "stored-admin",
      username: "stored-admin",
      displayName: "Stored Admin",
      role: "Admin",
    };
    const user = userEvent.setup();
    seedUsers([
      {
        id: "stored-admin",
        displayName: "Stored Admin",
        username: "stored-admin",
        password: "password",
        role: "Admin",
      },
    ]);
    renderAt("/users", currentAdmin);

    await screen.findAllByText("Stored Admin");
    await user.click(screen.getAllByRole("button", { name: "Delete" })[1]);
    expect(
      screen.getByText("You cannot delete the active user session."),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(USERS_KEY))).toHaveLength(1);
  });
});
