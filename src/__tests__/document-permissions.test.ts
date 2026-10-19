import { describe, it, expect, beforeAll } from "vitest";
import { getDatabase } from "../lib/db";
import { getDocumentAccess } from "../lib/auth";

describe("Document Access Control & RBAC Permissions", () => {
  beforeAll(() => {
    // Ensures database is initialized and seeded
    getDatabase();
  });

  it("should grant full ownership rights to document owner", () => {
    // doc_roadmap is owned by usr_kritika
    const access = getDocumentAccess("doc_roadmap", "usr_kritika");

    expect(access.document).not.toBeNull();
    expect(access.isOwner).toBe(true);
    expect(access.permission).toBe("owner");
    expect(access.canEdit).toBe(true);
    expect(access.canShare).toBe(true);
    expect(access.canDelete).toBe(true);
  });

  it("should grant edit rights to editor but forbid deletion and sharing", () => {
    // doc_roadmap is shared with usr_sarah as editor
    const access = getDocumentAccess("doc_roadmap", "usr_sarah");

    expect(access.document).not.toBeNull();
    expect(access.isOwner).toBe(false);
    expect(access.permission).toBe("editor");
    expect(access.canEdit).toBe(true);
    expect(access.canShare).toBe(false);
    expect(access.canDelete).toBe(false);
  });

  it("should enforce read-only viewing for viewer collaborator", () => {
    // doc_roadmap is shared with usr_alex as viewer
    const access = getDocumentAccess("doc_roadmap", "usr_alex");

    expect(access.document).not.toBeNull();
    expect(access.isOwner).toBe(false);
    expect(access.permission).toBe("viewer");
    expect(access.canEdit).toBe(false);
    expect(access.canShare).toBe(false);
    expect(access.canDelete).toBe(false);
  });

  it("should deny access to non-collaborator users", () => {
    // usr_marcus is not on doc_roadmap
    const access = getDocumentAccess("doc_roadmap", "usr_marcus");

    expect(access.permission).toBeNull();
    expect(access.canEdit).toBe(false);
    expect(access.canShare).toBe(false);
    expect(access.canDelete).toBe(false);
  });

  it("should return null document for non-existent document ID", () => {
    const access = getDocumentAccess("doc_non_existent", "usr_kritika");

    expect(access.document).toBeNull();
    expect(access.permission).toBeNull();
  });
});
