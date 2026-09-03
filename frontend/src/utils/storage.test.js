import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPosts,
  getUsers,
  POSTS_KEY,
  savePosts,
  saveUsers,
  USERS_KEY,
} from './storage';

/** Reset browser storage and spies between storage adapter tests. */
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('local storage adapters', () => {
  it('returns persisted post and user arrays from their exact keys', () => {
    const posts = [{ id: 'post-1', title: 'Stored post' }];
    const users = [{ id: 'user-1', username: 'writer' }];
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    expect(getPosts()).toEqual(posts);
    expect(getUsers()).toEqual(users);
  });

  it('returns empty arrays for malformed and non-array storage values', () => {
    localStorage.setItem(POSTS_KEY, '{broken');
    localStorage.setItem(USERS_KEY, JSON.stringify({ username: 'writer' }));

    expect(getPosts()).toEqual([]);
    expect(getUsers()).toEqual([]);
  });

  it('returns empty arrays when browser reads throw', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(getPosts()).toEqual([]);
    expect(getUsers()).toEqual([]);
  });

  it('rejects non-array writes without changing existing storage', () => {
    localStorage.setItem(POSTS_KEY, JSON.stringify([{ id: 'preserved' }]));

    expect(savePosts({ id: 'invalid' })).toBe(false);
    expect(JSON.parse(localStorage.getItem(POSTS_KEY))).toEqual([{ id: 'preserved' }]);
  });

  it('returns false and preserves unrelated records when a write throws', () => {
    localStorage.setItem(POSTS_KEY, JSON.stringify([{ id: 'post-1' }]));
    localStorage.setItem(USERS_KEY, JSON.stringify([{ id: 'user-1' }]));
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(savePosts([{ id: 'post-2' }])).toBe(false);
    expect(saveUsers([{ id: 'user-2' }])).toBe(false);
    expect(JSON.parse(localStorage.getItem(POSTS_KEY))).toEqual([{ id: 'post-1' }]);
    expect(JSON.parse(localStorage.getItem(USERS_KEY))).toEqual([{ id: 'user-1' }]);
  });
});
