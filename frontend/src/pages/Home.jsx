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
  "border-amber-400",
  "border-emerald-500",
  "border-rose-400",
  "border-cyan-500",
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
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">
              WriteSpace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Stories
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Read fresh ideas from the WriteSpace community.
            </p>
          </div>
          <Link
            to="/write"
            className="rounded-md bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
          >
            Write a story
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              No stories yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-slate-600">
              Be the first to share an idea with the community.
            </p>
            <Link
              to="/write"
              className="mt-6 inline-flex rounded-md bg-indigo-700 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
            >
              Write a story
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <article
                key={post.id}
                className={`flex flex-col border border-slate-200 border-t-4 ${accentClasses[index % accentClasses.length]} bg-white p-6 shadow-sm`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {formatPostDate(post.createdAt)}
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                  <Link
                    to={`/blog/${post.id}`}
                    className="hover:text-indigo-700"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {getExcerpt(post.content)}
                </p>
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      displayName={post.authorName || "Unknown author"}
                      role={post.authorRole || "user"}
                    />
                    <span className="truncate text-sm font-medium text-slate-700">
                      {post.authorName || "Unknown author"}
                    </span>
                  </div>
                  {canManagePost(session, post) && (
                    <Link
                      to={`/edit/${post.id}`}
                      className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                  )}
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
