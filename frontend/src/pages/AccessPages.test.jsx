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
