"use client";

import React, { useState } from "react";
import { X, History, RotateCcw, Clock, Check } from "lucide-react";

interface VersionItem {
  id: string;
  title: string;
  content: string;
  versionNumber: number;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    avatarUrl: string;
  };
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: VersionItem[];
  currentVersionContent: string;
  canEdit: boolean;
  onRestoreVersion: (content: string, title: string) => void;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  versions,
  currentVersionContent,
  canEdit,
  onRestoreVersion,
}: VersionHistoryModalProps) {
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(
    versions[0] || null
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 leading-tight">
                Document Version History
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect snapshots and restore prior edits
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

        {/* Body Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Version List Sidebar */}
          <div className="w-72 border-r border-slate-200 overflow-y-auto p-3 space-y-1 bg-slate-50/50">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
              Recorded Snapshots ({versions.length})
            </div>
            {versions.map((ver, idx) => {
              const isSelected = selectedVersion?.id === ver.id;
              const isLatest = idx === 0;

              return (
                <button
                  key={ver.id}
                  onClick={() => setSelectedVersion(ver)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1 border ${
                    isSelected
                      ? "bg-white border-blue-200 shadow-xs ring-1 ring-blue-500/10"
                      : "border-transparent hover:bg-white/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">
                      Version #{ver.versionNumber} {isLatest && "(Current)"}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <img
                      src={ver.creator.avatarUrl}
                      alt={ver.creator.name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="text-[11px] text-slate-600 truncate">
                      {ver.creator.name}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(ver.createdAt).toLocaleString()}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
            <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">
                Previewing: {selectedVersion ? `Version #${selectedVersion.versionNumber}` : "None"}
              </span>

              {canEdit && selectedVersion && (
                <button
                  onClick={() => {
                    onRestoreVersion(selectedVersion.content, selectedVersion.title);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore this version</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex justify-center">
              <div className="w-full max-w-[700px] bg-white p-8 rounded shadow-xs border border-slate-200 tiptap text-sm">
                {selectedVersion ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedVersion.content }} />
                ) : (
                  <div className="text-slate-400">Select a version from the left</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
