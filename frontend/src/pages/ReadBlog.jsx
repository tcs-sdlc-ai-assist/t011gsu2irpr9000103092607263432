import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthenticatedShell from "../components/AuthenticatedShell";
import Avatar from "../components/Avatar";
import { getSession } from "../utils/auth";
import { getPosts, savePosts } from "../utils/storage";
import { canManagePost, formatPostDate } from "../utils/blog";

/**
 * Render one persisted story and its owner-only management controls.
 *
 * Returns:
 *   The local story reader.
 */
export default function ReadBlog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = getSession();
  const [post, setPost] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [feedback, setFeedback] = useState("");

  /**
   * Load the requested local post whenever its route id changes.
   *
   * Returns:
   *   Nothing.
   */
  useEffect(() => {
    const delay = Number(globalThis.__WRITESPACE_LOAD_DELAY__ || 0);
    const loadPost = () => {
      try {
        setPost(
          getPosts().find((candidate) => candidate && candidate.id === id) ||
            null,
        );
      } catch (error) {
        setPost(null);
      } finally {
        setHasLoaded(true);
      }
    };

    if (delay > 0) {
      const timeoutId = window.setTimeout(loadPost, delay);
      return () => window.clearTimeout(timeoutId);
    }

    loadPost();
    return undefined;
  }, [id]);

  /**
   * Delete the post only after confirmation and a fresh authorization check.
   *
   * Returns:
   *   Nothing.
   */
  function handleDelete() {
    const currentSession = getSession();
    const currentPosts = getPosts();
    const currentPost = currentPosts.find(
      (candidate) => candidate && candidate.id === id,
    );
    if (!currentPost || !canManagePost(currentSession, currentPost)) {
      setFeedback("You are not allowed to delete this story.");
      return;
    }
    if (!window.confirm("Delete this story? This cannot be undone.")) return;

    if (!savePosts(currentPosts.filter((candidate) => candidate.id !== id))) {
      setFeedback("Unable to delete this story. Please try again.");
      return;
    }
    navigate("/blogs");
  }

  if (!session) return null;

  return (
    <AuthenticatedShell session={session}>
      <section className="mx-auto max-w-3xl px-5 py-12 dark:bg-slate-900 dark:text-slate-100 sm:px-8">
        {!hasLoaded ? (
          <p className="text-slate-600 dark:text-slate-300" role="status">
            Loading story…
          </p>
        ) : !post ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              Post not found
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              This story may have been deleted or the link is incorrect.
            </p>
            <Link
              to="/blogs"
              className="mt-6 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              Back to stories
            </Link>
          </div>
        ) : (
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
              Story
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
              {post.title}
            </h1>
            <div className="mt-6 flex items-center gap-3 border-y border-slate-100 py-4 dark:border-slate-700">
              <Avatar
                displayName={post.authorName || "Unknown author"}
                role={post.authorRole || "user"}
              />
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {post.authorName || "Unknown author"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formatPostDate(post.createdAt)}
                </p>
              </div>
            </div>
            <div className="mt-8 whitespace-pre-wrap leading-8 text-slate-700 dark:text-slate-300">
              {post.content}
            </div>
            {canManagePost(session, post) && (
              <div className="mt-10 flex flex-wrap gap-3 border-t border-slate-100 pt-6 dark:border-slate-700">
                <Link
                  to={`/edit/${post.id}`}
                  className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
                >
                  Edit story
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-md border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-500 dark:text-rose-300 dark:hover:bg-rose-950"
                >
                  Delete story
                </button>
              </div>
            )}
            {feedback && (
              <p
                className="mt-5 text-sm font-medium text-rose-700 dark:text-rose-300"
                role="alert"
              >
                {feedback}
              </p>
            )}
          </article>
        )}
      </section>
    </AuthenticatedShell>
  );
}

ReadBlog.propTypes = {};
