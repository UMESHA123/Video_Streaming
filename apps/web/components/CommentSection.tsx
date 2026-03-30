"use client";

import { useState, useEffect, FormEvent } from "react";
import { Trash2, Send, MessageSquare, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Comment {
  id: string;
  _id?: string;
  text: string;
  content?: string;
  user: {
    id?: string;
    _id?: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
}

interface CommentSectionProps {
  videoId: string;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins}m ago`;
  }
  if (seconds < 86400) {
    const hrs = Math.floor(seconds / 3600);
    return `${hrs}h ago`;
  }
  if (seconds < 2592000) {
    const days = Math.floor(seconds / 86400);
    return `${days}d ago`;
  }
  if (seconds < 31536000) {
    const months = Math.floor(seconds / 2592000);
    return `${months}mo ago`;
  }
  const years = Math.floor(seconds / 31536000);
  return `${years}y ago`;
}

export default function CommentSection({ videoId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/comments/${videoId}`);
      setComments(response.data.comments || response.data || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/comments/${videoId}`, {
        text: newComment.trim(),
      });
      const addedComment = response.data.comment || response.data;
      setComments((prev) => [addedComment, ...prev]);
      setNewComment("");
    } catch {
      // Error handled by API interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await api.delete(`/comments/${videoId}/${commentId}`);
      setComments((prev) =>
        prev.filter((c) => (c.id || c._id) !== commentId)
      );
    } catch {
      // Error handled by API interceptor
    }
  };

  const isOwnComment = (comment: Comment) => {
    if (!user) return false;
    const commentUserId = comment.user?.id || comment.user?._id;
    return commentUserId === user.id;
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5" />
        {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
      </h3>

      {/* Add Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <div className="shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-sm font-medium text-white">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-transparent border-b border-surface-border px-1 py-2 text-sm text-white placeholder-gray-500 focus:border-white focus:outline-none transition-colors"
              disabled={submitting}
            />
            <div className="flex justify-end gap-2 mt-2">
              {newComment.trim() && (
                <button
                  type="button"
                  onClick={() => setNewComment("")}
                  className="btn-ghost text-sm px-3 py-1.5 rounded-full"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="btn-primary text-sm px-4 py-1.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Comment
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="card-dark p-4 mb-6 text-center">
          <p className="text-sm text-gray-400">
            <a href="/auth/login" className="text-red-400 hover:text-red-300">
              Log in
            </a>{" "}
            to leave a comment
          </p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            No comments yet. Be the first to comment!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const commentId = comment.id || comment._id || "";
            return (
              <div key={commentId} className="flex gap-3 group">
                <div className="shrink-0">
                  {comment.user?.avatar ? (
                    <img
                      src={comment.user.avatar}
                      alt={comment.user.username}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center text-sm font-medium text-gray-400">
                      {comment.user?.username?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-300">
                      {comment.user?.username || "Unknown"}
                    </span>
                    <span className="text-xs text-gray-600">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-0.5 break-words">
                    {comment.text || comment.content}
                  </p>
                </div>
                {isOwnComment(comment) && (
                  <button
                    onClick={() => handleDelete(commentId)}
                    className="shrink-0 p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete comment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
