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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select";

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
  const [isEmailMode, setIsEmailMode] = useState(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
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
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Add teammates or collaborators
                </label>
                {availableUsers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmailMode(!isEmailMode);
                      setSelectedUserId("");
                      setCustomEmail("");
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    {isEmailMode ? "Choose from team list" : "Enter email instead"}
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  {isEmailMode || availableUsers.length === 0 ? (
                    <input
                      type="email"
                      placeholder="Enter collaborator email..."
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full h-9 text-xs px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 bg-white"
                    />
                  ) : (
                    <Select
                      value={selectedUserId}
                      onValueChange={(val) => {
                        setSelectedUserId(val);
                        setCustomEmail("");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select team member to invite..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Team Members</SelectLabel>
                          {availableUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-4 h-4 flex-shrink-0">
                                  <AvatarImage src={u.avatar_url} />
                                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-slate-800">{u.name}</span>
                                <span className="text-[11px] text-slate-400">({u.role})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Select
                  value={permission}
                  onValueChange={(val: "editor" | "viewer") => setPermission(val)}
                >
                  <SelectTrigger className="w-28 flex-shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="editor">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Editor</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Eye className="w-3.5 h-3.5 text-amber-600" />
                        <span>Viewer</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="submit"
                  disabled={isLoading || (!selectedUserId && !customEmail.trim())}
                  size="default"
                  className="h-9"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Share</span>
                </Button>
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
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={owner.avatar_url} alt={owner.name} />
                      <AvatarFallback>{owner.name[0]}</AvatarFallback>
                    </Avatar>
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
                  <Badge variant="secondary">Owner</Badge>
                </div>
              )}

              {/* Collaborators */}
              {collaborators.map((c) => {
                const isTargetCurrentUser = c.user_id === currentUser?.id;
                return (
                  <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={c.user.avatar_url} alt={c.user.name} />
                        <AvatarFallback>{c.user.name[0]}</AvatarFallback>
                      </Avatar>
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
                          <Select
                            value={c.permission}
                            onValueChange={(val: "editor" | "viewer") =>
                              handleUpdatePermission(c.user_id, val)
                            }
                          >
                            <SelectTrigger className="h-8 w-28 text-xs bg-slate-50 hover:bg-slate-100 border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                              <SelectItem value="editor">
                                <div className="flex items-center gap-1.5 font-medium">
                                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Editor</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="viewer">
                                <div className="flex items-center gap-1.5 font-medium">
                                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Viewer</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <button
                            onClick={() => handleRemoveCollaborator(c.user_id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <Badge variant={c.permission === "editor" ? "success" : "secondary"} className="capitalize">
                          {c.permission}
                        </Badge>
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
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
          </Button>

          <Button type="button" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
