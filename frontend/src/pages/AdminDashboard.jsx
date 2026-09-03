import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import AuthenticatedShell from "../components/AuthenticatedShell";
import { getSession } from "../utils/auth";
import { getPosts, getUsers, savePosts } from "../utils/storage";
import { formatPostDate, sortPostsNewestFirst } from "../utils/blog";

/**
 * Read all dashboard data without trusting the current component state.
 *
 * Returns:
 *   Fresh local posts and users.
 */
function readDashboardData() {
  return {
    posts: sortPostsNewestFirst(getPosts()),
    users: getUsers(),
  };
}

/**
 * Render administrative statistics and recent post controls.
 *
 * Returns:
 *   The authenticated administration dashboard.
 */
export default function AdminDashboard() {
  const session = getSession();
  const [data, setData] = useState({ posts: [], users: [] });
  const [feedback, setFeedback] = useState("");

  /** Refresh dashboard state from the safe local storage helpers. */
  const refresh = useCallback(() => {
    setData(readDashboardData());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Delete a recent post after fresh administrator validation and confirmation.
   *
   * Args:
   *   postId: The persisted post identifier to remove.
   * Returns:
   *   Nothing.
   */
  function handleDelete(postId) {
    setFeedback("");
    const currentSession = getSession();
    if (!currentSession || currentSession.role !== "Admin") {
      setFeedback("Only an administrator can delete posts.");
      return;
    }

    const currentPosts = getPosts();
    const target = currentPosts.find((post) => post && post.id === postId);
    if (!target) {
      setFeedback("This post is no longer available.");
      refresh();
      return;
    }
    if (
      !window.confirm(
        `Delete “${target.title || "this post"}”? This cannot be undone.`,
      )
    )
      return;

    const nextPosts = currentPosts.filter(
      (post) => !post || post.id !== postId,
    );
    if (!savePosts(nextPosts)) {
      setFeedback("Unable to delete this post. Please try again.");
      return;
    }

    setFeedback("Post deleted.");
    refresh();
  }

  if (!session) return null;

  const storedAdmins = data.users.filter(
    (user) => user && user.role === "Admin",
  ).length;
  const storedUsers = data.users.filter(
    (user) => user && user.role !== "Admin",
  ).length;
  const statistics = [
    { label: "Total Posts", value: data.posts.length },
    { label: "Total Users", value: data.users.length + 1 },
    { label: "Total Admins", value: storedAdmins + 1 },
    { label: "Total users", value: storedUsers },
  ];
  const recentPosts = data.posts.slice(0, 5);

  return (
    <AuthenticatedShell session={session}>
      <section className="mx-auto max-w-6xl px-5 py-16 text-ink-950 dark:bg-slate-900 dark:text-slate-100 dark:!bg-ink-950 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700 text-signal-600 dark:text-indigo-300 dark:!text-signal-500">
              Administration
            </p>
            <h1 className="mt-2 text-[2.125rem] font-semibold leading-[1.12] tracking-tight text-slate-950 text-ink-950 dark:text-slate-100 sm:text-5xl">
              Admin dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
              Review local publishing activity and manage the WriteSpace
              community.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/write"
              className="rounded-full bg-indigo-700 bg-signal-600 !bg-signal-500 px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:!bg-signal-600 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-signal-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900 dark:focus:!ring-offset-ink-950"
            >
              Write a story
            </Link>
            <Link
              to="/users"
              className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors duration-200 hover:bg-slate-100 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-signal-600 focus:ring-offset-2 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-900 dark:!border-white/10 dark:hover:!bg-ink-900"
            >
              Manage users
            </Link>
          </div>
        </div>

        <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statistics.map((statistic) => (
            <div
              key={statistic.label}
              className="overflow-hidden rounded-2xl border border-slate-200 border-black/5 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:!border-white/10 dark:!bg-ink-900"
            >
              <div className="h-1 bg-gradient-to-r from-violet-600 to-indigo-600 !from-signal-600 !to-signal-500" />
              <div className="p-5">
                <dt className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {statistic.label}
                </dt>
                <dd className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-slate-950 dark:text-slate-100">
                  {statistic.value}
                </dd>
              </div>
            </div>
          ))}
        </dl>

        <section
          className="mt-10 overflow-hidden rounded-2xl border border-slate-200 border-black/5 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:!border-white/10 dark:!bg-ink-900"
          aria-labelledby="recent-posts-heading"
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
            <div>
              <h2
                id="recent-posts-heading"
                className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100"
              >
                Recent posts
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                The five newest locally saved posts.
              </p>
            </div>
            <button
              type="button"
              className="rounded-full px-3 py-2 text-sm font-semibold text-indigo-700 text-signal-600 transition-colors duration-200 hover:bg-signal-50 hover:text-signal-700 active:scale-[0.98] dark:text-indigo-300 dark:!text-signal-400 dark:hover:!bg-ink-800"
              onClick={refresh}
            >
              Refresh
            </button>
          </div>
          {feedback && (
            <p
              className="mx-6 mt-5 text-sm font-medium text-slate-700 dark:text-slate-300"
              role="status"
            >
              {feedback}
            </p>
          )}
          {recentPosts.length === 0 ? (
            <p className="px-6 py-10 text-sm text-slate-600 dark:text-slate-300">
              No posts are available.
            </p>
          ) : (
            <ul
              className="divide-y divide-slate-200 dark:divide-slate-700"
              aria-label="Recent posts"
            >
              {recentPosts.map((post) => (
                <li
                  key={post.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 dark:text-slate-100"
                >
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-950 dark:text-slate-100">
                      {post.title || "Untitled post"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {post.authorName || "Unknown author"} ·{" "}
                      {formatPostDate(post.createdAt) || "Unknown date"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/edit/${post.id}`}
                      className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-100 active:scale-[0.98] dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700 dark:!border-white/10 dark:hover:!bg-ink-800"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="rounded-full border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 transition-colors duration-200 hover:bg-rose-50 active:scale-[0.98] dark:border-rose-500 dark:text-rose-300 dark:hover:bg-rose-950"
                      onClick={() => handleDelete(post.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </AuthenticatedShell>
  );
}

AdminDashboard.propTypes = {};
