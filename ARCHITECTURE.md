# Architecture Decision Note: Ajaia Collaborative Document Editor

**Author**: Kritika Rajput (`kritikarajput203@gmail.com`)  
**Role**: AI-Native Full Stack Product Engineer Candidate  
**Project**: Ajaia Collaborative Document Editor  

---

## 1. Executive Summary & Philosophy

When designing a production-grade document editor under a tight delivery constraint (4–6 hours), the greatest failure mode is attempting to build a broad, shallow clone of Google Docs that breaks under basic edge cases. 

My engineering philosophy for this challenge was:
> **Deliver a deep, coherent, and resilient product slice that reviewers can actually use, test, and evaluate end-to-end without friction.**

I prioritized five foundational pillars:
1. **Editing Quality & Usability**: Clean typography, paper canvas, rich-text formatting (headings, lists, bold, italics, alignment), and debounced auto-saving.
2. **File Ingestion Pipeline**: Ingesting Markdown and plain-text files and converting them into structured rich-text documents.
3. **Deterministic Access Control (RBAC)**: Enforcing clear boundaries between Document Owners, Editors, and Viewers on both the server API and the client UI.
4. **Frictionless Reviewer Experience**: A simulated multi-user switcher allowing evaluators to verify multi-user permission states with zero setup.
5. **ACID Persistence & Snapshots**: Relational database storage with version history and rollback capabilities.

---

## 2. System Architecture & Component Design

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│                                                             │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │   Dashboard    │  │ RichTextEditor   │  │ UserSwitcher│  │
│  │  (Search/Tabs) │  │  (TipTap Canvas) │  │  (RBAC UI)  │  │
│  └───────┬────────┘  └────────┬─────────┘  └──────┬──────┘  │
└──────────┼────────────────────┼───────────────────┼─────────┘
           │                    │                   │
           ▼                    ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                 Next.js API Route Handlers                  │
│                                                             │
│  /api/documents    /api/documents/[id]    /api/documents/   │
│  (List/Create)     (Get/Patch/Delete)     upload (Ingest)   │
│           │                   │                   │         │
│           └───────────────────┼───────────────────┘         │
│                               ▼                             │
│                    Access Control Layer                     │
│               (getDocumentAccess / Auth Check)              │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Storage Layer (SQLite)                    │
│                                                             │
│   users ◄── documents ◄── collaborators ◄── attachments     │
│                 │                                           │
│                 └── document_versions                       │
└─────────────────────────────────────────────────────────────┘
```

### A. The Client & Editor Surface
- **Editor Engine**: Built on TipTap, which wraps the battle-tested **ProseMirror** framework (the same foundational architecture behind Google Docs, Atlassian Confluence, and Notion). This ensures:
  - Clean separation of the document document-object-model (DOM) from UI rendering.
  - Strict schema enforcement (preventing malformed HTML or unsafe script injections).
  - Out-of-the-box support for keyboard shortcuts (`Cmd+B`, `Cmd+I`, `Cmd+U`, `Cmd+Z`).
- **Paper Canvas Layout**: Mimics the familiar Google Docs document sheet (`max-w-[850px]` with subtle border and drop shadow), offering a distraction-free writing environment.
- **Auto-Save Mechanism**: Debounced background persistence (800ms for title, 1200ms for document body). Avoids spamming the network while ensuring zero loss of draft work.

### B. Access Control & Authorization (RBAC)
Document collaboration is only as strong as its permission enforcement:
- **Owner**: Creator of the document. Has sole authority to delete the document, invite new collaborators, update roles, or revoke access.
- **Editor**: Can modify document title and body content, add attachments, and restore versions. Cannot delete the document or alter collaborator permissions.
- **Viewer**: Strict read-only mode. Content inputs and toolbar actions are disabled. A persistent alert banner informs the user of their read-only status.
- **Server-Side Enforcement**: All `PATCH`, `DELETE`, and `POST /share` routes validate permissions through `getDocumentAccess(docId, userId)`. A viewer attempting to bypass the UI and hit the API directly receives a `403 Forbidden` response.

### C. Ingestion Pipeline (`file-parser.ts`)
Rather than treating file uploads as generic binary blobs, the upload workflow is deeply integrated with the editor:
- Ingested `.md` and `.txt` files are parsed line-by-line.
- Markdown headers (`#`, `##`, `###`), lists (`-`, `1.`), blockquotes (`>`), and inline marks (`**bold**`, `*italic*`, `` `code` ``) are transformed into structured HTML conforming to the ProseMirror schema.
- Title extraction automatically detects the top H1 or first non-empty line of the file.

### D. Relational Persistence & Durability
- Built using Node.js's native embedded SQLite engine (`DatabaseSync`).
- Configured with `PRAGMA journal_mode = WAL;` (Write-Ahead Logging) and `PRAGMA busy_timeout = 5000;` to guarantee concurrent read/write stability.
- Relational schema with foreign keys and cascade deletes ensures data consistency.
- Automatic snapshot versioning preserves document evolution and enables point-in-time rollbacks.

---

## 3. Deliberate Prioritizations & Scope Tradeoffs

| Capability | Decision | Rationale & Tradeoff |
|---|---|---|
| **Real-Time CRDT (Yjs/Automerge)** | **Deprioritized** | Full operational transformation or CRDTs across WebRTC/WebSocket introduce massive surface area (split-brain merges, offline reconciliation) that would compromise delivery within 4–6 hours. Prioritized rock-solid REST auto-save, lock-safe editing, and snapshot versioning. |
| **Simulated Auth Switcher** | **Prioritized** | Enterprise OAuth2 (Google/GitHub login) requires external client IDs, secrets, and friction for evaluators. Seeded multi-user switcher with RBAC headers provides 100% testability with zero setup. |
| **File Parser Depth** | **Prioritized** | Instead of an opaque file upload, importing a `.md` or `.txt` file immediately creates an editable, formatted document, providing immediate product utility. |
| **Snapshot Version History** | **Prioritized** | Provides disaster recovery and auditability for teams, showing engineering depth beyond a basic text box. |
| **Comments / Annotations** | **Deprioritized** | Inline comment threads require complex document range anchor management. Pushed to next development cycle. |

---

## 4. What I Would Build With Another 2–4 Hours

1. **Live Presence Cursors (WebSockets / SSE)**: Broadcast active collaborator caret positions and selection highlights across open documents.
2. **Inline Comments & Mentions**: Allow users to highlight text and leave threaded comments with `@teammate` notifications.
3. **Docx Import via Mammoth.js**: Extend the ingestion pipeline to parse binary Microsoft Word `.docx` documents.
4. **Offline Mode with PWA**: Cache active documents in IndexedDB with background synchronization when connectivity resumes.
