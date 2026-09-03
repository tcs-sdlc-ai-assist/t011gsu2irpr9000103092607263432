import { Link } from "react-router-dom";
import PublicShell from "../components/PublicShell";
import { getPosts } from "../utils/storage";
import {
  formatPostDate,
  getExcerpt,
  sortPostsNewestFirst,
} from "../utils/blog";

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
      <section className="relative overflow-hidden bg-[#f4f4f7] px-5 text-ink-950 dark:bg-slate-900 dark:bg-ink-950 dark:!bg-ink-950 dark:text-slate-100 dark:!text-white sm:px-8">
        <div
          aria-hidden="true"
          className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-signal-500/10 dark:bg-signal-500/15"
        />
        <div className="relative mx-auto grid min-h-[calc(100dvh-4.5rem)] max-w-6xl items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-signal-600 dark:text-signal-400">
              WriteSpace
            </p>
            <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.035em] text-ink-950 sm:text-5xl sm:leading-[1.08] dark:text-slate-100 dark:text-white">
              Your thoughts. Your space. Beautifully simple.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Read what matters, shape your ideas, and keep every story in one
              welcoming place.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex whitespace-nowrap rounded-full bg-signal-500 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-signal-600 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ink-950"
              >
                Start writing
              </Link>
              <Link
                to="/blogs"
                className="inline-flex whitespace-nowrap rounded-full border border-black/15 px-5 py-3 text-sm font-semibold text-ink-950 transition-colors duration-200 hover:bg-black/5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:border-white/20 dark:text-slate-100 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-offset-ink-950"
              >
                Explore stories
              </Link>
            </div>
          </div>
          <div className="relative mx-auto grid w-full max-w-lg grid-cols-[1.15fr_0.85fr] gap-3 lg:mx-0">
            <div className="rounded-2xl bg-signal-500/15 p-2 dark:bg-signal-500/20">
              <img
                src="/images/free/mountains.jpg"
                alt="Mountain landscape inspiring a new story"
                loading="eager"
                fetchpriority="high"
                className="aspect-[4/5] h-full w-full rounded-xl object-cover"
              />
            </div>
            <div className="grid gap-3 pt-10">
              <img
                src="/images/free/books.jpg"
                alt="Open books ready for reading and research"
                loading="lazy"
                className="aspect-square w-full rounded-2xl object-cover"
              />
              <img
                src="/images/free/coffee.jpg"
                alt="Coffee beside a quiet writing space"
                loading="lazy"
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="bg-[#f4f4f7] px-5 py-20 text-ink-950 dark:bg-slate-900 dark:bg-ink-950 dark:!bg-ink-950 dark:text-slate-100 sm:px-8 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-signal-600 dark:text-signal-400">
              From the community
            </p>
            <h2 className="mt-3 text-[28px] font-semibold leading-[34px] tracking-[-0.025em] text-ink-950 md:text-[40px] md:leading-[48px] dark:text-slate-100 dark:text-white">
              Latest stories
            </h2>
            <Link
              to="/blogs"
              className="mt-5 inline-flex rounded-full text-sm font-semibold text-signal-600 transition-colors duration-200 hover:text-signal-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 dark:text-signal-400 dark:hover:text-signal-400 dark:focus-visible:ring-offset-ink-950"
            >
              View all stories
            </Link>
          </div>
          {posts.length === 0 ? (
            <p className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 dark:border-slate-700 dark:!border-white/10 dark:bg-slate-800 dark:bg-ink-900 dark:!bg-ink-900 dark:text-slate-100">
              No posts yet — check back soon!
            </p>
          ) : (
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {posts.map((post, index) => (
                <article
                  key={post.id}
                  className={`group overflow-hidden rounded-2xl border border-black/5 bg-white transition-transform duration-200 hover:-translate-y-1 dark:border-slate-700 dark:!border-white/10 dark:bg-slate-800 dark:bg-ink-900 dark:!bg-ink-900 dark:text-slate-100 ${
                    index === 0 ? "md:col-span-2 md:grid md:grid-cols-2" : ""
                  }`}
                >
                  {typeof post.coverImage === "string" && post.coverImage && (
                    <img
                      src={post.coverImage}
                      alt={`${post.title || "Story"} cover`}
                      loading="lazy"
                      className={`w-full object-cover ${
                        index === 0
                          ? "aspect-video h-full md:aspect-auto"
                          : "aspect-video"
                      }`}
                    />
                  )}
                  <div className="flex flex-col p-6 md:p-7">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {formatPostDate(post.createdAt)}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink-950 dark:text-slate-100 dark:text-white">
                      {post.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {getExcerpt(post.content)}
                    </p>
                    <Link
                      to={`/blog/${post.id}`}
                      className="mt-6 inline-flex w-fit rounded-full text-sm font-semibold text-signal-600 transition-colors duration-200 hover:text-signal-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 dark:text-signal-400 dark:hover:text-signal-400 dark:focus-visible:ring-offset-ink-900"
                    >
                      Read story
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicShell>
  );
}