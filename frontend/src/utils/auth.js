import { getUsers } from './storage';

/** Storage key for the active browser-only session. */
export const SESSION_KEY = 'writespace_session';

/**
 * Normalize a candidate session into the safe four-field public session shape.
 *
 * Args:
 *   session: An unknown session candidate.
 * Returns:
 *   A normalized session or null when required fields are missing.
 */
function normalizeSession(session) {
  if (!session || typeof session !== 'object') {
    return null;
  }

  const { userId, username, displayName, role } = session;
  if (
    typeof userId !== 'string' || !userId ||
    typeof username !== 'string' || !username ||
    typeof displayName !== 'string' || !displayName ||
    (role !== 'Admin' && role !== 'user')
  ) {
    return null;
  }

  return { userId, username, displayName, role };
}

/**
 * Retrieve the active session, failing closed when storage is corrupt.
 *
 * Returns:
 *   A valid normalized session or null.
 */
export function getSession() {
  try {
    const rawSession = localStorage.getItem(SESSION_KEY);
    return rawSession === null ? null : normalizeSession(JSON.parse(rawSession));
  } catch (error) {
    return null;
  }
}

/**
 * Persist a valid session without passwords.
 *
 * Args:
 *   session: A session candidate containing public identity fields only.
 * Returns:
 *   Whether the normalized session was stored.
 */
export function setSession(session) {
  const normalized = normalizeSession(session);
  if (!normalized) {
    return false;
  }

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Remove the active session when browser storage permits it.
 *
 * Returns:
 *   Whether the session was removed.
 */
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Authenticate supplied credentials against the virtual admin then stored users.
 *
 * Args:
 *   username: The requested username.
 *   password: The requested password.
 * Returns:
 *   A safe session object or null for invalid credentials.
 */
export function authenticate(username, password) {
  const normalizedUsername = String(username || '').trim().toLowerCase();
  if (normalizedUsername === 'admin' && password === 'admin') {
    return { userId: 'admin', username: 'admin', displayName: 'Admin', role: 'Admin' };
  }

  const user = getUsers().find((candidate) => (
    candidate &&
    String(candidate.username || '').trim().toLowerCase() === normalizedUsername &&
    candidate.password === password
  ));

  return user
    ? normalizeSession({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role || 'user',
    })
    : null;
}
