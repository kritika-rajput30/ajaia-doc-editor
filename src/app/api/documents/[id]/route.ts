import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getCurrentUserId, getDocumentAccess } from "@/lib/auth";
import { extractPlainText } from "@/lib/file-parser";
import crypto from "node:crypto";

export async function GET(
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

    if (!access.permission) {
      return NextResponse.json(
        {
          error: "Access denied. You do not have permission to view this document.",
          permission: null,
        },
        { status: 403 }
      );
    }

    const db = getDatabase();

    // Fetch attachments
    const rawAttachments = db
      .prepare("SELECT id, document_id, filename, file_type, file_size, created_at FROM attachments WHERE document_id = ? ORDER BY created_at DESC")
      .all(id) as any[];

    // Fetch versions
    const rawVersions = db
      .prepare(`
        SELECT v.*, u.name as user_name, u.avatar_url as user_avatar
        FROM document_versions v
        JOIN users u ON v.created_by = u.id
        WHERE v.document_id = ?
        ORDER BY v.version_number DESC
        LIMIT 10
      `)
      .all(id) as any[];

    return NextResponse.json({
      document: access.document,
      permission: access.permission,
      isOwner: access.isOwner,
      canEdit: access.canEdit,
      canShare: access.canShare,
      canDelete: access.canDelete,
      owner: access.owner,
      collaborators: access.collaborators,
      attachments: rawAttachments,
      versions: rawVersions.map((v) => ({
        id: v.id,
        title: v.title,
        content: v.content,
        versionNumber: v.version_number,
        createdAt: v.created_at,
        creator: {
          id: v.created_by,
          name: v.user_name,
          avatarUrl: v.user_avatar,
        },
      })),
      currentUserId: userId,
    });
  } catch (error: any) {
    console.error("GET /api/documents/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
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
        {
          error: "Forbidden. You have viewing permission only and cannot modify this document.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const db = getDatabase();
    const now = new Date().toISOString();

    const newTitle = body.title !== undefined ? String(body.title).trim() || "Untitled Document" : access.document.title;
    const newContent = body.content !== undefined ? String(body.content) : access.document.content;
    const newPlainText = body.content !== undefined ? extractPlainText(newContent) : access.document.plain_text;

    // Update document
    const updateStmt = db.prepare(`
      UPDATE documents
      SET title = ?, content = ?, plain_text = ?, updated_at = ?
      WHERE id = ?
    `);

    updateStmt.run(newTitle, newContent, newPlainText, now, id);

    // If content changed significantly or requested snapshot, record version
    if (body.saveVersion || (body.content !== undefined && body.content !== access.document.content)) {
      const maxVer = (
        db
          .prepare("SELECT MAX(version_number) as max_v FROM document_versions WHERE document_id = ?")
          .get(id) as { max_v: number | null }
      ).max_v || 1;

      const insertVersion = db.prepare(`
        INSERT INTO document_versions (id, document_id, title, content, created_by, version_number, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertVersion.run(
        `ver_${crypto.randomBytes(8).toString("hex")}`,
        id,
        newTitle,
        newContent,
        userId,
        maxVer + 1,
        now
      );
    }

    return NextResponse.json({
      success: true,
      document: {
        ...access.document,
        title: newTitle,
        content: newContent,
        plain_text: newPlainText,
        updated_at: now,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/documents/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
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

    if (!access.canDelete) {
      return NextResponse.json(
        {
          error: "Forbidden. Only the document owner can delete this document.",
        },
        { status: 403 }
      );
    }

    const db = getDatabase();
    // Soft delete or hard delete; CASCADE will clean up collaborators and attachments
    db.prepare("DELETE FROM documents WHERE id = ?").run(id);

    return NextResponse.json({ success: true, message: "Document deleted successfully." });
  } catch (error: any) {
    console.error("DELETE /api/documents/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
