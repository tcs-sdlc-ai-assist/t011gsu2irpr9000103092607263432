import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import AuthenticatedShell from '../components/AuthenticatedShell';
import { getSession } from '../utils/auth';
import { getUsers, saveUsers } from '../utils/storage';

const defaultAdmin = {
  id: 'admin',
  displayName: 'Admin',
  username: 'admin',
  role: 'Admin',
  createdAt: 'Built-in account',
  isDefault: true,
};

/**
 * Create a browser-safe local user identifier when UUID support is unavailable.
 *
 * Returns:
 *   A new local identifier.
 */
function createUserId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Normalize usernames for case-insensitive local uniqueness checks.
 *
 * Args:
 *   username: The candidate username.
 * Returns:
 *   The trimmed lower-case username.
 */
function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

/**
 * Render local account creation and deletion controls for administrators.
 *
 * Returns:
 *   The authenticated user management page.
 */
export default function UserManagement() {
  const session = getSession();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ displayName: '', username: '', password: '', role: 'user' });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState('');

  /** Refresh stored records while retaining the virtual built-in administrator. */
  const refresh = useCallback(() => {
    setUsers(getUsers());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Update one field in the local account form.
   *
   * Args:
   *   event: The changed field event.
   * Returns:
   *   Nothing.
   */
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  /**
   * Create one validated local user after a fresh administrator check.
   *
   * Args:
   *   event: The submitted account form event.
   * Returns:
   *   Nothing.
   */
  function handleSubmit(event) {
    event.preventDefault();
    setFeedback('');
    const nextErrors = {};
    if (!form.displayName.trim()) nextErrors.displayName = 'Display name is required.';
    if (!form.username.trim()) nextErrors.username = 'Username is required.';
    if (!form.password.trim()) nextErrors.password = 'Password is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const currentSession = getSession();
    if (!currentSession || currentSession.role !== 'Admin') {
      setFeedback('Only an administrator can create users.');
      return;
    }

    const normalizedUsername = normalizeUsername(form.username);
    const currentUsers = getUsers();
    if (normalizedUsername === defaultAdmin.username || currentUsers.some((user) => user && normalizeUsername(user.username) === normalizedUsername)) {
      setErrors({ username: 'This username is already in use.' });
      return;
    }

    const newUser = {
      id: createUserId(),
      displayName: form.displayName.trim(),
      username: form.username.trim(),
      password: form.password.trim(),
      role: form.role === 'Admin' ? 'Admin' : 'user',
      createdAt: new Date().toISOString(),
    };
    if (!saveUsers([...currentUsers, newUser])) {
      setFeedback('Unable to create this user. Please try again.');
      return;
    }

    setForm({ displayName: '', username: '', password: '', role: 'user' });
    setErrors({});
    setFeedback('User created.');
    refresh();
  }

  /**
   * Delete an eligible stored account after fresh validation and confirmation.
   *
   * Args:
   *   userId: The stored user identifier to remove.
   * Returns:
   *   Nothing.
   */
  function handleDelete(userId) {
    setFeedback('');
    const currentSession = getSession();
    if (!currentSession || currentSession.role !== 'Admin') {
      setFeedback('Only an administrator can delete users.');
      return;
    }
    if (userId === defaultAdmin.id) {
      setFeedback('Default admin cannot be deleted.');
      return;
    }
    if (currentSession.userId === userId) {
      setFeedback('You cannot delete the active user session.');
      return;
    }

    const currentUsers = getUsers();
    const target = currentUsers.find((user) => user && user.id === userId);
    if (!target) {
      setFeedback('This user is no longer available.');
      refresh();
      return;
    }
    if (!window.confirm(`Delete ${target.displayName || target.username || 'this user'}? This cannot be undone.`)) return;

    if (!saveUsers(currentUsers.filter((user) => !user || user.id !== userId))) {
      setFeedback('Unable to delete this user. Please try again.');
      return;
    }

    setFeedback('User deleted.');
    refresh();
  }

  if (!session) return null;

  const records = [defaultAdmin, ...users.filter((user) => user && user.id !== defaultAdmin.id)];
  const renderActions = (record) => (
    record.isDefault ? (
      <button type="button" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={() => handleDelete(record.id)}>Delete</button>
    ) : (
      <button type="button" className="rounded-md border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50" onClick={() => handleDelete(record.id)}>Delete</button>
    )
  );

  return (
    <AuthenticatedShell session={session}>
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">Administration</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">User management</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Create and maintain browser-local WriteSpace accounts.</p>
        </div>

        <form className="mt-10 rounded-lg border border-slate-200 bg-white p-6 sm:p-8" onSubmit={handleSubmit} noValidate>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Add a user</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="display-name" className="block text-sm font-semibold text-slate-800">Display name</label>
              <input id="display-name" name="displayName" value={form.displayName} onChange={handleChange} aria-required="true" aria-invalid={Boolean(errors.displayName)} aria-describedby={errors.displayName ? 'display-name-error' : undefined} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
              {errors.displayName && <p id="display-name-error" className="mt-2 text-sm text-rose-700" role="alert">{errors.displayName}</p>}
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-800">Username</label>
              <input id="username" name="username" value={form.username} onChange={handleChange} aria-required="true" aria-invalid={Boolean(errors.username)} aria-describedby={errors.username ? 'username-error' : undefined} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
              {errors.username && <p id="username-error" className="mt-2 text-sm text-rose-700" role="alert">{errors.username}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-800">Password</label>
              <input id="password" name="password" type="password" value={form.password} onChange={handleChange} aria-required="true" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
              {errors.password && <p id="password-error" className="mt-2 text-sm text-rose-700" role="alert">{errors.password}</p>}
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-slate-800">Role</label>
              <select id="role" name="role" value={form.role} onChange={handleChange} className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200">
                <option value="Admin">Admin</option>
                <option value="user">user</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button type="submit" className="rounded-md bg-indigo-700 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">Create user</button>
            {feedback && <p className="text-sm font-medium text-slate-700" role="status">{feedback}</p>}
          </div>
        </form>

        <section className="mt-10" aria-labelledby="user-records-heading">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 id="user-records-heading" className="text-xl font-semibold tracking-tight text-slate-950">User records</h2>
              <p className="mt-1 text-sm text-slate-600">The built-in Admin account is always available.</p>
            </div>
            <button type="button" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900" onClick={refresh}>Refresh</button>
          </div>
          <table className="mt-5 hidden w-full border-separate border-spacing-0 overflow-hidden rounded-lg border border-slate-200 bg-white text-left md:table">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th scope="col" className="border-b border-slate-200 px-5 py-3 font-semibold">Display name</th>
                <th scope="col" className="border-b border-slate-200 px-5 py-3 font-semibold">Username</th>
                <th scope="col" className="border-b border-slate-200 px-5 py-3 font-semibold">Role</th>
                <th scope="col" className="border-b border-slate-200 px-5 py-3 font-semibold">Created</th>
                <th scope="col" className="border-b border-slate-200 px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="text-sm text-slate-700">
                  <td className="border-b border-slate-200 px-5 py-4 font-medium text-slate-950">{record.displayName || 'Unnamed user'}</td>
                  <td className="border-b border-slate-200 px-5 py-4 font-mono text-xs">{record.username || '—'}</td>
                  <td className="border-b border-slate-200 px-5 py-4">{record.role}</td>
                  <td className="border-b border-slate-200 px-5 py-4 text-slate-600">{record.createdAt || 'Unknown date'}</td>
                  <td className="border-b border-slate-200 px-5 py-4">{renderActions(record)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-5 grid gap-4 md:hidden" aria-label="User records">
            {records.map((record) => (
              <article key={record.id} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-950">{record.displayName || 'Unnamed user'}</h3>
                    <p className="mt-1 font-mono text-xs text-slate-600">{record.username || '—'}</p>
                  </div>
                  <span className="text-sm font-medium text-slate-700">{record.role}</span>
                </div>
                <p className="mt-4 text-sm text-slate-600">Created: {record.createdAt || 'Unknown date'}</p>
                <div className="mt-4">{renderActions(record)}</div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </AuthenticatedShell>
  );
}

UserManagement.propTypes = {};
