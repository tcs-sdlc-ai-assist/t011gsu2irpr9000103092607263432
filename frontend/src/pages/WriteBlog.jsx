import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthenticatedShell from "../components/AuthenticatedShell";
import { getSession } from "../utils/auth";
import { getPosts, savePosts } from "../utils/storage";
import { canManagePost, validatePost } from "../utils/blog";

/**
 * Generate a local identifier when the browser UUID helper is unavailable.
 *
 * Returns:
 *   A sufficiently unique local post identifier.
 */
function createPostId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID();
  return `post-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Render the shared create and edit story form.
 *
 * Returns:
 *   The authenticated post editor.
 */
export default function WriteBlog() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const session = getSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState("");
  const [isReady, setIsReady] = useState(!isEditing);

  /**
   * Load an editable post and fail closed when the target is unavailable.
   *
   * Returns:
   *   Nothing.
   */
  useEffect(() => {
    if (!isEditing) return;
    const currentSession = getSession();
    const target = getPosts().find(
      (candidate) => candidate && candidate.id === id,
    );
    if (!target || !canManagePost(currentSession, target)) {
      navigate("/blogs", { replace: true });
      return;
    }
    setTitle(target.title || "");
    setContent(target.content || "");
    setIsReady(true);
  }, [id, isEditing, navigate]);

  /**
   * Save a new or changed post after validating fields and current permissions.
   *
   * Args:
   *   event: The submitted form event.
   * Returns:
   *   Nothing.
   */
  function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");
    const nextErrors = validatePost({ title, content });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const currentSession = getSession();
    if (!currentSession) {
      setFeedback("Your session is no longer available. Please log in again.");
      return;
    }
    const currentPosts = getPosts();

    if (isEditing) {
      const original = currentPosts.find(
        (candidate) => candidate && candidate.id === id,
      );
      if (!original || !canManagePost(currentSession, original)) {
        setFeedback("You are not allowed to edit this story.");
        return;
      }
      const updatedPost = {
        ...original,
        title: title.trim(),
        content: content.trim(),
      };
      if (
        !savePosts(
          currentPosts.map((candidate) =>
            candidate.id === id ? updatedPost : candidate,
          ),
        )
      ) {
        setFeedback("Unable to save your changes. Please try again.");
        return;
      }
      navigate(`/blog/${id}`);
      return;
    }

    const newPost = {
      id: createPostId(),
      title: title.trim(),
      content: content.trim(),
      authorId: currentSession.userId,
      authorName: currentSession.displayName,
      authorRole: currentSession.role,
      createdAt: new Date().toISOString(),
    };
    if (!savePosts([...currentPosts, newPost])) {
      setFeedback("Unable to publish your story. Please try again.");
      return;
    }
    navigate(`/blog/${newPost.id}`);
  }

  /**
   * Delete the edited post only after a fresh authorization and confirmation.
   *
   * Returns:
   *   Nothing.
   */
  function handleDelete() {
    const currentSession = getSession();
    const currentPosts = getPosts();
    const target = currentPosts.find(
      (candidate) => candidate && candidate.id === id,
    );
    if (!target || !canManagePost(currentSession, target)) {
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
      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">
            WriteSpace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {isEditing ? "Edit story" : "Write a story"}
          </h1>
          {!isReady ? (
            <p className="mt-6 text-slate-600" role="status">
              Loading story…
            </p>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  htmlFor="post-title"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Title
                </label>
                <input
                  id="post-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? "title-error" : undefined}
                  className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                {errors.title && (
                  <p
                    id="title-error"
                    className="mt-2 text-sm text-rose-700"
                    role="alert"
                  >
                    {errors.title}
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <label
                    htmlFor="post-content"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    Content
                  </label>
                  <span className="text-xs tabular-nums text-slate-500">
                    {content.length} characters
                  </span>
                </div>
                <textarea
                  id="post-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(errors.content)}
                  aria-describedby={
                    errors.content ? "content-error" : undefined
                  }
                  className="mt-2 block min-h-[256px] w-full rounded-md border border-slate-300 px-3 py-3 leading-6 text-slate-950 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                {errors.content && (
                  <p
                    id="content-error"
                    className="mt-2 text-sm text-rose-700"
                    role="alert"
                  >
                    {errors.content}
                  </p>
                )}
              </div>
              {feedback && (
                <p className="text-sm font-medium text-rose-700" role="alert">
                  {feedback}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-md bg-indigo-700 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
                >
                  {isEditing ? "Save changes" : "Publish story"}
                </button>
                <Link
                  to="/blogs"
                  className="rounded-md px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                >
                  Cancel
                </Link>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="ml-auto rounded-md px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Delete story
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </section>
    </AuthenticatedShell>
  );
}

WriteBlog.propTypes = {};
