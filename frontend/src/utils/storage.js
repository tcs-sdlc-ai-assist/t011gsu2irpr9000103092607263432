/** Storage key for all locally persisted posts. */
export const POSTS_KEY = 'writespace_posts';
/** Storage key for all locally persisted accounts. */
export const USERS_KEY = 'writespace_users';
/** Storage key recording that first-run posts have been considered. */
export const SEED_KEY = 'writespace_seeded';

/**
 * Read an array safely from browser storage.
 *
 * Args:
 *   key: The storage key to read.
 * Returns:
 *   A parsed array or an empty array if storage is unavailable or invalid.
 */
function readArray(key) {
  try {
    const value = localStorage.getItem(key);
    const parsed = value === null ? [] : JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

/**
 * Persist an array safely without writing when the value is invalid.
 *
 * Args:
 *   key: The storage key to write.
 *   value: The array to serialize.
 * Returns:
 *   Whether the array was written successfully.
 */
function writeArray(key, value) {
  if (!Array.isArray(value)) {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Return the stored posts or an empty list when unavailable.
 *
 * Returns:
 *   The persisted post array.
 */
export function getPosts() {
  return readArray(POSTS_KEY);
}

/**
 * Save a complete list of posts.
 *
 * Args:
 *   posts: The posts to persist.
 * Returns:
 *   Whether storage accepted the list.
 */
export function savePosts(posts) {
  return writeArray(POSTS_KEY, posts);
}

/**
 * Return stored user accounts or an empty list when unavailable.
 *
 * Returns:
 *   The persisted user array.
 */
export function getUsers() {
  return readArray(USERS_KEY);
}

/**
 * Save a complete list of user accounts.
 *
 * Args:
 *   users: The users to persist.
 * Returns:
 *   Whether storage accepted the list.
 */
export function saveUsers(users) {
  return writeArray(USERS_KEY, users);
}

/**
 * Return whether first-run seeding has completed successfully.
 *
 * Returns:
 *   True only when storage contains the exact string "true".
 */
export function getSeedFlag() {
  try {
    return localStorage.getItem(SEED_KEY) === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Mark first-run seeding as complete using a best-effort write.
 *
 * Returns:
 *   Whether storage accepted the exact seed marker.
 */
export function setSeedFlag() {
  try {
    localStorage.setItem(SEED_KEY, 'true');
    return true;
  } catch (error) {
    return false;
  }
}
