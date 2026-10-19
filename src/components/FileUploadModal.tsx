"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
  Upload,
  FileText,
  X,
  FileCode,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (doc: any) => void;
}

export function FileUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: FileUploadModalProps) {
  const router = useRouter();
  const { fetchWithUser } = useUser();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    const valid = ["txt", "md", "markdown", "json"].includes(ext || "");

    if (!valid) {
      setError(
        `Unsupported file type .${ext || "unknown"}. Supported file formats are: .txt, .md, .markdown, .json`
      );
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetchWithUser("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "File upload failed");
      }

      if (onUploadSuccess) {
        onUploadSuccess(data.document);
      }
      onClose();
      router.push(`/document/${data.document.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleDocument = async () => {
    setIsLoading(true);
    setError(null);

    const sampleMarkdown = `# AI-Native Engineering RFC: Real-Time Collaborative Canvas

## Executive Summary
This RFC proposes the design and phased rollout of an **AI-native collaborative document editor** for Ajaia's distributed product teams. 

## Architectural Foundations
Our platform standardizes on an event-driven architecture with:
- **ProseMirror Schema Engine**: High-fidelity DOM synchronization with granular mark representations.
- **Relational SQLite Durability**: ACID transactions with WAL-enabled concurrent read streams.
- **Role-Based Access Control**: Strict boundaries separating Owners, Editors, and Viewers.

## Key Feature Requirements
1. Rich-text formatting (Headings, bold, italics, underline, lists).
2. Live presence and collaborative avatars.
3. Multi-format ingestion (.md, .txt, .json).
4. Snapshot version history and point-in-time recovery.

> *"Simplicity is a prerequisite for reliability."* — Edsger W. Dijkstra
`;

    try {
      const res = await fetchWithUser("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "AI-Native Engineering RFC.md",
          content: sampleMarkdown,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load sample document");
      }

      if (onUploadSuccess) {
        onUploadSuccess(data.document);
      }
      onClose();
      router.push(`/document/${data.document.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 leading-tight">
                Import File to Document
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload Markdown (.md) or Text (.txt) to create an editable doc
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

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-blue-500 bg-blue-50/50"
                : selectedFile
                ? "border-emerald-400 bg-emerald-50/30"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.md,.markdown,.json"
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="font-semibold text-slate-800 text-sm">
                  {selectedFile.name}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB — Ready to convert to rich document
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-2">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="font-semibold text-slate-800 text-sm">
                  Click to browse or drop file here
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Supported: <span className="font-medium text-slate-600">.md, .markdown, .txt, .json</span>
                </div>
              </div>
            )}
          </div>

          {/* Supported Types Notice */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-blue-600" />
              <span>Smart Document Ingestion</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Markdown headings (`#`, `##`), bullet lists, numbered lists, blockquotes, and bold formatting will automatically convert into full rich-text elements.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Sample Pre-load */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleLoadSampleDocument}
              disabled={isLoading}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-indigo-100 bg-indigo-50/60 hover:bg-indigo-50 text-indigo-900 transition-colors text-xs group text-left"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-indigo-900">
                    No file ready? Load Demo RFC (.md)
                  </div>
                  <div className="text-[11px] text-indigo-700/80">
                    Imports a sample AI Engineering RFC with headers and lists
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedFile || isLoading}
            onClick={handleUpload}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {isLoading ? "Importing..." : "Import & Open Document"}
          </button>
        </div>
      </div>
    </div>
  );
}
