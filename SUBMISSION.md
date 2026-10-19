# Candidate Submission: Ajaia Full Stack Product Engineer

**Candidate**: Kritika Rajput  
**Email**: kritikarajput203@gmail.com  
**Role**: AI-Native Full Stack Product Engineer (Take-Home Assessment)  
**Live Deployment URL**: [https://ajaia-doc-editor-zeta.vercel.app](https://ajaia-doc-editor-zeta.vercel.app)  
**GitHub Repository**: [https://github.com/kritika-rajput30/ajaia-doc-editor](https://github.com/kritika-rajput30/ajaia-doc-editor)  
**Walkthrough Video**: [https://www.loom.com/share/d98f6233e6b940debc87625dee94619b](https://www.loom.com/share/d98f6233e6b940debc87625dee94619b)  

---

## 1. Deliverables Included in this Submission

| File / Component | Description |
| :--- | :--- |
| `src/` | Full-stack application code (Next.js 16, TypeScript, TipTap, Tailwind CSS, SQLite, Shadcn UI) |
| `README.md` | Complete local setup, run instructions, feature inventory, and architecture summary |
| `ARCHITECTURE.md` | In-depth engineering rationale, prioritization decisions, and scope tradeoff notes |
| `SUBMISSION.md` | This formal submission overview and evaluation guide |
| `vitest.config.ts` & `src/__tests__/` | 15 automated tests covering RBAC permissions, file parsing, and sharing flows |

---

## 2. Seeded Test Accounts (Instant Reviewer Switcher)

Reviewers can switch between accounts with one click using the **User Switcher** in the top-right header:

| User Name | Role | Email | Default Seeded Document Permission |
| :--- | :--- | :--- | :--- |
| **Kritika Rajput** | Full Stack Product Engineer | `kritikarajput203@gmail.com` | **Owner** (Primary demo document: Roadmap & Architecture) |
| **Sarah Chen** | Head of Product | `sarah.chen@ajaia.com` | **Editor** on Roadmap document; Owner of Team Retrospective |
| **Alex Rivera** | Staff Infrastructure Engineer | `alex.rivera@ajaia.com` | **Viewer** on Roadmap document (Read-only sandbox) |
| **Marcus Brody** | Design Lead | `marcus.brody@ajaia.com` | **Simulated Non-collaborator** (Verifies access boundaries) |

---

## 3. End-to-End Capabilities & Evaluation Matrix

### Task 1: Document Creation & Editing
- **Creation & Templates**: Instant document creation from blank or pre-built productivity templates (*Product RFC*, *Meeting Notes*).
- **Sticky Google Docs Layout**: Fixed app shell (`fixed inset-0 overflow-hidden`) keeping the top navigation bar and TipTap formatting ribbon permanently locked during lengthy document scrolling; only the centered paper canvas (`max-w-[850px]`) scrolls.
- **Rich-Text Ribbon**: Headings (H1, H2, H3, Paragraph), bold, italic, underline, strikethrough, inline code, alignment (left, center, right, justify), bulleted lists, numbered lists, blockquotes, horizontal dividers, and undo/redo history.
- **Debounced Auto-Save**: Real-time cloud synchronization to SQLite with visual status indicators (*"Saving to cloud..."*, *"All changes saved"*).
- **Editor Analytics**: Live word count, character count, and estimated reading time.

### Task 2: File Ingestion & Attachments
- **Smart Parsing**: Upload `.md`, `.markdown`, `.txt`, or `.json` files via drag-and-drop or file picker.
- **AST Node Conversion**: Headings (`#`, `##`), lists (`-`, `1.`), bold (`**`), blockquotes (`>`), and code snippets are automatically parsed into native ProseMirror document nodes.
- **1-Click Reviewer Ingestion**: Built-in *"Load Demo RFC (.md)"* button allowing reviewers to test file conversion with zero prep.
- **In-Document Attachments**: Dedicated Attachments Drawer for associating PDFs, images, and project reference files with documents.

### Task 3: Sharing & Permissions (RBAC)
- **Document Ownership**: Every document tracks an explicit owner with administrative elevation rights.
- **Shadcn UI Sharing Modal**: Integrated Radix UI `Select` dropdowns to invite teammates, elevate or demote roles between *Editor* and *Viewer*, and revoke access.
- **Viewer Sandbox**: When logged in as a *Viewer* (e.g., Alex Rivera), the editor hides formatting ribbons, disables the title input, displays a clear read-only banner, and server-side API routes reject write operations with `403 Forbidden`.
- **Dashboard Separation**: Tabbed document shelf filtering between *All Documents*, *Owned by me*, and *Shared with me*.

### Task 4: Persistence Architecture
- **Embedded Relational Store**: Built using Node's native `DatabaseSync` (`node:sqlite`).
- **Resilience**: Configured with `PRAGMA journal_mode = WAL;`, `PRAGMA busy_timeout = 5000;`, and cascading foreign keys.
- **Zero-Config Cloud Seeding**: When running on Vercel or ephemeral environments, the database initializes seamlessly in `/tmp` and auto-populates the seed team accounts and documents on boot.

---

## 4. Architecture Note: Prioritization & Tradeoffs

### What Was Prioritized:
1. **Deterministic Server-Side Authorization**: Strict server-side permission validation on every REST endpoint rather than superficial UI-only locks.
2. **Sticky Viewport Mathematics**: Fixed shell layout preventing toolbar scroll-off on long documents.
3. **Reviewer Evaluation Experience**: 1-click user switching and sample pre-loading for rapid assessment.

### What Was Deliberately Deprioritized:
1. **Real-Time CRDT Mesh (Yjs / Automerge)**: Within a 4–6 hour scope, decentralized CRDTs introduce high synchronization failure risk; deterministic REST auto-save and version snapshots were prioritized instead.
2. **External OAuth**: Seeded accounts and instant switching were chosen over third-party OAuth to eliminate signup friction for reviewers.

---

## 5. AI-Native Workflow Note

- **Velocity Impact**: AI scaffolded boilerplate (initial SQLite tables, TipTap setup, and test fixtures), saving ~90 minutes of mechanical setup.
- **Human Rejections & Changes**:
  1. *Rejected In-Memory State*: Replaced AI's suggested in-memory map with ACID SQLite persistence.
  2. *Rejected Client-Only Validation*: Replaced UI-only permission hiding with strict server-side RBAC validation (`403 Forbidden`).
  3. *Fixed Test Concurrency*: Diagnosed SQLite file lock in Vitest and configured serialized execution (`fileParallelism: false`).
- **Verification**: 15/15 automated Vitest tests passing (`npm test`); production build compiles in 1.3s with 0 errors (`npm run build`).

---

## 6. What Is Working vs. Future Roadmap

| Capability | Current Status | What I Would Build with Another 2–4 Hours |
| :--- | :---: | :--- |
| **Rich-Text Editing** | ✅ Complete | Table insertion and in-canvas image resizing |
| **Smart Ingestion** | ✅ Complete | Multi-file batch drag-and-drop parser |
| **RBAC Sharing** | ✅ Complete | Expiring public share links with optional password protection |
| **Version History** | ✅ Complete | Visual inline git-style word diff between revisions |
| **Discussions / Comments** | ✅ Complete | Inline highlighted text anchor threading for comments |
| **Export Formats** | ✅ Complete | Direct PDF rendering without browser print dialog |

---

## 7. Local Setup Instructions

```bash
# 1. Clone the repository
git clone https://github.com/kritika-rajput30/ajaia-doc-editor.git
cd ajaia-doc-editor

# 2. Install dependencies (requires Node.js >= 22.5.0)
npm install

# 3. Start local development server
npm run dev

# 4. Open in browser
# http://localhost:3000

# 5. Run automated test suite
npm test
```
