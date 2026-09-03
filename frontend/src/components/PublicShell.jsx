import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, NavLink } from 'react-router-dom';

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
  const linkClass = ({ isActive }) => `text-sm font-medium ${
    isActive ? 'text-indigo-700' : 'text-slate-600 hover:text-slate-950'
  }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="text-lg font-semibold tracking-tight text-slate-950">
            WriteSpace
          </Link>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 md:hidden"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            Menu
          </button>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Public navigation">
            <NavLink to="/" className={linkClass}>Home</NavLink>
            <NavLink to="/blogs" className={linkClass}>Stories</NavLink>
            <NavLink to="/login" className={linkClass}>Log in</NavLink>
            <Link to="/register" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Create account
            </Link>
          </nav>
        </div>
        {isMenuOpen && (
          <nav className="border-t border-slate-200 px-5 py-4 md:hidden" aria-label="Mobile public navigation">
            <div className="mx-auto flex max-w-6xl flex-col gap-4">
              <NavLink to="/" className={linkClass} onClick={() => setIsMenuOpen(false)}>Home</NavLink>
              <NavLink to="/blogs" className={linkClass} onClick={() => setIsMenuOpen(false)}>Stories</NavLink>
              <NavLink to="/login" className={linkClass} onClick={() => setIsMenuOpen(false)}>Log in</NavLink>
              <NavLink to="/register" className={linkClass} onClick={() => setIsMenuOpen(false)}>Create account</NavLink>
            </div>
          </nav>
        )}
      </header>
      <main>{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-6 text-sm text-slate-500 sm:px-8">
          A quiet place for your words.
        </div>
      </footer>
    </div>
  );
}

PublicShell.propTypes = {
  children: PropTypes.node.isRequired,
};
