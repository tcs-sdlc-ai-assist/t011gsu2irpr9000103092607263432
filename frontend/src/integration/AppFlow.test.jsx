import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { POSTS_KEY, USERS_KEY } from "../utils/storage";
import { SESSION_KEY } from "../utils/auth";

/** Render the full application at a browser route without replacing app utilities. */
function renderAt(path) {
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
  vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "integration-id") });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("WriteSpace application flow", () => {
  it("registers a writer, publishes a story, and retains the session and story while navigating", async () => {
    const user = userEvent.setup();
    renderAt("/register");

    await user.type(
      screen.getByLabelText("Display name"),
      "Integration Writer",
    );
    await user.type(screen.getByLabelText("Username"), "integration-writer");
    await user.type(screen.getByLabelText("Password"), "local-password");
    await user.type(
      screen.getByLabelText("Confirm password"),
      "local-password",
    );
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByRole("heading", { name: "Stories" }),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(SESSION_KEY))).toMatchObject({
      username: "integration-writer",
      displayName: "Integration Writer",
    });
    expect(JSON.parse(localStorage.getItem(USERS_KEY))).toHaveLength(1);

    await user.click(screen.getAllByRole("link", { name: "Write a story" })[0]);
    expect(
      await screen.findByRole("heading", { name: "Write a story" }),
    ).toBeInTheDocument();
    await user.type(
      screen.getByLabelText("Title"),
      "A persisted integration story",
    );
    await user.type(
      screen.getByLabelText("Content"),
      "This story moves from writing to reading through local persistence.",
    );
    await user.click(screen.getByRole("button", { name: "Publish story" }));

    expect(
      await screen.findByRole("heading", {
        name: "A persisted integration story",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This story moves from writing to reading through local persistence.",
      ),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(POSTS_KEY))).toEqual([
      expect.objectContaining({
        id: "integration-id",
        title: "A persisted integration story",
        authorName: "Integration Writer",
      }),
    ]);

    await user.click(screen.getAllByRole("link", { name: "Stories" })[0]);
    expect(
      await screen.findByRole("link", {
        name: "A persisted integration story",
      }),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(SESSION_KEY))).toMatchObject({
      username: "integration-writer",
    });
  });

  it("redirects a logged-out visitor from the protected writing route to login", async () => {
    renderAt("/write");

    expect(
      await screen.findByRole("heading", { name: "Log in to WriteSpace" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
