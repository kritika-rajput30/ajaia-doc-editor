"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { UserSwitcher } from "@/components/UserSwitcher";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ShareModal } from "@/components/ShareModal";
import { VersionHistoryModal } from "@/components/VersionHistoryModal";
import { AttachmentsDrawer } from "@/components/AttachmentsDrawer";
import {
  ArrowLeft,
  Cloud,
  CloudCheck,
  Share2,
  Paperclip,
  History,
  Download,
  Printer,
  ChevronDown,
  Lock,
  Eye,
  Edit3,
  Shield,
  AlertCircle,
  FileText,
} from "lucide-react";

function DocumentEditorContent() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  const { currentUser, fetchWithUser } = useUser();

  const [documentData, setDocumentData] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [plainText, setPlainText] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error" | "readonly">("saved");
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modals & Drawers
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Load document
  const loadDoc = useCallback(async () => {
    if (!currentUser || !documentId) return;
    setIsLoading(true);
    setLoadError(null);

    try {
      const res = await fetchWithUser(`/api/documents/${documentId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load document");
      }

      setDocumentData(data);
      setTitle(data.document.title);
      setContent(data.document.content);
      setPlainText(data.document.plain_text);
      setSaveStatus(data.canEdit ? "saved" : "readonly");
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, documentId]);

  useEffect(() => {
    loadDoc();
  }, [loadDoc]);

  // Click outside listener for export dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced auto-save function
  const saveDocumentChanges = async (
    newTitle?: string,
    newContent?: string,
    snapshotVersion = false
  ) => {
    if (!documentData?.canEdit) return;

    setSaveStatus("saving");
    try {
      const payload: any = {
        saveVersion: snapshotVersion,
      };
      if (newTitle !== undefined) payload.title = newTitle;
      if (newContent !== undefined) payload.content = newContent;

      const res = await fetchWithUser(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save changes");
      }

      setSaveStatus("saved");
      setLastSaved(new Date());
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("error");
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDocumentChanges(newTitle, undefined, false);
    }, 800);
  };

  const handleContentChange = (newHtml: string, newText: string) => {
    setContent(newHtml);
    setPlainText(newText);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus("saving");
    saveTimerRef.current = setTimeout(() => {
      saveDocumentChanges(undefined, newHtml, false);
    }, 1200);
  };

  const handleRestoreVersion = (restoredContent: string, restoredTitle: string) => {
    setContent(restoredContent);
    setTitle(restoredTitle);
    saveDocumentChanges(restoredTitle, restoredContent, true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-xs text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Opening document...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Document Access Denied</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{loadError}</p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
            <div className="text-[11px] text-slate-400">
              Try switching users using the top-right switcher if this document is owned by another teammate.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = documentData?.isOwner || false;
  const canEdit = documentData?.canEdit || false;
  const permission = documentData?.permission || "viewer";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Google Docs Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between no-print shadow-2xs">
        {/* Left: Back Arrow + Document Title + Auto-Save Status */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/")}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Back to Documents"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
            <FileText className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                disabled={!canEdit}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled Document"
                className="font-semibold text-slate-900 text-sm hover:border-slate-300 focus:border-blue-500 border border-transparent rounded px-1.5 py-0.5 bg-transparent focus:bg-white focus:outline-none transition-all truncate max-w-xs sm:max-w-md"
              />

              {/* Permission Badge */}
              {isOwner ? (
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md flex items-center gap-1 flex-shrink-0">
                  <Shield className="w-3 h-3" />
                  Owner
                </span>
              ) : (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 flex-shrink-0 ${
                    canEdit
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700 border border-amber-200/60"
                  }`}
                >
                  {canEdit ? (
                    <>
                      <Edit3 className="w-3 h-3" />
                      Editor
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      Viewer
                    </>
                  )}
                </span>
              )}
            </div>

            {/* Cloud Auto-Save Status Indicator */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pl-1.5">
              {!canEdit ? (
                <span className="flex items-center gap-1 text-amber-600">
                  <Lock className="w-3 h-3" />
                  <span>Viewing mode (Read only)</span>
                </span>
              ) : saveStatus === "saving" ? (
                <span className="flex items-center gap-1 text-blue-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  <span>Saving to cloud...</span>
                </span>
              ) : saveStatus === "saved" ? (
                <span className="flex items-center gap-1 text-slate-500">
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  <span>All changes saved to cloud</span>
                </span>
              ) : (
                <span className="text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Error saving changes</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Version History Button */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors flex items-center gap-1.5"
            title="Version History"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Attachments Drawer Button */}
          <button
            onClick={() => setIsAttachmentsOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors flex items-center gap-1.5 relative"
            title="Document Attachments"
          >
            <Paperclip className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Files</span>
            {documentData?.attachments?.length > 0 && (
              <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-full">
                {documentData.attachments.length}
              </span>
            )}
          </button>

          {/* Export Menu Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white shadow-xl border border-slate-200 z-50 py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                <a
                  href={`/api/documents/${documentId}/export?format=md`}
                  download
                  className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50"
                  onClick={() => setIsExportMenuOpen(false)}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Markdown (.md)</span>
                </a>
                <a
                  href={`/api/documents/${documentId}/export?format=txt`}
                  download
                  className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50"
                  onClick={() => setIsExportMenuOpen(false)}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Plain Text (.txt)</span>
                </a>
                <a
                  href={`/api/documents/${documentId}/export?format=html`}
                  download
                  className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50"
                  onClick={() => setIsExportMenuOpen(false)}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Web Page (.html)</span>
                </a>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    window.print();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print to PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Share Button (Google Docs Pill) */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
            {documentData?.collaborators?.length > 0 && (
              <span className="text-[10px] bg-blue-800 text-blue-100 px-1.5 py-0.2 rounded-full">
                {documentData.collaborators.length}
              </span>
            )}
          </button>

          <div className="h-5 w-px bg-slate-200" />

          {/* User Switcher Dropdown */}
          <UserSwitcher />
        </div>
      </header>

      {/* Main Rich Text Editor Canvas */}
      <RichTextEditor
        initialContent={content}
        onContentChange={handleContentChange}
        readOnly={!canEdit}
        ownerName={documentData?.owner?.name}
      />

      {/* Share Modal */}
      <ShareModal
        documentId={documentId}
        documentTitle={title}
        isOwner={isOwner}
        owner={documentData?.owner || null}
        collaborators={documentData?.collaborators || []}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onCollaboratorsUpdated={(updatedCollabs) => {
          setDocumentData((prev: any) => ({
            ...prev,
            collaborators: updatedCollabs,
          }));
        }}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        versions={documentData?.versions || []}
        currentVersionContent={content}
        canEdit={canEdit}
        onRestoreVersion={handleRestoreVersion}
      />

      {/* Attachments Drawer */}
      <AttachmentsDrawer
        documentId={documentId}
        isOpen={isAttachmentsOpen}
        onClose={() => setIsAttachmentsOpen(false)}
        attachments={documentData?.attachments || []}
        canEdit={canEdit}
        onAttachmentsUpdated={(updatedAtts) => {
          setDocumentData((prev: any) => ({
            ...prev,
            attachments: updatedAtts,
          }));
        }}
      />
    </div>
  );
}

export default function DocumentEditorPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center text-xs text-slate-500">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading editor...</span>
          </div>
        </div>
      }
    >
      <DocumentEditorContent />
    </React.Suspense>
  );
}
