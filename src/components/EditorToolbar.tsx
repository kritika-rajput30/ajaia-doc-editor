"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  Minus,
  RemoveFormatting,
  Lock,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
  readOnly?: boolean;
}

export function EditorToolbar({ editor, readOnly = false }: EditorToolbarProps) {
  if (!editor) return null;

  if (readOnly) {
    return (
      <div className="bg-slate-50/90 backdrop-blur-xs border-y border-slate-200/80 px-4 py-2 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-md font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Viewing Mode</span>
          </div>
          <span>You have read-only access to this document. Editing controls are disabled.</span>
        </div>
      </div>
    );
  }

  const setHeading = (level: 1 | 2 | 3 | 0) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  const getCurrentHeadingValue = () => {
    if (editor.isActive("heading", { level: 1 })) return "1";
    if (editor.isActive("heading", { level: 2 })) return "2";
    if (editor.isActive("heading", { level: 3 })) return "3";
    return "0";
  };

  return (
    <div className="z-20 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/90 px-3 py-1.5 flex flex-wrap items-center gap-1 shadow-2xs">
      {/* Undo / Redo */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 transition-colors"
          title="Undo (Ctrl+Z / Cmd+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 transition-colors"
          title="Redo (Ctrl+Y / Cmd+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-slate-300 mx-1" />

      {/* Headings Dropdown */}
      <select
        value={getCurrentHeadingValue()}
        onChange={(e) => setHeading(Number(e.target.value) as 0 | 1 | 2 | 3)}
        className="text-xs font-medium px-2 py-1 rounded bg-transparent hover:bg-slate-200 border border-transparent focus:border-slate-300 focus:outline-none text-slate-800 cursor-pointer"
      >
        <option value="0">Normal text</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>

      <div className="w-px h-5 bg-slate-300 mx-1" />

      {/* Basic Formatting: Bold, Italic, Underline, Strikethrough */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive("bold")
              ? "bg-blue-100 text-blue-700 font-bold"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Bold (Cmd+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive("italic")
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Italic (Cmd+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive("underline")
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Underline (Cmd+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive("strike")
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive("code")
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Inline code"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-slate-300 mx-1" />

      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive({ textAlign: "left" })
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive({ textAlign: "center" })
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive({ textAlign: "right" })
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive({ textAlign: "justify" })
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-slate-300 mx-1" />

      {/* Lists & Blocks */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive("bulletList")
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Bulleted list"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive("orderedList")
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Numbered list"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive("blockquote")
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-slate-200 text-slate-700"
          }`}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
          title="Horizontal line"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
          title="Clear formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
