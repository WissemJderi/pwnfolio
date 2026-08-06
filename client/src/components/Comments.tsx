import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CornerDownRight, Trash2 } from "lucide-react";
import { api } from "../api/client";
import type { CommentWithReplies } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { fmtDate } from "../lib/format";
import { Skeleton } from "./Skeleton";

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

  if (loading) {
    return (
      <section className="mt-12 border-t border-line-800 pt-8">
        <Skeleton className="h-5 w-32" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  if (error && comments.length === 0) {
    return <p className="mt-8 font-mono text-sm text-blood-400">{error}</p>;
  }

  return (
    <section className="mt-12 border-t border-line-800 pt-8">
      <h2 className="mb-1 flex items-center gap-2 font-mono text-lg font-semibold">
        <span className="text-neon-500">##</span> discussion
        <span className="text-xs font-normal text-ink-500">
          ({comments.length})
        </span>
      </h2>
      <p className="muted mb-6">// as in a war room, only the facts matter</p>

      {user ? (
        <form
          onSubmit={(e) => void submit(e)}
          className="panel mb-8 p-3"
        >
          <div className="mb-2 flex items-center gap-2 border-b border-line-800 pb-2 font-mono text-[11px] text-ink-500">
            <span className="text-neon-400">❯</span>
            <span>
              comment as{" "}
              <span className="text-ink-300">@{user.username}</span>
            </span>
          </div>
          <textarea
            className="input min-h-20"
            placeholder="Share your thoughts…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <div className="mt-2 flex justify-end">
            <button type="submit" className="btn btn-primary text-xs">
              post comment
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-8 font-mono text-sm text-ink-500">
          <Link to="/login" className="text-neon-400 hover:underline">
            [ login ]
          </Link>{" "}
          to join the discussion.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="font-mono text-sm text-ink-500">
          // no comments yet — be the first to drop intel
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment._id} className="table-list overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line-800 bg-core-800/40 px-4 py-2 font-mono text-xs text-ink-500">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-line-700 bg-core-700/60 text-[10px] text-neon-400">
                  {comment.author.username.slice(0, 1).toUpperCase()}
                </span>
                <span className="font-medium text-ink-300">
                  @{comment.author.username}
                </span>
                <span>·</span>
                <span>{fmtDate(comment.createdAt)}</span>
                <span className="text-ink-500/50">· comment #{comment._id.slice(-4)}</span>
                <div className="ml-auto">
                  {user && comment.author._id === user.id && (
                    <button
                      className="flex items-center gap-1 text-blood-400 hover:underline"
                      onClick={() => void remove(comment._id)}
                    >
                      <Trash2 size={12} /> delete
                    </button>
                  )}
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-200">
                  {comment.content}
                </p>
                {user && (
                  <button
                    className="mt-2 flex items-center gap-1 font-mono text-xs text-ink-500 hover:text-neon-400"
                    onClick={() =>
                      setReplyingTo(replyingTo === comment._id ? null : comment._id)
                    }
                  >
                    <CornerDownRight size={12} /> reply
                  </button>
                )}

                {replyingTo === comment._id && (
                  <form
                    onSubmit={(e) => void submit(e, comment._id)}
                    className="mt-3 border-t border-line-800 pt-3"
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
                        className="btn btn-outline text-xs"
                        onClick={() => setReplyingTo(null)}
                      >
                        cancel
                      </button>
                      <button type="submit" className="btn btn-primary text-xs">
                        reply
                      </button>
                    </div>
                  </form>
                )}

                {comment.replies.length > 0 && (
                  <ul className="mt-3 space-y-3 border-l-2 border-neon-500/25 pl-4">
                    {comment.replies.map((reply) => (
                      <li key={reply._id} className="border-b border-line-800/60 pb-3 last:border-0">
                        <div className="flex items-center gap-2 font-mono text-xs text-ink-500">
                          <CornerDownRight size={12} className="text-neon-500" />
                          <span className="flex h-5 w-5 items-center justify-center rounded border border-line-700 bg-core-700/60 text-[10px] text-neon-400">
                            {reply.author.username.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="font-medium text-ink-300">
                            @{reply.author.username}
                          </span>
                          <span>·</span>
                          <span>{fmtDate(reply.createdAt)}</span>
                          <div className="ml-auto">
                            {user && reply.author._id === user.id && (
                              <button
                                className="flex items-center gap-1 text-blood-400 hover:underline"
                                onClick={() => void remove(reply._id)}
                              >
                                <Trash2 size={12} /> delete
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap pl-5 text-sm text-ink-200">
                          {reply.content}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};