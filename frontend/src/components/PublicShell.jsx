import { useState } from "react";
import PropTypes from "prop-types";
import { Link, NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

/**
 * Provide the responsive public header, content frame, and footer.
 *
 * Args:
 *   children: Page content to render inside the shell.
 * Returns:
 *   The public application shell.
 */
export default function PublicShell({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const linkClass = ({ isActive }) =>
    `inline-flex items-center whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 active:scale-[0.98] ${
      isActive
        ? "bg-signal-500/10 text-signal-600 dark:bg-signal-400/15 dark:text-signal-400"
        : "text-slate-600 hover:bg-black/5 hover:text-ink-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
    }`;

  return (
    <div className="min-h-[100dvh] bg-[#f4f4f7] font-sans text-[#191b1f] dark:bg-slate-900 dark:!bg-[#191b1f] dark:text-slate-100 dark:!text-white">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f4f4f7]/90 text-[#191b1f] backdrop-blur-xl dark:border-slate-700 dark:!border-white/10 dark:bg-slate-900 dark:!bg-[#191b1f]/90 dark:text-slate-100 dark:!text-white">
        <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 rounded-full text-lg font-semibold tracking-tight text-ink-950 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 dark:text-slate-100 dark:text-white dark:focus-visible:ring-offset-ink-950"
          >
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-[3px] bg-signal-500"
            />
            WriteSpace
          </Link>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-ink-950 transition-colors duration-200 hover:bg-black/5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 md:hidden dark:border-slate-700 dark:border-white/15 dark:text-slate-100 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-offset-ink-950"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            Menu
          </button>
          <nav
            className="hidden items-center gap-1 whitespace-nowrap md:flex"
            aria-label="Public navigation"
          >
            <NavLink to="/" className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/blogs" className={linkClass}>
              Stories
            </NavLink>
            <ThemeToggle />
            <NavLink to="/login" className={linkClass}>
              Log in
            </NavLink>
            <Link
              to="/register"
              className="ml-1 inline-flex whitespace-nowrap rounded-full bg-signal-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-signal-600 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ink-950"
            >
              Create account
            </Link>
          </nav>
        </div>
        {isMenuOpen && (
          <nav
            className="px-5 pb-4 md:hidden sm:px-8"
            aria-label="Mobile public navigation"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-1 rounded-2xl border border-black/5 bg-white p-3 dark:border-slate-800 dark:!border-white/10 dark:bg-slate-800 dark:bg-ink-900 dark:!bg-ink-900 dark:text-slate-100">
              <NavLink
                to="/"
                className={linkClass}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </NavLink>
              <NavLink
                to="/blogs"
                className={linkClass}
                onClick={() => setIsMenuOpen(false)}
              >
                Stories
              </NavLink>
              <ThemeToggle />
              <NavLink
                to="/login"
                className={linkClass}
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </NavLink>
              <NavLink
                to="/register"
                className={linkClass}
                onClick={() => setIsMenuOpen(false)}
              >
                Create account
              </NavLink>
            </div>
          </nav>
        )}
      </header>
      <main>{children}</main>
      <footer className="border-t border-slate-700 !border-white/10 bg-slate-800 bg-ink-900 !bg-ink-900">
        <div className="mx-auto max-w-6xl px-5 py-7 text-sm text-slate-300 sm:px-8">
          A quiet place for your words.
        </div>
      </footer>
    </div>
  );
}

PublicShell.propTypes = {
  children: PropTypes.node.isRequired,
};