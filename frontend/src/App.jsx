import PropTypes from 'prop-types';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthenticatedShell from './components/AuthenticatedShell';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ReadBlog from './pages/ReadBlog';
import RegisterPage from './pages/RegisterPage';
import WriteBlog from './pages/WriteBlog';
import { getSession } from './utils/auth';

/**
 * Render a temporary protected page for a later WriteSpace feature route.
 *
 * Args:
 *   title: The page heading to display.
 * Returns:
 *   The local protected placeholder route content.
 */
function ProtectedPlaceholder({ title }) {
  const session = getSession();
  return (
    <AuthenticatedShell session={session}>
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <p className="text-sm font-medium text-indigo-700">WriteSpace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-4 max-w-xl text-slate-600">This section will be available in its dedicated feature release.</p>
      </section>
    </AuthenticatedShell>
  );
}

ProtectedPlaceholder.propTypes = {
  title: PropTypes.string.isRequired,
};

/**
 * Render the complete client-side WriteSpace route graph.
 *
 * Returns:
 *   The application route elements.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/blogs" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/blog/:id" element={<ProtectedRoute><ReadBlog /></ProtectedRoute>} />
      <Route path="/write" element={<ProtectedRoute><WriteBlog /></ProtectedRoute>} />
      <Route path="/edit/:id" element={<ProtectedRoute><WriteBlog /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute role="Admin"><ProtectedPlaceholder title="Admin" /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute role="Admin"><ProtectedPlaceholder title="User management" /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
