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
      <section className="mx-auto flex min-h-[calc(100dvh-145px)] max-w-md items-center px-5 py-16 text-ink-950 dark:bg-slate-900 dark:text-slate-100 dark:!bg-ink-950 sm:px-8">
        <div className="w-full rounded-2xl border border-slate-200 border-black/5 bg-white p-7 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:!border-white/10 dark:!bg-ink-900 sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700 text-signal-600 dark:text-indigo-300 dark:!text-signal-500">
            Welcome back
          </p>
          <h1 className="mt-2 text-[2rem] font-semibold leading-[1.15] tracking-tight text-ink-950 dark:text-slate-100 sm:text-[2.5rem]">
            Log in to WriteSpace
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Use the admin demo account: admin / admin.
          </p>
          {feedback && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            >
              {feedback}
            </p>
          )}
          <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-800 dark:text-slate-100"
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
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none focus:border-indigo-600 focus:border-signal-600 focus:ring-2 focus:ring-indigo-200 focus:ring-signal-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-900 dark:!bg-ink-900 dark:focus:!border-signal-500 dark:focus:!ring-signal-600/30"
              />
              {errors.username && (
                <p
                  id="username-error"
                  role="alert"
                  className="mt-2 text-sm text-red-700 dark:text-red-300"
                >
                  {errors.username}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-800 dark:text-slate-100"
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
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none focus:border-indigo-600 focus:border-signal-600 focus:ring-2 focus:ring-indigo-200 focus:ring-signal-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-900 dark:!bg-ink-900 dark:focus:!border-signal-500 dark:focus:!ring-signal-600/30"
              />
              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="mt-2 text-sm text-red-700 dark:text-red-300"
                >
                  {errors.password}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-signal-600 !bg-signal-500 px-4 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:!bg-signal-600 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-signal-600 focus:ring-offset-2 dark:focus:ring-offset-ink-900"
            >
              Log in
            </button>
          </form>
          <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
            New to WriteSpace?{" "}
            <Link
              to="/register"
              className="font-semibold text-indigo-700 text-signal-600 transition-colors duration-200 hover:text-signal-700 dark:text-indigo-300 dark:!text-signal-500 dark:hover:!text-signal-400"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
