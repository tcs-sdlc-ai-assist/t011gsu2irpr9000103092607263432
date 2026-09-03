import PropTypes from 'prop-types';

/**
 * Render a compact initials avatar with a role-specific color treatment.
 *
 * Args:
 *   displayName: The name used to derive initials.
 *   role: The session role that selects the avatar color.
 * Returns:
 *   An accessible avatar marker.
 */
export default function Avatar({ displayName, role }) {
  const initials = String(displayName || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <span
      aria-label={`${displayName} avatar`}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white ${
        role === 'Admin' ? 'bg-violet-600' : 'bg-indigo-500'
      }`}
    >
      {initials}
    </span>
  );
}

Avatar.propTypes = {
  displayName: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
};
