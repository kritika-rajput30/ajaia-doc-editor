"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { UserSwitcher } from "@/components/UserSwitcher";
import { FileUploadModal } from "@/components/FileUploadModal";
import {
  FileText,
  Plus,
  Upload,
  Search,
  Users,
  Clock,
  MoreVertical,
  Trash2,
  Share2,
  ExternalLink,
  Shield,
  FileCheck,
  FolderOpen,
  Sparkles,
} from "lucide-react";

interface DocSummary {
  id: string;
  title: string;
  plainText: string;
  preview: string;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
  };
  permission: "owner" | "editor" | "viewer";
  isOwner: boolean;
  collaboratorCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, fetchWithUser, isLoading: userLoading } = useUser();
  const [documents, setDocuments] = useState<DocSummary[]>([]);
  const [counts, setCounts] = useState({ all: 0, owned: 0, shared: 0 });
  const [activeFilter, setActiveFilter] = useState<"all" | "owned" | "shared">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);

  const fetchDocs = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const url = `/api/documents?filter=${activeFilter}&q=${encodeURIComponent(
        searchQuery
      )}`;
      const res = await fetchWithUser(url);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDocs();
    }
  }, [currentUser, activeFilter, searchQuery]);

  const handleCreateNewDoc = async (templateTitle?: string, templateContent?: string) => {
    try {
      const res = await fetchWithUser("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: templateTitle || "Untitled Document",
          content: templateContent || "<p></p>",
        }),
      });

      const data = await res.json();
      if (res.ok && data.document) {
        router.push(`/document/${data.document.id}`);
      }
    } catch (err) {
      console.error("Failed to create document", err);
    }
  };

  const handleDeleteDoc = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const res = await fetchWithUser(`/api/documents/${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        setCounts((prev) => ({
          ...prev,
          all: Math.max(0, prev.all - 1),
          owned: Math.max(0, prev.owned - 1),
        }));
      }
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-base leading-tight">
                Ajaia Docs
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                Workspace
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-none mt-0.5">
              Collaborative Document Editor
            </p>
          </div>
        </div>

        {/* Global Search */}
        <div className="hidden md:flex items-center relative w-96 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search documents by title or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-100 hover:bg-slate-200/70 focus:bg-white border border-transparent focus:border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right Actions & User Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Import File (.md / .txt)</span>
            <span className="sm:hidden">Import</span>
          </button>

          <button
            onClick={() => handleCreateNewDoc()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Document</span>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          {/* User Switcher Dropdown */}
          <UserSwitcher />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Quick Templates Shelf */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Start a new document</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Blank */}
            <button
              onClick={() => handleCreateNewDoc("Untitled Document")}
              className="p-4 bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-all group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div className="font-semibold text-slate-800 text-xs">Blank document</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Start with a clean page</div>
            </button>

            {/* Product RFC Template */}
            <button
              onClick={() =>
                handleCreateNewDoc(
                  "Product Engineering RFC",
                  `<h1>Product Engineering RFC: Title</h1><p><strong>Author:</strong> ${
                    currentUser?.name || "Kritika Rajput"
                  }</p><p><strong>Status:</strong> Draft</p><h2>1. Problem Statement</h2><p>Describe the user problem this RFC addresses.</p><h2>2. Proposed Solution</h2><ul><li>Component A</li><li>Component B</li></ul>`
                )
              }
              className="p-4 bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-all group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="font-semibold text-slate-800 text-xs">Product RFC</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Specs and technical proposal</div>
            </button>

            {/* Team Meeting Notes */}
            <button
              onClick={() =>
                handleCreateNewDoc(
                  "Weekly Team Sync Notes",
                  `<h1>Weekly Team Sync</h1><p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p><h2>Attendees</h2><ul><li>${
                    currentUser?.name || "Kritika"
                  }</li></ul><h2>Action Items</h2><ol><li>Complete document editor features</li><li>Record walkthrough video</li></ol>`
                )
              }
              className="p-4 bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-all group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <div className="font-semibold text-slate-800 text-xs">Meeting Notes</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Agendas and action items</div>
            </button>

            {/* Import Markdown / Text */}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="p-4 bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-all group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div className="font-semibold text-slate-800 text-xs">Import File</div>
              <div className="text-[11px] text-slate-400 mt-0.5">From .md, .txt, or .json</div>
            </button>
          </div>
        </section>

        {/* Documents Shelf */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeFilter === "all"
                    ? "bg-white text-slate-800 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Documents ({counts.all})
              </button>
              <button
                onClick={() => setActiveFilter("owned")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeFilter === "owned"
                    ? "bg-white text-slate-800 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Owned by me ({counts.owned})
              </button>
              <button
                onClick={() => setActiveFilter("shared")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeFilter === "shared"
                    ? "bg-white text-slate-800 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Shared with me ({counts.shared})
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Active account:{" "}
              <strong className="text-slate-700">{currentUser?.name}</strong>
            </div>
          </div>

          {/* Document Grid */}
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400">
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 p-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">No documents found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No matches for "${searchQuery}". Try a different keyword.`
                  : activeFilter === "shared"
                  ? "No documents have been shared with this account yet. Switch users using the top-right switcher to see documents shared across team members."
                  : "Create your first document or import a file using the buttons above."}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => handleCreateNewDoc()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  Create Document
                </button>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                  Import File
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => {
                return (
                  <div
                    key={doc.id}
                    onClick={() => router.push(`/document/${doc.id}`)}
                    className="bg-white rounded-xl border border-slate-200 hover:border-blue-400/80 hover:shadow-md transition-all cursor-pointer p-4 flex flex-col justify-between group relative"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5">
                          {doc.isOwner ? (
                            <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Owner
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                doc.permission === "editor"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <Users className="w-3 h-3" />
                              {doc.permission === "editor" ? "Can edit" : "Can view"}
                            </span>
                          )}

                          {doc.collaboratorCount > 0 && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {doc.collaboratorCount} {doc.collaboratorCount === 1 ? "collaborator" : "collaborators"}
                            </span>
                          )}
                        </div>

                        {doc.isOwner && (
                          <button
                            onClick={(e) => handleDeleteDoc(doc.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                        {doc.title}
                      </h3>

                      {/* Text Snippet Preview */}
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {doc.preview}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <img
                          src={doc.owner.avatarUrl}
                          alt={doc.owner.name}
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                          title={`Owner: ${doc.owner.name}`}
                        />
                        <span className="truncate max-w-[120px]">
                          {doc.isOwner ? "You" : doc.owner.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => fetchDocs()}
      />
    </div>
  );
}
