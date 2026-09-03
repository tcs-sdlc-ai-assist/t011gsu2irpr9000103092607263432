import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicShell from "../components/PublicShell";
import { setSession } from "../utils/auth";
import { getUsers, saveUsers } from "../utils/storage";

/**
 * Produce a browser-safe user identifier when UUID support varies by browser.
 *
 * Returns:
 *   A unique-enough string for local-only user storage.
 */
function createUserId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Render the account registration workflow for local WriteSpace accounts.
 *
 * Returns:
 *   The registration page.
 */
export default function RegisterPage() {
  const [values, setValues] = useState({
    displayName: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState("");
  const navigate = useNavigate();

  /** Update a named registration field and remove stale feedback. */
  function updateValue(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFeedback("");
  }

  /** Validate and persist a unique user, then create the corresponding session. */
  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    const normalizedUsername = values.username.trim().toLowerCase();
    if (!values.displayName.trim())
      nextErrors.displayName = "Display name is required.";
    if (!normalizedUsername) nextErrors.username = "Username is required.";
    if (!values.password) nextErrors.password = "Password is required.";
    if (!values.confirmPassword)
      nextErrors.confirmPassword = "Please confirm your password.";
    if (
      values.password &&
      values.confirmPassword &&
      values.password !== values.confirmPassword
    )
      nextErrors.confirmPassword = "Passwords must match.";
    const usernames = [
      "admin",
      ...getUsers().map((user) =>
        String(user?.username || "")
          .trim()
          .toLowerCase(),
      ),
    ];
    if (normalizedUsername && usernames.includes(normalizedUsername))
      nextErrors.username = "That username is already in use.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const user = {
      id: createUserId(),
      displayName: values.displayName.trim(),
      username: normalizedUsername,
      password: values.password,
      role: "user",
    };
    if (!saveUsers([...getUsers(), user])) {
      setFeedback(
        "We could not save your account. Please check browser storage and try again.",
      );
      return;
    }
    if (
      !setSession({
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      })
    ) {
      setFeedback(
        "Your account was saved, but we could not start your session. Please log in.",
      );
      return;
    }
    navigate("/blogs", { replace: true });
  }

  /** Render one labeled registration input with an inline accessibility error. */
  function renderField(id, label, type = "text", autocomplete = "off") {
    const error = errors[id];
    return (
      <div>
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-800"
        >
          {label}
        </label>
        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autocomplete}
          value={values[id]}
          onChange={updateValue}
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200"
        />
        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="mt-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <PublicShell>
      <section className="mx-auto max-w-md px-5 py-14 sm:px-8">
        <div className="border border-slate-200 bg-white p-7 sm:p-9">
          <p className="text-sm font-medium text-indigo-700">Your blank page</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Create your account
          </h1>
          {feedback && (
            <p
              role="alert"
              className="mt-5 border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {feedback}
            </p>
          )}
          <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
            {renderField("displayName", "Display name", "text", "name")}
            {renderField("username", "Username", "text", "username")}
            {renderField("password", "Password", "password", "new-password")}
            {renderField(
              "confirmPassword",
              "Confirm password",
              "password",
              "new-password",
            )}
            <button
              type="submit"
              className="w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create account
            </button>
          </form>
          <p className="mt-6 text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Log in
            </Link>
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
