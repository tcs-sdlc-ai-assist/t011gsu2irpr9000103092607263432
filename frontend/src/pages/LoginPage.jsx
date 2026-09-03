import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PublicShell from "../components/PublicShell";
import { authenticate, setSession } from "../utils/auth";

/**
 * Render the login workflow and establish a local public session.
 *
 * Returns:
 *   The login page.
 */
export default function LoginPage() {
  const [values, setValues] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  /** Update a named credential field and clear its visible error. */
  function updateValue(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFeedback("");
  }

  /** Validate credentials and navigate only after session persistence succeeds. */
  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!values.username.trim()) nextErrors.username = "Username is required.";
    if (!values.password) nextErrors.password = "Password is required.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const session = authenticate(values.username, values.password);
    if (!session) {
      setFeedback("Invalid username or password.");
      return;
    }
    if (!setSession(session)) {
      setFeedback(
        "We could not save your session. Please check browser storage and try again.",
      );
      return;
    }
    navigate(location.state?.from || "/blogs", { replace: true });
  }

  return (
    <PublicShell>
      <section className="mx-auto flex min-h-[calc(100vh-145px)] max-w-md items-center px-5 py-14 sm:px-8">
        <div className="w-full border border-slate-200 bg-white p-7 sm:p-9">
          <p className="text-sm font-medium text-indigo-700">Welcome back</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Log in to WriteSpace
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Use the admin demo account: admin / admin.
          </p>
          {feedback && (
            <p
              role="alert"
              className="mt-5 border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {feedback}
            </p>
          )}
          <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-800"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={values.username}
                onChange={updateValue}
                aria-required="true"
                aria-invalid={Boolean(errors.username)}
                aria-describedby={
                  errors.username ? "username-error" : undefined
                }
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200"
              />
              {errors.username && (
                <p
                  id="username-error"
                  role="alert"
                  className="mt-2 text-sm text-red-700"
                >
                  {errors.username}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-800"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={values.password}
                onChange={updateValue}
                aria-required="true"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200"
              />
              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="mt-2 text-sm text-red-700"
                >
                  {errors.password}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Log in
            </button>
          </form>
          <p className="mt-6 text-sm text-slate-600">
            New to WriteSpace?{" "}
            <Link
              to="/register"
              className="font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
