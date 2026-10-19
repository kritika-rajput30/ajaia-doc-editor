import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getCurrentUserId, getDocumentAccess } from "@/lib/auth";
import crypto from "node:crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getCurrentUserId(request);
    const access = getDocumentAccess(id, userId);

    if (!access.document || !access.permission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const db = getDatabase();
    const attachments = db
      .prepare("SELECT id, document_id, filename, file_type, file_size, created_at FROM attachments WHERE document_id = ? ORDER BY created_at DESC")
      .all(id);

    return NextResponse.json({ attachments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getCurrentUserId(request);
    const access = getDocumentAccess(id, userId);

    if (!access.document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!access.canEdit) {
      return NextResponse.json(
        { error: "Forbidden. Viewers cannot upload attachments." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const filename = file.name;
    const fileType = file.type || "application/octet-stream";
    const fileSize = file.size;

    // Convert file to base64 for persistent storage in sqlite
    const buffer = await file.arrayBuffer();
    const base64Content = Buffer.from(buffer).toString("base64");

    const attachmentId = `att_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();

    const db = getDatabase();
    db.prepare(`
      INSERT INTO attachments (id, document_id, filename, file_type, file_size, file_content_base64, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(attachmentId, id, filename, fileType, fileSize, base64Content, now);

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachmentId,
        document_id: id,
        documentId: id,
        filename,
        file_type: fileType,
        fileType,
        file_size: fileSize,
        fileSize,
        created_at: now,
        createdAt: now,
      },
    });
  } catch (error: any) {
    console.error("POST attachment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
