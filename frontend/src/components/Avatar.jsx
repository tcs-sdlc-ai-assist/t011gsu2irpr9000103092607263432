import PropTypes from "prop-types";

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
  const isAdmin = role === "Admin";
  const marker = isAdmin ? "Crown" : "Book";

  return (
    <span
      aria-label={`${displayName} ${marker} avatar`}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ${
        isAdmin ? "bg-violet-600" : "bg-indigo-500"
      }`}
    >
      {marker}
    </span>
  );
}

Avatar.propTypes = {
  displayName: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
};
