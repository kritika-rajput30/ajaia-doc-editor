# AI-Native Engineering Workflow Note

**Candidate**: Kritika Rajput (`kritikarajput203@gmail.com`)  
**Role**: AI-Native Full Stack Product Engineer Candidate  
**Assessment**: Ajaia Collaborative Document Editor  

---

## 1. AI Tools Utilized

During this build, I leveraged:
- **LLM Coding Assistants (Gemini / Claude)**: Used for scaffolding architectural boilerplates, designing schema invariants, and generating test cases.
- **Context-Aware Terminal & Code Generation Tools**: Used for executing repetitive tasks (component templates, type signatures, and baseline test suites).

---

## 2. Where AI Materially Sped Up Work

1. **Relational Database Schema Scaffolding**:
   - Rapidly scaffolded the SQLite tables, indices, foreign key cascades, and mock seed data representing realistic documents, version records, and collaborators.
   - Saved ~45 minutes of manual SQL scripting and fixture generation.

2. **ProseMirror / TipTap Integration**:
   - Accelerated the boilerplate setup for TipTap extensions (`StarterKit`, `Underline`, `Placeholder`, `TextAlign`) and their corresponding toolbar command bindings.
   - Enabled quick prototyping of the formatting controls (headings, lists, blockquotes).

3. **Markdown Ingestion Regex Engine**:
   - Drafted the regex parsing logic in `file-parser.ts` for translating Markdown syntax (`#`, `##`, `-`, `1.`, `**bold**`, `*italic*`) into structured ProseMirror HTML.

4. **Automated Test Generation**:
   - Generated boundary test cases for the access control matrix (`Owner` vs `Editor` vs `Viewer`) and markdown parsing.

---

## 3. What AI-Generated Output Was Changed or Rejected

As an AI-native engineer, **exercising strict technical judgment over AI output is just as important as generating it**. Several critical AI suggestions were explicitly rejected or modified:

### 1. Rejection of In-Memory / Ephemeral State
- *AI Proposal*: Initially suggested storing active documents in an in-memory JavaScript `Map` or Next.js API route global variables for speed.
- *Engineering Decision*: **Rejected.** An in-memory store fails persistence requirements across server restarts, edge function cold starts, and multi-process deployments. I insisted on an embedded SQLite database (`DatabaseSync`) configured with Write-Ahead Logging (WAL) and busy timeouts to guarantee durable ACID persistence.

### 2. Correction of Client-Side-Only Security Assumptions
- *AI Proposal*: Initially scaffolded permission checks only in the React UI components (disabling buttons when `permission === "viewer"`).
- *Engineering Decision*: **Overridden & Refactored.** Client-side checks provide UX, not security. I refactored the backend to enforce `getDocumentAccess()` in every API Route Handler (`PATCH`, `DELETE`, `POST /share`). Any unauthorized API request immediately aborts with `403 Forbidden`.

### 3. Fixing SQLite Concurrency Locking in Vitest
- *AI Issue*: Initial AI test scripts launched parallel test runners that hit `Error: database is locked` because multiple threads attempted to open the SQLite file simultaneously.
- *Engineering Decision*: Diagnosed the root cause, added `PRAGMA busy_timeout = 5000;`, and configured `fileParallelism: false` in `vitest.config.ts` to ensure serialized, clean test isolation.

### 4. Refining Next.js 16 Prerender Boundaries
- *AI Issue*: AI generated a client component using `useParams()` without a `<Suspense>` boundary, which Next.js 16 flagged as a fatal build error during static page optimization.
- *Engineering Decision*: Corrected the page structure by separating the component into `DocumentEditorContent` and wrapping it in `<React.Suspense fallback={<Loading />}>`.

---

## 4. Verification of Correctness, UX Quality, and Reliability

To ensure high engineering quality without blindly accepting AI output:

1. **Automated Vitest Test Suite**:
   - Built 15 comprehensive automated unit and integration tests covering permissions, role promotions, access revocations, and markdown parsing. All 15 tests pass deterministically.

2. **Zero-Warning Production Builds**:
   - Verified that `npm run build` succeeds with zero TypeScript errors, clean bundle outputs, and proper route prerendering.

3. **Interactive End-to-End Multi-User Testing**:
   - Leveraged the simulated user switcher to test real UX flows:
     - Logged in as **Kritika (Owner)**: Created documents, formatted headings/lists, imported files, invited Sarah Chen as Editor and Alex Rivera as Viewer.
     - Switched to **Sarah Chen (Editor)**: Verified that she can edit content and save, but cannot delete the document or alter permissions.
     - Switched to **Alex Rivera (Viewer)**: Verified that the editor enters strict read-only mode, displays the *"Viewing Mode"* alert banner, and disables toolbar actions.

4. **Edge Case Validation**:
   - Uploaded malformed file extensions to verify error boundary messaging.
   - Tested rapid document title renaming to verify debounce stability without race conditions.
