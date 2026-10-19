import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getCurrentUserId, getDocumentAccess, getUserById } from "@/lib/auth";
import crypto from "node:crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUserId = getCurrentUserId(request);
    const access = getDocumentAccess(id, currentUserId);

    if (!access.document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!access.canShare) {
      return NextResponse.json(
        {
          error: "Forbidden. Only the document owner can share or modify collaborator permissions.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    let targetUserId = body.userId;
    const targetEmail = body.email?.trim().toLowerCase();
    const permission = body.permission === "viewer" ? "viewer" : "editor";

    const db = getDatabase();

    // If email provided instead of userId, find user by email
    if (!targetUserId && targetEmail) {
      const foundUser = db
        .prepare("SELECT id FROM users WHERE LOWER(email) = ?")
        .get(targetEmail) as { id: string } | undefined;

      if (!foundUser) {
        return NextResponse.json(
          { error: `User with email "${targetEmail}" was not found.` },
          { status: 404 }
        );
      }
      targetUserId = foundUser.id;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target user ID or email is required." },
        { status: 400 }
      );
    }

    // Owner cannot add themselves as collaborator
    if (targetUserId === access.document.owner_id) {
      return NextResponse.json(
        { error: "Document owner already has full access." },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = getUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }

    // Insert or update collaborator
    const existing = db
      .prepare("SELECT id FROM collaborators WHERE document_id = ? AND user_id = ?")
      .get(id, targetUserId) as { id: string } | undefined;

    const now = new Date().toISOString();

    if (existing) {
      db.prepare("UPDATE collaborators SET permission = ? WHERE id = ?").run(permission, existing.id);
    } else {
      const collabId = `col_${crypto.randomBytes(8).toString("hex")}`;
      db.prepare(`
        INSERT INTO collaborators (id, document_id, user_id, permission, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(collabId, id, targetUserId, permission, now);
    }

    // Fetch updated collaborators list
    const updatedAccess = getDocumentAccess(id, currentUserId);

    return NextResponse.json({
      success: true,
      message: `Access granted to ${targetUser.name} as ${permission}.`,
      collaborators: updatedAccess.collaborators,
    });
  } catch (error: any) {
    console.error("POST /api/documents/[id]/share error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUserId = getCurrentUserId(request);
    const access = getDocumentAccess(id, currentUserId);

    if (!access.document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!access.canShare) {
      return NextResponse.json(
        {
          error: "Forbidden. Only the document owner can revoke collaborator access.",
        },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    let targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      const body = await request.json().catch(() => ({}));
      targetUserId = body.userId;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    const db = getDatabase();
    db.prepare("DELETE FROM collaborators WHERE document_id = ? AND user_id = ?").run(
      id,
      targetUserId
    );

    const updatedAccess = getDocumentAccess(id, currentUserId);

    return NextResponse.json({
      success: true,
      message: "Collaborator access removed.",
      collaborators: updatedAccess.collaborators,
    });
  } catch (error: any) {
    console.error("DELETE /api/documents/[id]/share error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
