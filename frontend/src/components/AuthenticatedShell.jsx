import { useState } from "react";
import PropTypes from "prop-types";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import ThemeToggle from "./ThemeToggle";
import { clearSession } from "../utils/auth";

/**
 * Provide navigation and account controls for signed-in WriteSpace users.
 *
 * Args:
 *   children: Authenticated page content.
 *   session: The current valid session.
 * Returns:
 *   The authenticated application shell.
 */
export default function AuthenticatedShell({ children, session }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const linkClass = ({ isActive }) =>
    `text-sm font-medium ${
      isActive
        ? "text-indigo-700 dark:text-indigo-300"
        : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
    }`;

  /** Clear the session and return the visitor to the login page. */
  function handleLogout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            to="/blogs"
            className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100"
          >
            WriteSpace
          </Link>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 md:hidden dark:border-slate-700 dark:text-slate-200"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            Menu
          </button>
          <nav
            className="hidden items-center gap-5 md:flex"
            aria-label="Authenticated navigation"
          >
            <NavLink to="/blogs" className={linkClass}>
              Stories
            </NavLink>
            <NavLink to="/write" className={linkClass}>
              Write
            </NavLink>
            {session.role === "Admin" && (
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            )}
            {session.role === "Admin" && (
              <NavLink to="/users" className={linkClass}>
                User management
              </NavLink>
            )}
            <ThemeToggle />
            <Avatar displayName={session.displayName} role={session.role} />
            <button
              type="button"
              className="text-sm font-medium text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              onClick={handleLogout}
            >
              Log out
            </button>
          </nav>
        </div>
        {isMenuOpen && (
          <nav
            className="border-t border-slate-200 px-5 py-4 md:hidden dark:border-slate-800"
            aria-label="Mobile authenticated navigation"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-4">
              <NavLink
                to="/blogs"
                className={linkClass}
                onClick={() => setIsMenuOpen(false)}
              >
                Stories
              </NavLink>
              <NavLink
                to="/write"
                className={linkClass}
                onClick={() => setIsMenuOpen(false)}
              >
                Write
              </NavLink>
              {session.role === "Admin" && (
                <NavLink
                  to="/admin"
                  className={linkClass}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </NavLink>
              )}
              {session.role === "Admin" && (
                <NavLink
                  to="/users"
                  className={linkClass}
                  onClick={() => setIsMenuOpen(false)}
                >
                  User management
                </NavLink>
              )}
              <ThemeToggle />
              <button
                type="button"
                className="w-fit text-sm font-medium text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </nav>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}

AuthenticatedShell.propTypes = {
  children: PropTypes.node.isRequired,
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }).isRequired,
};
