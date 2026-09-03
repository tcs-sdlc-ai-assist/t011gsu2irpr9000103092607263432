import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticate, clearSession, getSession, setSession } from './auth';

/** Reset local state before each authentication behavior test. */
beforeEach(() => {
  localStorage.clear();
});

describe('authentication helpers', () => {
  it('authenticates the virtual admin before matching stored users', () => {
    localStorage.setItem('writespace_users', JSON.stringify([{
      id: 'shadow-admin', username: 'ADMIN', displayName: 'Not Admin', password: 'admin', role: 'user',
    }]));

    expect(authenticate('admin', 'admin')).toEqual({
      userId: 'admin', username: 'admin', displayName: 'Admin', role: 'Admin',
    });
  });

  it('fails authentication when stored credentials do not match', () => {
    localStorage.setItem('writespace_users', JSON.stringify([{
      id: 'user-1', username: 'writer', displayName: 'Writer', password: 'correct', role: 'user',
    }]));

    expect(authenticate('writer', 'incorrect')).toBeNull();
  });

  it('returns null for a malformed session stored in localStorage', () => {
    localStorage.setItem('writespace_session', '{broken');

    expect(getSession()).toBeNull();
  });

  it('rejects invalid session fields without writing to storage', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    expect(setSession({ username: 'writer' })).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('stores and clears a valid four-field session', () => {
    const session = { userId: 'user-1', username: 'writer', displayName: 'Writer', role: 'user' };

    expect(setSession(session)).toBe(true);
    expect(getSession()).toEqual(session);
    expect(clearSession()).toBe(true);
    expect(getSession()).toBeNull();
  });
});
