import {
  getPosts,
  getSeedFlag,
  savePosts,
  SEED_KEY,
  setSeedFlag,
} from './storage';
import { FREE_IMAGES } from './images';

const SEED_POSTS = [
  {
    title: 'Finding Space for a Slower Morning',
    content:
      'A quiet morning does not need to be empty. It can hold a warm drink, a short walk, and enough time to notice what the day is asking of you.',
    createdAt: '2024-04-18T08:30:00.000Z',
  },
  {
    title: 'Notes from the Edge of the Water',
    content:
      'The shoreline changes with every wave, yet it keeps its familiar shape. Writing can work the same way: each draft moves the boundary a little closer to the truth.',
    createdAt: '2024-03-09T14:15:00.000Z',
  },
  {
    title: 'What the Forest Teaches About Attention',
    content:
      'Under a canopy of trees, small details become easier to hear. The practice is simple: pause, look again, and let the ordinary become worth remembering.',
    createdAt: '2024-01-27T11:45:00.000Z',
  },
];

/**
 * Seed three sample stories once when readable browser storage is empty.
 *
 * Returns:
 *   Nothing. Storage and UUID failures are handled without escaping.
 */
export function seedIfFirstRun() {
  try {
    if (getSeedFlag()) return;

    const posts = getPosts();
    if (posts.length > 0) {
      setSeedFlag();
      return;
    }

    try {
      localStorage.getItem(SEED_KEY);
    } catch (error) {
      return;
    }

    const seededPosts = SEED_POSTS.map((post, index) => ({
      id: crypto.randomUUID(),
      ...post,
      authorId: 'admin',
      authorName: 'Admin',
      authorRole: 'Admin',
      coverImage: FREE_IMAGES[index].path,
      gallery: [],
    }));

    if (savePosts(seededPosts)) {
      setSeedFlag();
    }
  } catch (error) {
    return;
  }
}
