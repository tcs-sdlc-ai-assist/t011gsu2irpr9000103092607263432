import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import AuthenticatedShell from './AuthenticatedShell';
import Avatar from './Avatar';
import ProtectedRoute from './ProtectedRoute';
import PublicShell from './PublicShell';

/** Clear session state before route guard tests. */
beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, '', '/protected');
});

describe('shared application components', () => {
  it('renders the required Crown and Book role markers with their role colors', () => {
    const { rerender } = render(<Avatar displayName="Admin" role="Admin" />);
    expect(screen.getByLabelText('Admin Crown avatar')).toHaveTextContent('Crown');
    expect(screen.getByLabelText('Admin Crown avatar')).toHaveClass('bg-violet-600');

    rerender(<Avatar displayName="Writer" role="user" />);
    expect(screen.getByLabelText('Writer Book avatar')).toHaveTextContent('Book');
    expect(screen.getByLabelText('Writer Book avatar')).toHaveClass('bg-indigo-500');
  });

  it('redirects guests to login and non-admin users away from Admin content', () => {
    const renderGuard = () => render(
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<h1>Login destination</h1>} />
          <Route path="/blogs" element={<h1>Stories destination</h1>} />
          <Route path="/protected" element={<ProtectedRoute><h1>Protected content</h1></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="Admin"><h1>Admin content</h1></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>,
    );

    renderGuard();
    expect(screen.getByRole('heading', { name: 'Login destination' })).toBeInTheDocument();

    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'writer', username: 'writer', displayName: 'Writer', role: 'user' }));
    window.history.pushState({}, '', '/admin');
    renderGuard();
    expect(screen.getByRole('heading', { name: 'Stories destination' })).toBeInTheDocument();
  });

  it('opens the public mobile menu and exposes its navigation links', async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><PublicShell><h1>Public content</h1></PublicShell></BrowserRouter>);

    await user.click(screen.getByRole('button', { name: 'Toggle navigation menu' }));
    const mobileNavigation = screen.getByRole('navigation', {
      name: 'Mobile public navigation',
    });
    expect(mobileNavigation).toBeVisible();
    expect(
      within(mobileNavigation).getByRole('link', { name: 'Create account' }),
    ).toBeVisible();
  });

  it('opens the authenticated mobile menu with role-aware controls', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AuthenticatedShell session={{ userId: 'admin', username: 'admin', displayName: 'Admin', role: 'Admin' }}>
          <h1>Admin content</h1>
        </AuthenticatedShell>
      </BrowserRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Toggle navigation menu' }));
    const mobileNavigation = screen.getByRole('navigation', {
      name: 'Mobile authenticated navigation',
    });
    expect(mobileNavigation).toBeVisible();
    expect(
      within(mobileNavigation).getByRole('link', { name: 'User management' }),
    ).toHaveAttribute('href', '/users');
  });
});
