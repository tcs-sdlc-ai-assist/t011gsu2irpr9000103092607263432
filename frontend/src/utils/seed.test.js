import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FREE_IMAGES } from './images';
import { seedIfFirstRun } from './seed';
import { POSTS_KEY, SEED_KEY } from './storage';

/** Return the current persisted post collection. */
function readStoredPosts() {
  return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
}

beforeEach(() => {
  localStorage.clear();
  let sequence = 0;
  vi.stubGlobal('crypto', {
    randomUUID: vi.fn(() => `seed-id-${++sequence}`),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('seedIfFirstRun', () => {
  it('creates exactly three complete fixed sample posts and marks storage seeded', () => {
    seedIfFirstRun();

    const posts = readStoredPosts();
    expect(posts).toHaveLength(3);
    expect(posts.map((post) => post.id)).toEqual([
      'seed-id-1',
      'seed-id-2',
      'seed-id-3',
    ]);
    expect(posts.map((post) => post.createdAt)).toEqual([
      '2024-04-18T08:30:00.000Z',
      '2024-03-09T14:15:00.000Z',
      '2024-01-27T11:45:00.000Z',
    ]);
    expect(new Set(posts.map((post) => post.coverImage)).size).toBe(3);
    expect(posts.map((post) => post.coverImage)).toEqual(
      FREE_IMAGES.slice(0, 3).map((image) => image.path),
    );
    posts.forEach((post) => {
      expect(post).toMatchObject({
        authorId: 'admin',
        authorName: 'Admin',
        authorRole: 'Admin',
        gallery: [],
      });
      expect(post.title).toEqual(expect.any(String));
      expect(post.content).toEqual(expect.any(String));
    });
    expect(localStorage.getItem(SEED_KEY)).toBe('true');
  });

  it('does not duplicate posts when called a second time', () => {
    seedIfFirstRun();
    const firstState = localStorage.getItem(POSTS_KEY);

    seedIfFirstRun();

    expect(localStorage.getItem(POSTS_KEY)).toBe(firstState);
    expect(readStoredPosts()).toHaveLength(3);
    expect(crypto.randomUUID).toHaveBeenCalledTimes(3);
  });

  it('does not reseed after a user deletes every post once flagged', () => {
    seedIfFirstRun();
    localStorage.setItem(POSTS_KEY, '[]');

    seedIfFirstRun();

    expect(readStoredPosts()).toEqual([]);
    expect(localStorage.getItem(SEED_KEY)).toBe('true');
  });

  it('preserves an upgraded install custom post and sets only the flag', () => {
    const customPosts = [{ id: 'custom', title: 'Keep me' }];
    localStorage.setItem(POSTS_KEY, JSON.stringify(customPosts));

    seedIfFirstRun();

    expect(readStoredPosts()).toEqual(customPosts);
    expect(localStorage.getItem(SEED_KEY)).toBe('true');
    expect(crypto.randomUUID).not.toHaveBeenCalled();
  });

  it('does not set the flag or throw when saving posts fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key) => {
      if (key === POSTS_KEY) throw new Error('quota exceeded');
    });

    expect(() => seedIfFirstRun()).not.toThrow();
    expect(localStorage.getItem(SEED_KEY)).toBeNull();
    expect(readStoredPosts()).toEqual([]);
  });

  it('does not write or throw when browser storage reads are unavailable', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(() => seedIfFirstRun()).not.toThrow();
    expect(setItem).not.toHaveBeenCalled();
  });

  it('does not partially write or set the flag when UUID generation fails', () => {
    crypto.randomUUID
      .mockReturnValueOnce('seed-id-1')
      .mockImplementationOnce(() => {
        throw new Error('uuid unavailable');
      });

    expect(() => seedIfFirstRun()).not.toThrow();
    expect(readStoredPosts()).toEqual([]);
    expect(localStorage.getItem(SEED_KEY)).toBeNull();
  });
});
