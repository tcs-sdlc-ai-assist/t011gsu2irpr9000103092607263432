import { describe, expect, it } from 'vitest';
import {
  canManagePost,
  formatPostDate,
  getExcerpt,
  sortPostsNewestFirst,
  validatePost,
} from './blog';

describe('blog helpers', () => {
  it('validates both required post fields and accepts trimmed content', () => {
    expect(validatePost({ title: ' ', content: '' })).toEqual({
      title: 'A title is required.',
      content: 'Content is required.',
    });
    expect(validatePost({ title: ' Ready ', content: 'Body' })).toEqual({});
  });

  it('allows owners and administrators but rejects guests and other users', () => {
    const post = { authorId: 'writer-1' };

    expect(canManagePost({ userId: 'writer-1', role: 'user' }, post)).toBe(true);
    expect(canManagePost({ userId: 'admin', role: 'Admin' }, post)).toBe(true);
    expect(canManagePost({ userId: 'reader-2', role: 'user' }, post)).toBe(false);
    expect(canManagePost(null, post)).toBe(false);
  });

  it('sorts a copy newest first and does not mutate the stored source array', () => {
    const posts = [
      { id: 'old', createdAt: '2024-01-01T00:00:00.000Z' },
      { id: 'new', createdAt: '2025-01-01T00:00:00.000Z' },
    ];

    expect(sortPostsNewestFirst(posts).map((post) => post.id)).toEqual(['new', 'old']);
    expect(posts.map((post) => post.id)).toEqual(['old', 'new']);
    expect(sortPostsNewestFirst(null)).toEqual([]);
  });

  it('normalizes excerpts at 120 characters and handles invalid dates safely', () => {
    const longContent = `${'word '.repeat(30)}tail`;

    expect(getExcerpt(longContent)).toHaveLength(120);
    expect(getExcerpt('<img src=x onerror=alert(1)>')).toBe('<img src=x onerror=alert(1)>');
    expect(formatPostDate('not-a-date')).toBe('');
  });
});
