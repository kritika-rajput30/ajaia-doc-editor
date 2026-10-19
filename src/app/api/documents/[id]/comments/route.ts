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
    const rawComments = db
      .prepare(`
        SELECT c.*, u.name as user_name, u.email as user_email, u.avatar_url as user_avatar, u.role as user_role
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.document_id = ?
        ORDER BY c.created_at ASC
      `)
      .all(id) as any[];

    const comments = rawComments.map((c) => ({
      id: c.id,
      documentId: c.document_id,
      userId: c.user_id,
      content: c.content,
      createdAt: c.created_at,
      user: {
        id: c.user_id,
        name: c.user_name,
        email: c.user_email,
        avatarUrl: c.user_avatar,
        role: c.user_role,
      },
    }));

    return NextResponse.json({ comments });
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

    if (!access.document || !access.permission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const content = (body.content || "").trim();

    if (!content) {
      return NextResponse.json({ error: "Comment text cannot be empty" }, { status: 400 });
    }

    const commentId = `cmt_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();

    const db = getDatabase();
    db.prepare(`
      INSERT INTO comments (id, document_id, user_id, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(commentId, id, userId, content, now);

    return NextResponse.json({
      success: true,
      comment: {
        id: commentId,
        documentId: id,
        userId,
        content,
        createdAt: now,
      },
    });
  } catch (error: any) {
    console.error("POST comment error:", error);
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

    if (!access.document || !access.permission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "commentId is required" }, { status: 400 });
    }

    const db = getDatabase();
    const comment = db
      .prepare("SELECT * FROM comments WHERE id = ? AND document_id = ?")
      .get(commentId, id) as any;

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Only comment author or document owner can delete comment
    if (comment.user_id !== userId && !access.isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    db.prepare("DELETE FROM comments WHERE id = ?").run(commentId);

    return NextResponse.json({ success: true, message: "Comment deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
