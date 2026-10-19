"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { MessageSquare, X, Send, Trash2, Clock, Sparkles } from "lucide-react";

interface CommentItem {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    role: string;
  };
}

interface CommentsDrawerProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (count: number) => void;
}

export function CommentsDrawer({
  documentId,
  isOpen,
  onClose,
  onCommentCountChange,
}: CommentsDrawerProps) {
  const { currentUser, fetchWithUser } = useUser();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    if (!documentId) return;
    setIsLoading(true);
    try {
      const res = await fetchWithUser(`/api/documents/${documentId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        if (onCommentCountChange) {
          onCommentCountChange(data.comments?.length || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, documentId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetchWithUser(`/api/documents/${documentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        setNewComment("");
        fetchComments();
      }
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetchWithUser(
        `/api/documents/${documentId}/comments?commentId=${commentId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        if (onCommentCountChange) {
          onCommentCountChange(Math.max(0, comments.length - 1));
        }
      }
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-84 bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Comments & Discussions</h3>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {comments.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: Comments list */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-slate-700">No comments yet</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Collaborate and leave questions or feedback for teammates.
            </p>
          </div>
        ) : (
          comments.map((c) => {
            const isMine = c.userId === currentUser?.id;
            return (
              <div
                key={c.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={c.user.avatarUrl}
                      alt={c.user.name}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <span className="font-semibold text-slate-800">
                      {c.user.name} {isMine && <span className="text-[10px] text-slate-400">(you)</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-[10px]">
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isMine && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed pl-7">{c.content}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: Add Comment Input */}
      <form onSubmit={handleAddComment} className="p-3 border-t border-slate-100 bg-slate-50/50 flex gap-2">
        <input
          type="text"
          placeholder="Leave a comment or note..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
