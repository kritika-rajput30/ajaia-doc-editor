"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { EditorToolbar } from "./EditorToolbar";
import { Eye, Clock, FileText } from "lucide-react";

interface RichTextEditorProps {
  initialContent: string;
  onContentChange: (content: string, plainText: string) => void;
  readOnly?: boolean;
  ownerName?: string;
}

export function RichTextEditor({
  initialContent,
  onContentChange,
  readOnly = false,
  ownerName,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Type something, or click Import to upload a file...",
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      onContentChange(html, text);
    },
  });

  // Synchronize readOnly state dynamically if user changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // Synchronize content if initialContent changes externally (e.g. version restore or switch)
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
  }, [editor, initialContent]);

  if (!editor) return null;

  const plainText = editor.getText();
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const charCount = plainText.length;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-100 overflow-hidden">
      {/* Google Docs Toolbar */}
      <div className="flex-shrink-0 z-20 no-print">
        <EditorToolbar editor={editor} readOnly={readOnly} />
      </div>

      {/* Viewing Mode Banner */}
      {readOnly && (
        <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Viewing only:</strong> You have read-only access granted by{" "}
              <strong>{ownerName || "the owner"}</strong>. Any edits made will not be saved.
            </span>
          </div>
        </div>
      )}

      {/* Canvas Paper Area - Exclusively scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto py-8 px-4 flex justify-center scroll-smooth">
        <div className="w-full max-w-[850px] min-h-[1050px] bg-white shadow-xs hover:shadow-sm transition-shadow rounded-sm border border-slate-200/80 p-12 md:p-16 print-page">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Editor Footer / Word Count Bar */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-between text-xs text-slate-500 no-print">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{wordCount} words</span>
          </span>
          <span className="text-slate-300">•</span>
          <span>{charCount} characters</span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>~{readingTimeMin} min read</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Markdown shortcuts enabled: # Heading, - List, &gt; Quote, **Bold**
        </div>
      </div>
    </div>
  );
}
