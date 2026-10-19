import { getDatabase, User, Document, Collaborator } from "./db";
import { NextRequest } from "next/server";

export const DEFAULT_USER_ID = "usr_kritika";

export function getCurrentUserId(request?: NextRequest | Request | null): string {
  if (request) {
    const customHeader = request.headers.get("x-user-id");
    if (customHeader) return customHeader;

    // Check cookie if available
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/ajaia_user_id=([^;]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
  }

  return DEFAULT_USER_ID;
}

export function getAllUsers(): User[] {
  const db = getDatabase();
  return db.prepare("SELECT * FROM users ORDER BY name ASC").all() as unknown as User[];
}

export function getUserById(userId: string): User | null {
  const db = getDatabase();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as unknown as User | undefined;
  return user || null;
}

export type DocumentPermission = "owner" | "editor" | "viewer" | null;

export interface DocumentAccessResult {
  document: Document | null;
  permission: DocumentPermission;
  isOwner: boolean;
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;
  collaborators: (Collaborator & { user: User })[];
  owner: User | null;
}

export function getDocumentAccess(documentId: string, userId: string): DocumentAccessResult {
  const db = getDatabase();

  const doc = db
    .prepare("SELECT * FROM documents WHERE id = ? AND is_archived = 0")
    .get(documentId) as unknown as Document | undefined;

  if (!doc) {
    return {
      document: null,
      permission: null,
      isOwner: false,
      canEdit: false,
      canShare: false,
      canDelete: false,
      collaborators: [],
      owner: null,
    };
  }

  const owner = getUserById(doc.owner_id);

  // Fetch all collaborators with user details
  const rawCollabs = db
    .prepare(`
      SELECT c.*, u.name as user_name, u.email as user_email, u.avatar_url as user_avatar, u.role as user_role
      FROM collaborators c
      JOIN users u ON c.user_id = u.id
      WHERE c.document_id = ?
    `)
    .all(documentId) as any[];

  const collaborators = rawCollabs.map((c) => ({
    id: c.id,
    document_id: c.document_id,
    user_id: c.user_id,
    permission: c.permission as "editor" | "viewer",
    created_at: c.created_at,
    user: {
      id: c.user_id,
      name: c.user_name,
      email: c.user_email,
      avatar_url: c.user_avatar,
      role: c.user_role,
      created_at: "",
    },
  }));

  // Check if current user is owner
  if (doc.owner_id === userId) {
    return {
      document: doc,
      permission: "owner",
      isOwner: true,
      canEdit: true,
      canShare: true,
      canDelete: true,
      collaborators,
      owner,
    };
  }

  // Check collaborator permission
  const userCollab = collaborators.find((c) => c.user_id === userId);
  if (userCollab) {
    return {
      document: doc,
      permission: userCollab.permission,
      isOwner: false,
      canEdit: userCollab.permission === "editor",
      canShare: false, // only owners can share
      canDelete: false, // only owners can delete
      collaborators,
      owner,
    };
  }

  // No access
  return {
    document: doc,
    permission: null,
    isOwner: false,
    canEdit: false,
    canShare: false,
    canDelete: false,
    collaborators,
    owner,
  };
}
