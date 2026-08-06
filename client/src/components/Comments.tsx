import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { CommentWithReplies } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { fmtDate } from "../lib/format";

interface CommentsProps {
  writeupId: string;
  onCountChange: (count: number) => void;
}

export const Comments = ({ writeupId, onCountChange }: CommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<CommentWithReplies[]>(
        `/api/writeups/${writeupId}/comments`,
      );
      setComments(res);
      onCountChange(res.length);
    } catch {
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [writeupId, onCountChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent, parent?: string) => {
    e.preventDefault();
    const body = parent
      ? JSON.stringify({ content: parent ? replyContent : content, parent })
      : JSON.stringify({ content });
    try {
      await api(`/api/writeups/${writeupId}/comments`, {
        method: "POST",
        body,
      });
      setContent("");
      setReplyContent("");
      setReplyingTo(null);
      void load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const remove = async (commentId: string) => {
    try {
      await api(`/api/writeups/${writeupId}/comments/${commentId}`, {
        method: "DELETE",
      });
      void load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading comments…</p>;
  if (error && comments.length === 0) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-xl font-semibold">Comments</h2>

      {user ? (
        <form onSubmit={(e) => void submit(e)} className="card mb-6">
          <textarea
            className="input min-h-20"
            placeholder="Share your thoughts…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <div className="mt-2 flex justify-end">
            <button type="submit" className="btn-primary">
              Comment
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-6 text-sm text-slate-500">
          <a href="/login" className="text-emerald-300 hover:underline">
            Log in
          </a>{" "}
          to join the discussion.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-slate-500">No comments yet.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment._id} className="card">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-300">
                  @{comment.author.username}
                </span>
                <span>·</span>
                <span>{fmtDate(comment.createdAt)}</span>
                <div className="ml-auto">
                  {user && comment.author._id === user.id && (
                    <button
                      className="text-red-400 hover:underline"
                      onClick={() => void remove(comment._id)}
                    >
                      delete
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">
                {comment.content}
              </p>
              {user && (
                <button
                  className="mt-2 text-xs text-slate-500 hover:text-emerald-300"
                  onClick={() =>
                    setReplyingTo(replyingTo === comment._id ? null : comment._id)
                  }
                >
                  reply
                </button>
              )}

              {replyingTo === comment._id && (
                <form
                  onSubmit={(e) => void submit(e, comment._id)}
                  className="mt-3"
                >
                  <textarea
                    className="input min-h-16"
                    placeholder={`Reply to @${comment.author.username}…`}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    required
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => setReplyingTo(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Reply
                    </button>
                  </div>
                </form>
              )}

              {comment.replies.length > 0 && (
                <ul className="mt-3 space-y-2 border-l-2 border-slate-800 pl-3">
                  {comment.replies.map((reply) => (
                    <li key={reply._id} className="text-sm">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium text-slate-300">
                          @{reply.author.username}
                        </span>
                        <span>·</span>
                        <span>{fmtDate(reply.createdAt)}</span>
                        <div className="ml-auto">
                          {user && reply.author._id === user.id && (
                            <button
                              className="text-red-400 hover:underline"
                              onClick={() => void remove(reply._id)}
                            >
                              delete
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-slate-200">
                        {reply.content}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
