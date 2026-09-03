import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { getSession } from "../utils/auth";

/**
 * Gate a route by session and optionally restrict it to administrators.
 *
 * Args:
 *   children: The protected route content.
 *   role: An optional role required to access the route.
 * Returns:
 *   Protected content or a safe redirect.
 */
export default function ProtectedRoute({ children, role = null }) {
  const location = useLocation();
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role === "Admin" && session.role !== "Admin") {
    return <Navigate to="/blogs" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  role: PropTypes.string,
};
