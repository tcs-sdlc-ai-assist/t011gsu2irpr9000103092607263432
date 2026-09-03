import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import AuthenticatedShell from "../components/AuthenticatedShell";
import Avatar from "../components/Avatar";
import { getSession } from "../utils/auth";
import { getPosts } from "../utils/storage";
import {
  canManagePost,
  formatPostDate,
  getExcerpt,
  sortPostsNewestFirst,
} from "../utils/blog";

const accentClasses = [
  "border-indigo-500",
  "border-violet-500",
  "border-pink-500",
  "border-teal-500",
];

/**
 * Render the authenticated, newest-first collection of local stories.
 *
 * Returns:
 *   The WriteSpace story index.
 */
export default function Home() {
  const session = getSession();
  const [posts, setPosts] = useState([]);

  /**
   * Load persisted stories after the page mounts without trusting storage.
   *
   * Returns:
   *   Nothing.
   */
  useEffect(() => {
    try {
      setPosts(sortPostsNewestFirst(getPosts()));
    } catch (error) {
      setPosts([]);
    }
  }, []);

  if (!session) return null;

  return (
    <AuthenticatedShell session={session}>
      <section className="mx-auto max-w-6xl px-5 py-16 text-ink-950 dark:bg-slate-900 dark:text-slate-100 dark:!bg-ink-950 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700 text-signal-600 dark:text-indigo-300 dark:!text-signal-500">
              WriteSpace
            </p>
            <h1 className="mt-2 text-[2.125rem] font-semibold leading-[1.12] tracking-tight text-slate-950 text-ink-950 dark:text-slate-100 sm:text-5xl">
              Stories
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
              Read fresh ideas from the WriteSpace community.
            </p>
          </div>
          <Link
            to="/write"
            className="rounded-full bg-indigo-700 bg-signal-600 !bg-signal-500 px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:!bg-signal-600 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-signal-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900 dark:focus:!ring-offset-ink-950"
          >
            Write a story
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:!border-white/10 dark:!bg-ink-900">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">
              No stories yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-slate-600 dark:text-slate-300">
              Be the first to share an idea with the community.
            </p>
            <Link
              to="/write"
              className="mt-6 inline-flex rounded-full bg-indigo-700 bg-signal-600 !bg-signal-500 px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:!bg-signal-600 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-signal-600 focus:ring-offset-2 dark:focus:ring-offset-slate-800 dark:focus:!ring-offset-ink-900"
            >
              Write a story
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <article
                key={post.id}
                className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 border-black/5 border-t-4 ${accentClasses[index % accentClasses.length]} bg-white ring-1 ring-inset ring-signal-600/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:!border-white/10 dark:!bg-ink-900`}
              >
                {typeof post.coverImage === "string" && post.coverImage ? (
                  <img
                    src={post.coverImage}
                    alt={`${post.title || "Story"} cover`}
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="aspect-video w-full bg-gradient-to-r from-signal-600 via-signal-500 to-ink-800"
                  />
                )}
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-signal-600 dark:text-signal-500">
                    {formatPostDate(post.createdAt)}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                    <Link
                      to={`/blog/${post.id}`}
                      className="transition-colors duration-200 hover:text-indigo-700 hover:text-signal-600 dark:hover:text-indigo-300 dark:hover:!text-signal-400"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {getExcerpt(post.content)}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        displayName={post.authorName || "Unknown author"}
                        role={post.authorRole || "user"}
                      />
                      <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                        {post.authorName || "Unknown author"}
                      </span>
                    </div>
                    {canManagePost(session, post) && (
                      <Link
                        to={`/edit/${post.id}`}
                        className="rounded-full border border-black/10 px-3 py-1.5 text-sm font-semibold text-indigo-700 text-signal-600 transition-colors duration-200 hover:bg-signal-50 hover:text-signal-700 dark:border-white/10 dark:text-indigo-300 dark:!text-signal-400 dark:hover:!bg-ink-800"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AuthenticatedShell>
  );
}

Home.propTypes = {};
