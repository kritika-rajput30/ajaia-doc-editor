# AI-Native Workflow Note

**Candidate**: Kritika Rajput  
**Role**: AI-Native Full Stack Product Engineer (Ajaia LLC Take-Home Assessment)  
**Project**: Ajaia Docs — Collaborative Document Editor  
**Date**: October 2026  

---

## 1. Overview & Tooling Stack

For this assignment, AI coding assistants were leveraged as an accelerated force multiplier across drafting, scaffolding, and refactoring. The guiding philosophy was **velocity acceleration without outsourcing engineering judgment**.

### AI Tools Utilized:
- **Interactive Coding Assistants**: Used for contextual code generation, schema drafting, and automated test scaffold creation.
- **AST Generation & Parsing Assist**: Used to draft regular expressions and syntax mapping for Markdown to ProseMirror AST conversion.
- **Terminal Shell Command Execution**: Used for running test suites, verifying builds, and diagnosing bundle traces.

---

## 2. Where AI Materially Sped Up the Work

AI delivered measurable productivity gains in three core phases:

1. **Scaffolding Relational SQLite Schemas**:
   - Initial drafting of the SQLite relational schema (5 tables: `users`, `documents`, `collaborators`, `document_versions`, `comments`).
   - Saved ~45 minutes of mechanical DDL writing and foreign-key constraint boilerplate.

2. **TipTap & ProseMirror Extension Setup**:
   - Scaffolding the configuration boilerplate for StarterKit, Underline, TextAlign, and Placeholder extensions.
   - Saved ~30 minutes of API documentation lookup.

3. **Automated Test Scaffolding**:
   - Generating 15 Vitest test cases covering RBAC permission permutations (owner, editor, viewer, uninvited user) and markdown syntax edge cases.
   - Saved ~60 minutes of repetitive test fixture construction.

**Total Time Saved**: Approximately 2.0 to 2.5 hours of mechanical typing and setup, allowing focus to shift directly to product UX polish, sticky layout mathematics, and server-side RBAC enforcement.

---

## 3. What AI-Generated Output Was Changed or Rejected

True product engineering involves rejecting AI hallucinations, sub-optimal architecture proposals, and insecure shortcuts. Key decisions to reject or heavily modify AI output included:

### A. Rejected In-Memory State Proposal
- **AI Suggestion**: AI initially suggested using an in-memory JavaScript `Map` or a mock file dictionary to store documents and collaborators quickly.
- **Engineering Decision**: **Rejected**. In-memory storage loses state across restarts, breaks under serverless cold starts, and fails to demonstrate real persistence.
- **What Was Built**: Configured Node.js's native `DatabaseSync` (`node:sqlite`) with Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) and busy timeouts (`PRAGMA busy_timeout = 5000;`). Configured automatic data directory creation in `/tmp` for seamless, zero-config deployment on Vercel.

### B. Rejected Client-Only Permission Checks
- **AI Suggestion**: AI suggested simply disabling the "Edit" button or hiding inputs on the frontend when a user is a Viewer.
- **Engineering Decision**: **Rejected**. Client-only permission checks are a major security anti-pattern. Any user could send a direct `PATCH` or `DELETE` request via curl or Postman to mutate the document.
- **What Was Built**: Implemented strict server-side RBAC validation helper `verifyDocumentAccess(docId, userId)`. Every mutation endpoint explicitly validates permissions and immediately aborts with `403 Forbidden` if a viewer or uninvited user attempts a write.

### C. Resolved SQLite Concurrency Lock in Vitest
- **AI Suggestion**: AI generated a test runner config that launched 6 parallel worker threads simultaneously writing to the same local SQLite database file.
- **Engineering Decision**: Diagnosed `SQLITE_BUSY: database is locked` errors during test runs.
- **What Was Built**: Overrode Vitest's parallelism config by setting `fileParallelism: false` in `vitest.config.ts`, ensuring serialized, thread-safe test execution while keeping tests lightning fast (350ms total run time).

### D. Overhauled Layout for Lengthy Document Scrolling
- **AI Suggestion**: AI originally used standard Tailwind `sticky top-0` inside a `min-h-screen` container. On lengthy documents, browser scrollbars caused the formatting ribbon and top header to scroll off screen.
- **Engineering Decision**: Completely re-engineered the editor layout into a fixed application shell (`fixed inset-0 overflow-hidden`) with flexbox hierarchies. The navigation header and TipTap ribbon remain anchored at the top (`flex-shrink-0`), while only the centered Google Docs paper canvas (`flex-1 min-h-0 overflow-y-auto`) scrolls.

---

## 4. Verification of Correctness, UX Quality, and Reliability

1. **Automated Unit & Integration Testing**:
   - 15 automated tests executed via Vitest (`npm test`).
   - Covered: Document access verification (owner, editor, viewer, non-collaborator), collaborator role elevation/demotion, access revocation, and markdown AST parsing.
2. **Production Build Checks**:
   - Executed `next build --webpack` with strict TypeScript validation (`tsc --noEmit`), verifying zero type errors and zero bundle warnings.
3. **Cross-User RBAC Sandbox Testing**:
   - Verified end-to-end access boundaries using the built-in User Switcher:
     - As **Kritika** (Owner): Verified editing, renaming, sharing, and attachment uploads work.
     - As **Alex** (Viewer): Verified formatting toolbar is hidden, inputs are locked, read-only alert banner appears, and API returns 403 on attempted mutations.
4. **Live Cloud Deployment Verification**:
   - Deployed and tested live on Vercel (`https://ajaia-doc-editor-zeta.vercel.app`), verifying `/api/users` and `/api/documents` initialize the database and seed data automatically.
