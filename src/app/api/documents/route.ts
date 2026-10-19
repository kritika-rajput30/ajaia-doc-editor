import { NextRequest, NextResponse } from "next/server";
import { getDatabase, Document } from "@/lib/db";
import { getCurrentUserId, getUserById } from "@/lib/auth";
import crypto from "node:crypto";

export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request);
    const db = getDatabase();

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter") || "all"; // all, owned, shared
    const search = searchParams.get("q")?.toLowerCase() || "";

    // Query all documents owned by user OR shared with user
    const query = `
      SELECT DISTINCT 
        d.id, d.title, d.plain_text, d.owner_id, d.created_at, d.updated_at,
        u.name as owner_name, u.email as owner_email, u.avatar_url as owner_avatar,
        c.permission as user_permission,
        (SELECT COUNT(*) FROM collaborators WHERE document_id = d.id) as collaborator_count
      FROM documents d
      JOIN users u ON d.owner_id = u.id
      LEFT JOIN collaborators c ON c.document_id = d.id AND c.user_id = ?
      WHERE d.is_archived = 0
        AND (d.owner_id = ? OR c.user_id = ?)
      ORDER BY d.updated_at DESC
    `;

    const rawDocs = db.prepare(query).all(userId, userId, userId) as any[];

    const docs = rawDocs.map((row) => {
      const isOwner = row.owner_id === userId;
      const permission = isOwner ? "owner" : (row.user_permission as "editor" | "viewer");

      return {
        id: row.id,
        title: row.title,
        plainText: row.plain_text,
        preview: row.plain_text ? row.plain_text.slice(0, 150) + "..." : "Empty document...",
        ownerId: row.owner_id,
        owner: {
          id: row.owner_id,
          name: row.owner_name,
          email: row.owner_email,
          avatarUrl: row.owner_avatar,
        },
        permission,
        isOwner,
        collaboratorCount: Number(row.collaborator_count) || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    let filtered = docs;
    if (filter === "owned") {
      filtered = filtered.filter((d) => d.isOwner);
    } else if (filter === "shared") {
      filtered = filtered.filter((d) => !d.isOwner);
    }

    if (search) {
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(search) ||
          d.plainText.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      documents: filtered,
      counts: {
        all: docs.length,
        owned: docs.filter((d) => d.isOwner).length,
        shared: docs.filter((d) => !d.isOwner).length,
      },
      currentUserId: userId,
    });
  } catch (error: any) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request);
    const user = getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = (body.title || "Untitled Document").trim();
    const content = body.content || "<p></p>";
    const plainText = body.plainText || "";

    const docId = `doc_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();

    const db = getDatabase();
    const insertDoc = db.prepare(`
      INSERT INTO documents (id, title, content, plain_text, owner_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertDoc.run(docId, title, content, plainText, userId, now, now);

    // Create initial version
    const insertVersion = db.prepare(`
      INSERT INTO document_versions (id, document_id, title, content, created_by, version_number, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertVersion.run(`ver_${crypto.randomBytes(8).toString("hex")}`, docId, title, content, userId, 1, now);

    return NextResponse.json({
      success: true,
      document: {
        id: docId,
        title,
        content,
        plainText,
        ownerId: userId,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error: any) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
