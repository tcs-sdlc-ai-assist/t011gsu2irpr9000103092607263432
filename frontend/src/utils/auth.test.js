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

  it('authenticates a normalized stored user with a password-free session shape', () => {
    localStorage.setItem('writespace_users', JSON.stringify([{
      id: 'user-1', username: 'Writer', displayName: 'Local Writer', password: 'correct', role: 'user',
    }]));

    expect(authenticate(' writer ', 'correct')).toEqual({
      userId: 'user-1', username: 'Writer', displayName: 'Local Writer', role: 'user',
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

  it('returns false without persisting when session storage writes throw', () => {
    const session = { userId: 'user-1', username: 'writer', displayName: 'Writer', role: 'user' };
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(setSession(session)).toBe(false);
    expect(localStorage.getItem('writespace_session')).toBeNull();
    vi.restoreAllMocks();
  });

  it('returns false and preserves the session when storage removal throws', () => {
    const session = { userId: 'user-1', username: 'writer', displayName: 'Writer', role: 'user' };
    localStorage.setItem('writespace_session', JSON.stringify(session));
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage locked');
    });

    expect(clearSession()).toBe(false);
    expect(JSON.parse(localStorage.getItem('writespace_session'))).toEqual(session);
    vi.restoreAllMocks();
  });
});
