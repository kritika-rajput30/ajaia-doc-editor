"use client";

import React, { useState, useRef } from "react";
import { useUser } from "@/context/UserContext";
import {
  Paperclip,
  X,
  Upload,
  File,
  FileText,
  Image,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface AttachmentItem {
  id: string;
  document_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface AttachmentsDrawerProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  attachments: AttachmentItem[];
  canEdit: boolean;
  onAttachmentsUpdated: (attachments: AttachmentItem[]) => void;
}

export function AttachmentsDrawer({
  documentId,
  isOpen,
  onClose,
  attachments,
  canEdit,
  onAttachmentsUpdated,
}: AttachmentsDrawerProps) {
  const { fetchWithUser } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetchWithUser(`/api/documents/${documentId}/attachments`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload attachment");
      }

      onAttachmentsUpdated([data.attachment, ...attachments]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (mimeType?: string) => {
    const type = (mimeType || "").toLowerCase();
    if (type.startsWith("image/")) return <Image className="w-4 h-4 text-emerald-500" />;
    if (type.includes("pdf") || type.includes("text"))
      return <FileText className="w-4 h-4 text-blue-500" />;
    return <File className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Attachments</h3>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {attachments.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {canEdit && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/30 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? "Uploading..." : "Attach file to doc"}</span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Document Files
          </div>

          {attachments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No files attached to this document yet.
            </div>
          ) : (
            attachments.map((att) => {
              const fileType = att.file_type || (att as any).fileType || "";
              const fileSize = Number(att.file_size || (att as any).fileSize || 0);
              const createdAt = att.created_at || (att as any).createdAt || new Date().toISOString();

              return (
                <div
                  key={att.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="p-2 bg-white rounded-lg shadow-2xs">
                      {getFileIcon(fileType)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate">
                        {att.filename}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {(fileSize / 1024).toFixed(1)} KB •{" "}
                        {new Date(createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <a
                    href={`/api/documents/${documentId}/export?format=txt`}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-white transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
