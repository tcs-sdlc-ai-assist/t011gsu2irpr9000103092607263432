/**
 * Validate the public fields needed to publish a post.
 *
 * Args:
 *   post: A candidate post.
 * Returns:
 *   An object containing field errors, if any.
 */
export function validatePost(post) {
  const errors = {};
  if (!post || !String(post.title || '').trim()) errors.title = 'A title is required.';
  if (!post || !String(post.content || '').trim()) errors.content = 'Content is required.';
  return errors;
}

/**
 * Determine whether a session may alter a specific post.
 *
 * Args:
 *   session: The current public session.
 *   post: The post being managed.
 * Returns:
 *   Whether the session owns the post or is an administrator.
 */
export function canManagePost(session, post) {
  return Boolean(session && post && (session.role === 'Admin' || session.userId === post.authorId));
}

/**
 * Sort post copies from newest to oldest without mutating the source array.
 *
 * Args:
 *   posts: Candidate posts.
 * Returns:
 *   A newest-first post array.
 */
export function sortPostsNewestFirst(posts) {
  return Array.isArray(posts)
    ? [...posts].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
    : [];
}

/**
 * Create a concise content preview with a fixed maximum length.
 *
 * Args:
 *   content: The source post content.
 * Returns:
 *   A whitespace-normalized excerpt of at most 120 characters.
 */
export function getExcerpt(content) {
  const normalized = String(content || '').replace(/\s+/g, ' ').trim();
  return normalized.length > 120 ? `${normalized.slice(0, 117).trimEnd()}...` : normalized;
}

/**
 * Format a post date for a reader's local locale.
 *
 * Args:
 *   value: A date value.
 * Returns:
 *   A readable date or an empty string for invalid values.
 */
export function formatPostDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
