import { describe, it, expect, beforeAll } from "vitest";
import { getDatabase } from "../lib/db";
import { getDocumentAccess } from "../lib/auth";
import crypto from "node:crypto";

describe("Sharing & Collaboration Lifecycle", () => {
  let testDocId: string;
  const db = getDatabase();

  beforeAll(() => {
    // Create a fresh document for isolated testing
    testDocId = `doc_test_${Date.now()}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO documents (id, title, content, plain_text, owner_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      testDocId,
      "Test Collaboration Document",
      "<p>Initial test content</p>",
      "Initial test content",
      "usr_kritika",
      now,
      now
    );
  });

  it("should initially have only the owner", () => {
    const access = getDocumentAccess(testDocId, "usr_kritika");
    expect(access.collaborators.length).toBe(0);
    expect(access.isOwner).toBe(true);
  });

  it("should add a new viewer collaborator", () => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO collaborators (id, document_id, user_id, permission, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `col_${Date.now()}`,
      testDocId,
      "usr_marcus",
      "viewer",
      now
    );

    const accessMarcus = getDocumentAccess(testDocId, "usr_marcus");
    expect(accessMarcus.permission).toBe("viewer");
    expect(accessMarcus.canEdit).toBe(false);
  });

  it("should promote a viewer to editor", () => {
    db.prepare(`
      UPDATE collaborators
      SET permission = 'editor'
      WHERE document_id = ? AND user_id = ?
    `).run(testDocId, "usr_marcus");

    const accessMarcus = getDocumentAccess(testDocId, "usr_marcus");
    expect(accessMarcus.permission).toBe("editor");
    expect(accessMarcus.canEdit).toBe(true);
  });

  it("should revoke collaborator access cleanly", () => {
    db.prepare(`
      DELETE FROM collaborators
      WHERE document_id = ? AND user_id = ?
    `).run(testDocId, "usr_marcus");

    const accessMarcus = getDocumentAccess(testDocId, "usr_marcus");
    expect(accessMarcus.permission).toBeNull();
    expect(accessMarcus.canEdit).toBe(false);
  });
});
