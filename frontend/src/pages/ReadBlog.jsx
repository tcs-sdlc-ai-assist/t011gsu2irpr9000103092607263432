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
  const galleryImages = Array.isArray(post?.gallery)
    ? post.gallery.filter((item) => typeof item === "string" && item)
    : [];

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
      <section className="mx-auto max-w-4xl px-5 py-16 text-ink-950 dark:bg-slate-900 dark:text-slate-100 dark:!bg-ink-950 sm:px-8 sm:py-20">
        {!hasLoaded ? (
          <p className="text-slate-600 dark:text-slate-300" role="status">
            Loading story…
          </p>
        ) : !post ? (
          <div className="rounded-2xl border border-slate-200 border-black/5 bg-white p-8 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:!border-white/10 dark:!bg-ink-900">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              Post not found
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              This story may have been deleted or the link is incorrect.
            </p>
            <Link
              to="/blogs"
              className="mt-6 inline-flex rounded-full text-sm font-semibold text-indigo-700 text-signal-600 transition-colors duration-200 hover:text-signal-700 dark:text-indigo-300 dark:!text-signal-500"
            >
              Back to stories
            </Link>
          </div>
        ) : (
          <article className="overflow-hidden rounded-2xl border border-slate-200 border-black/5 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:!border-white/10 dark:!bg-ink-900">
            {typeof post.coverImage === "string" && post.coverImage && (
              <img
                src={post.coverImage}
                alt={`${post.title || "Story"} cover`}
                loading="lazy"
                className="aspect-video w-full object-cover"
              />
            )}
            <div className="p-6 sm:p-10">
              <div className="mx-auto max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700 text-signal-600 dark:text-indigo-300 dark:!text-signal-500">
                  Story
                </p>
                <h1 className="mt-3 text-[2.125rem] font-semibold leading-[1.12] tracking-tight text-slate-950 text-ink-950 dark:text-slate-100 sm:text-5xl">
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
                {galleryImages.length > 0 && (
                  <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
                    {galleryImages.map((src, index) => (
                      <a
                        key={`${src}-${index}`}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={src}
                          alt={`Gallery image ${index + 1}`}
                          loading="lazy"
                          className="h-40 w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                        />
                      </a>
                    ))}
                  </div>
                )}
                {canManagePost(session, post) && (
                  <div className="mt-10 flex flex-wrap gap-3 border-t border-slate-100 pt-6 dark:border-slate-700">
                    <Link
                      to={`/edit/${post.id}`}
                      className="rounded-full bg-indigo-700 bg-signal-600 !bg-signal-500 px-4 py-2 text-sm font-semibold text-white transition-transform duration-200 hover:!bg-signal-600 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-signal-600 focus:ring-offset-2 dark:focus:ring-offset-ink-900"
                    >
                      Edit story
                    </Link>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors duration-200 hover:bg-rose-50 active:scale-[0.98] dark:border-rose-500 dark:text-rose-300 dark:hover:bg-rose-950"
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
              </div>
            </div>
          </article>
        )}
      </section>
    </AuthenticatedShell>
  );
}

ReadBlog.propTypes = {};
