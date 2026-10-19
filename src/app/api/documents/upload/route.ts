import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getCurrentUserId, getUserById } from "@/lib/auth";
import { parseFileContent } from "@/lib/file-parser";
import crypto from "node:crypto";

export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request);
    const user = getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    let filename = "Imported Document.txt";
    let textContent = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided in request" }, { status: 400 });
      }

      filename = file.name;
      const buffer = await file.arrayBuffer();
      textContent = Buffer.from(buffer).toString("utf-8");
    } else {
      const body = await request.json();
      if (!body.content) {
        return NextResponse.json({ error: "No file content provided" }, { status: 400 });
      }
      filename = body.filename || filename;
      textContent = body.content;
    }

    // Validate supported file extensions
    const ext = filename.split(".").pop()?.toLowerCase();
    const supportedExtensions = ["txt", "md", "markdown", "json"];
    if (ext && !supportedExtensions.includes(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: .${ext}. Currently supported file types are: .txt, .md, .markdown, .json`,
        },
        { status: 400 }
      );
    }

    // Parse the file into rich HTML and plain text
    const parsed = parseFileContent(textContent, filename);

    const docId = `doc_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();

    const db = getDatabase();
    const insertDoc = db.prepare(`
      INSERT INTO documents (id, title, content, plain_text, owner_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertDoc.run(
      docId,
      parsed.title,
      parsed.content,
      parsed.plainText,
      userId,
      now,
      now
    );

    // Initial version
    const insertVersion = db.prepare(`
      INSERT INTO document_versions (id, document_id, title, content, created_by, version_number, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertVersion.run(
      `ver_${crypto.randomBytes(8).toString("hex")}`,
      docId,
      parsed.title,
      parsed.content,
      userId,
      1,
      now
    );

    return NextResponse.json({
      success: true,
      message: `File "${filename}" imported successfully into new editable document.`,
      document: {
        id: docId,
        title: parsed.title,
        content: parsed.content,
        plainText: parsed.plainText,
        wordCount: parsed.wordCount,
        ownerId: userId,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error: any) {
    console.error("POST /api/documents/upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
