"use client";

import React, { useState } from "react";
import { useUser } from "@/context/UserContext";
import {
  X,
  Share2,
  Lock,
  Globe,
  UserPlus,
  Check,
  Copy,
  Trash2,
  AlertCircle,
  Shield,
  Eye,
  Edit3,
} from "lucide-react";

interface CollaboratorInfo {
  id: string;
  document_id: string;
  user_id: string;
  permission: "editor" | "viewer";
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
    role: string;
  };
}

interface ShareModalProps {
  documentId: string;
  documentTitle: string;
  isOwner: boolean;
  owner: {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
  } | null;
  collaborators: CollaboratorInfo[];
  isOpen: boolean;
  onClose: () => void;
  onCollaboratorsUpdated: (collabs: CollaboratorInfo[]) => void;
}

export function ShareModal({
  documentId,
  documentTitle,
  isOwner,
  owner,
  collaborators,
  isOpen,
  onClose,
  onCollaboratorsUpdated,
}: ShareModalProps) {
  const { users, currentUser, fetchWithUser } = useUser();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [permission, setPermission] = useState<"editor" | "viewer">("editor");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Filter out users who are already collaborators or the owner
  const availableUsers = users.filter(
    (u) =>
      u.id !== owner?.id &&
      !collaborators.some((c) => c.user_id === u.id)
  );

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload: { userId?: string; email?: string; permission: string } = {
        permission,
      };

      if (selectedUserId) {
        payload.userId = selectedUserId;
      } else if (customEmail.trim()) {
        payload.email = customEmail.trim();
      } else {
        setError("Please select a team member or enter an email address.");
        setIsLoading(false);
        return;
      }

      const res = await fetchWithUser(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to grant access");
      }

      onCollaboratorsUpdated(data.collaborators || []);
      setSelectedUserId("");
      setCustomEmail("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePermission = async (userId: string, newPermission: "editor" | "viewer") => {
    try {
      const res = await fetchWithUser(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, permission: newPermission }),
      });
      const data = await res.json();
      if (res.ok) {
        onCollaboratorsUpdated(data.collaborators || []);
      }
    } catch (err) {
      console.error("Failed to update permission", err);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    try {
      const res = await fetchWithUser(`/api/documents/${documentId}/share?userId=${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        onCollaboratorsUpdated(data.collaborators || []);
      }
    } catch (err) {
      console.error("Failed to remove collaborator", err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 leading-tight">
                Share &ldquo;{documentTitle}&rdquo;
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage document permissions and team access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {!isOwner ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Viewing permissions only.</span> You are a collaborator on this document. Only the owner (<strong>{owner?.name}</strong>) can invite new members or change roles.
              </div>
            </div>
          ) : (
            /* Invite form */
            <form onSubmit={handleAddCollaborator} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Add teammates or collaborators
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  {availableUsers.length > 0 ? (
                    <select
                      value={selectedUserId}
                      onChange={(e) => {
                        setSelectedUserId(e.target.value);
                        setCustomEmail("");
                      }}
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                    >
                      <option value="">Select team member...</option>
                      {availableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role}) — {u.email}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="email"
                      placeholder="Enter collaborator email..."
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                    />
                  )}
                </div>

                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as "editor" | "viewer")}
                  className="text-xs px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium"
                >
                  <option value="editor">Editor (Can edit)</option>
                  <option value="viewer">Viewer (Can view)</option>
                </select>

                <button
                  type="submit"
                  disabled={isLoading || (!selectedUserId && !customEmail.trim())}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>

              {error && (
                <div className="text-xs text-rose-600 flex items-center gap-1.5 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </div>
              )}
            </form>
          )}

          {/* Collaborator List */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              People with access
            </div>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
              {/* Document Owner */}
              {owner && (
                <div className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={owner.avatar_url}
                      alt={owner.name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        {owner.name}
                        {owner.id === currentUser?.id && (
                          <span className="text-[10px] text-slate-400 font-normal">(you)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{owner.email}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                    Owner
                  </span>
                </div>
              )}

              {/* Collaborators */}
              {collaborators.map((c) => {
                const isTargetCurrentUser = c.user_id === currentUser?.id;
                return (
                  <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={c.user.avatar_url}
                        alt={c.user.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          {c.user.name}
                          {isTargetCurrentUser && (
                            <span className="text-[10px] text-slate-400 font-normal">(you)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{c.user.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={c.permission}
                            onChange={(e) =>
                              handleUpdatePermission(
                                c.user_id,
                                e.target.value as "editor" | "viewer"
                              )
                            }
                            className="text-xs px-2 py-1 border border-slate-200 rounded-md bg-white text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button
                            onClick={() => handleRemoveCollaborator(c.user_id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                            title="Remove access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 capitalize bg-slate-100 px-2 py-1 rounded-md">
                          {c.permission}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {collaborators.length === 0 && (
                <div className="py-4 text-center text-xs text-slate-400">
                  No additional collaborators yet. Share with team members above!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Link copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy link</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
