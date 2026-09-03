import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

/** Return the application at a selected browser route. */
function renderAt(path) {
  window.history.pushState({}, "", path);
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}

/** Clear local browser state between page interaction tests. */
beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/");
});

describe("access pages", () => {
  it("shows the required public empty state on the landing page", () => {
    renderAt("/");

    expect(
      screen.getByText("No posts yet — check back soon!"),
    ).toBeInTheDocument();
  });

  it("shows matching-password validation when registration passwords differ", async () => {
    const user = userEvent.setup();
    renderAt("/register");

    await user.type(screen.getByLabelText("Display name"), "Ada");
    await user.type(screen.getByLabelText("Username"), "ada");
    await user.type(screen.getByLabelText("Password"), "one");
    await user.type(screen.getByLabelText("Confirm password"), "two");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByText("Passwords must match.")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("blocks normalized duplicate usernames including the virtual admin", async () => {
    const user = userEvent.setup();
    renderAt("/register");

    await user.type(screen.getByLabelText("Display name"), "Administrator");
    await user.type(screen.getByLabelText("Username"), " ADMIN ");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.type(screen.getByLabelText("Confirm password"), "secret");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      screen.getByText("That username is already in use."),
    ).toBeInTheDocument();
  });

  it("redirects guests from a protected story route to login", () => {
    renderAt("/blogs");

    expect(
      screen.getByRole("heading", { name: "Log in to WriteSpace" }),
    ).toBeInTheDocument();
  });

  it("shows the exact invalid-login message without creating a session", async () => {
    const user = userEvent.setup();
    renderAt("/login");

    await user.type(screen.getByLabelText("Username"), "writer");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByText("Invalid username or password.")).toHaveAttribute(
      "role",
      "alert",
    );
    expect(localStorage.getItem("writespace_session")).toBeNull();
  });

  it("associates an inline error with every missing registration field", async () => {
    const user = userEvent.setup();
    renderAt("/register");

    await user.click(screen.getByRole("button", { name: "Create account" }));

    const expectedErrors = [
      ["Display name", "Display name is required."],
      ["Username", "Username is required."],
      ["Password", "Password is required."],
      ["Confirm password", "Please confirm your password."],
    ];
    for (const [label, message] of expectedErrors) {
      expect(screen.getByText(message)).toHaveAttribute("role", "alert");
      expect(screen.getByLabelText(label)).toHaveAttribute("aria-invalid", "true");
    }
    expect(localStorage.getItem("writespace_users")).toBeNull();
    expect(localStorage.getItem("writespace_session")).toBeNull();
  });

  it("rejects a normalized username already held by a stored user", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "writespace_users",
      JSON.stringify([
        {
          id: "existing-user",
          displayName: "Existing Writer",
          username: "writer",
          password: "stored-password",
          role: "user",
        },
      ]),
    );
    renderAt("/register");

    await user.type(screen.getByLabelText("Display name"), "Duplicate Writer");
    await user.type(screen.getByLabelText("Username"), " WRITER ");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.type(screen.getByLabelText("Confirm password"), "secret");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByText("That username is already in use.")).toHaveAttribute(
      "role",
      "alert",
    );
    expect(JSON.parse(localStorage.getItem("writespace_users"))).toHaveLength(1);
    expect(localStorage.getItem("writespace_session")).toBeNull();
  });

  it("reports a user-storage failure without creating an account or session", async () => {
    const user = userEvent.setup();
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === "writespace_users") throw new Error("quota exceeded");
      return originalSetItem.call(this, key, value);
    });
    renderAt("/register");

    await user.type(screen.getByLabelText("Display name"), "Storage Writer");
    await user.type(screen.getByLabelText("Username"), "storage-writer");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.type(screen.getByLabelText("Confirm password"), "secret");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      screen.getByText(
        "We could not save your account. Please check browser storage and try again.",
      ),
    ).toHaveAttribute("role", "alert");
    expect(localStorage.getItem("writespace_users")).toBeNull();
    expect(localStorage.getItem("writespace_session")).toBeNull();
    vi.restoreAllMocks();
  });

  it("keeps the saved account and reports when session persistence fails", async () => {
    const user = userEvent.setup();
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === "writespace_session") throw new Error("session storage locked");
      return originalSetItem.call(this, key, value);
    });
    vi.stubGlobal("crypto", { randomUUID: () => "saved-user-id" });
    renderAt("/register");

    await user.type(screen.getByLabelText("Display name"), "Saved Writer");
    await user.type(screen.getByLabelText("Username"), "saved-writer");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.type(screen.getByLabelText("Confirm password"), "secret");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      screen.getByText(
        "Your account was saved, but we could not start your session. Please log in.",
      ),
    ).toHaveAttribute("role", "alert");
    expect(JSON.parse(localStorage.getItem("writespace_users"))).toEqual([
      expect.objectContaining({ id: "saved-user-id", username: "saved-writer" }),
    ]);
    expect(localStorage.getItem("writespace_session")).toBeNull();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("registers a unique user and starts a password-free session", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("crypto", { randomUUID: () => "test-user-id" });
    renderAt("/register");

    await user.type(screen.getByLabelText("Display name"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Username"), "ada");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.type(screen.getByLabelText("Confirm password"), "secret");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByRole("heading", { name: "Stories" }),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("writespace_session"))).toEqual({
      userId: "test-user-id",
      username: "ada",
      displayName: "Ada Lovelace",
      role: "user",
    });
    vi.unstubAllGlobals();
  });
});
