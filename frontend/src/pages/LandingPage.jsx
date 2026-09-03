import { Link } from 'react-router-dom';
import PublicShell from '../components/PublicShell';
import { getPosts } from '../utils/storage';
import { formatPostDate, getExcerpt, sortPostsNewestFirst } from '../utils/blog';

/**
 * Present WriteSpace's public welcome page and latest reader previews.
 *
 * Returns:
 *   The public landing page.
 */
export default function LandingPage() {
  const posts = sortPostsNewestFirst(getPosts()).slice(0, 3);

  return (
    <PublicShell>
      <section className="bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-500 px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">WriteSpace</p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Your thoughts. Your space. Beautifully simple.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/90">
            Read what matters, shape your ideas, and keep every story in one welcoming place.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
              Start writing
            </Link>
            <Link to="/blogs" className="rounded-md border border-white/50 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Explore stories
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-700">From the community</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Latest stories</h2>
          </div>
          <Link to="/blogs" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">View all stories</Link>
        </div>
        {posts.length === 0 ? (
          <p className="mt-8 border border-slate-200 bg-white p-6 text-slate-600">No posts yet — check back soon!</p>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="border border-slate-200 bg-white p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{formatPostDate(post.createdAt)}</p>
                <h3 className="mt-3 text-lg font-semibold">{post.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{getExcerpt(post.content)}</p>
                <Link to={`/blogs/${post.id}`} className="mt-5 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-900">Read story</Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
