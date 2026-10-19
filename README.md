# Ajaia Docs — AI-Native Collaborative Document Editor

A lightweight, high-performance collaborative document editor inspired by Google Docs, built for fast-moving teams. Engineered with Next.js (App Router), TypeScript, Tailwind CSS, TipTap (ProseMirror engine), and an embedded SQLite relational database with Write-Ahead Logging (WAL).

---

## Live Demo & Repository
- **GitHub Repository**: [https://github.com/kritika-rajput30/ajaia-doc-editor](https://github.com/kritika-rajput30/ajaia-doc-editor)
- **Live Deployment**: Ready for deployment to Vercel, Railway, or Render. (See Deployment section below)

---

## Key Features & Capabilities

### 1. Document Creation & Editing
- **Instant Creation**: Start with a blank document or pre-built productivity templates (Product Engineering RFC, Team Meeting Notes).
- **Inline Renaming**: Edit document titles directly from the header with debounce auto-saving.
- **Rich-Text Formatting**:
  - Headings (H1, H2, H3, Normal text)
  - Styling: **Bold**, *Italic*, <u>Underline</u>, ~~Strikethrough~~, `Inline Code`
  - Paragraph Alignment (Left, Center, Right, Justify)
  - Bulleted and numbered lists
  - Blockquotes and horizontal dividers
  - Clear formatting and Undo/Redo history
- **Google Docs Canvas**: Centered document paper layout with subtle shadow, margin spacing, and real-time word/character count with reading time estimation.
- **Real-Time Auto-Save**: Cloud sync with visual status indicators (*"Saving to cloud..."*, *"All changes saved"*).

### 2. Smart File Ingestion & Attachments
- **File Upload & Markdown Conversion**: Ingest `.md`, `.txt`, `.markdown`, and `.json` files.
- **Smart Parsing**: Automatically transforms markdown headings (`#`, `##`), bullet lists (`-`), numbered lists (`1.`), bold (`**`), and blockquotes (`>`) into rich-text elements upon upload.
- **1-Click Sample Ingestion**: Included built-in sample RFC loader for instant reviewer testing without needing external files.
- **Document Attachments Drawer**: Attach and associate project files directly with any document.

### 3. Role-Based Access Control (RBAC) & Sharing
- **Ownership & Permissions Model**:
  - **Owner**: Full access (Read, Edit, Rename, Share/Delegate, Delete).
  - **Editor**: Read and modify content. Cannot delete document or revoke owner.
  - **Viewer**: Read-only access. Editor controls and title inputs are locked, with a persistent *"Viewing Mode"* alert banner explaining read-only access.
- **Google Docs-Style Share Modal**:
  - Invite teammates by selecting from the team directory or entering their email.
  - Set permissions dynamically (*Editor* vs *Viewer*).
  - Manage existing collaborators (change role or revoke access).
  - Copy shareable document link with one click.
- **Dashboard Separation**: Clear categorization between *"All Documents"*, *"Owned by me"*, and *"Shared with me"*, with permission pills (*Owner*, *Can edit*, *Can view*).

### 4. Zero-Friction Test Accounts (Simulated Team Switcher)
Reviewers can switch between simulated team accounts with a single click in the top-right header:
- **Kritika Rajput** (`usr_kritika`, `kritikarajput203@gmail.com`) — *Full Stack Product Engineer (Primary)*
- **Sarah Chen** (`usr_sarah`, `sarah.chen@ajaia.com`) — *Head of Product*
- **Alex Rivera** (`usr_alex`, `alex.rivera@ajaia.com`) — *Staff Infrastructure Engineer*
- **Marcus Brody** (`usr_marcus`, `marcus.brody@ajaia.com`) — *Design Lead*

*Switching accounts instantly updates dashboard views and toggles editor permissions from Editor to Viewer in real time.*

### 5. Snapshot Version History & Recovery
- Automatic snapshot versioning on document updates.
- Inspect prior versions with timestamp, author avatar, and version number.
- One-click version restoration.

---

## Tech Stack & Architecture

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | High-performance React 19 server/client components and Route Handlers |
| **Language** | TypeScript | Strict type safety across database schemas, APIs, and UI |
| **Rich-Text Engine** | TipTap / ProseMirror | Industry standard for collaborative document models (used by Google Docs, Notion) |
| **Styling** | Tailwind CSS v4 | Clean Google Workspace typography and responsive layout |
| **Persistence** | Embedded SQLite (`DatabaseSync`) | Zero-configuration ACID database with WAL mode and foreign key cascades |
| **Testing** | Vitest | Fast automated test suite for RBAC permissions and markdown parsing |

---

## Local Setup & Run Instructions

### Prerequisites
- Node.js v20+ (tested on Node v25.8)
- npm v10+

### 1. Clone the repository
```bash
git clone https://github.com/kritika-rajput30/ajaia-doc-editor.git
cd ajaia-doc-editor
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The SQLite database in `data/ajaia-docs.sqlite` will automatically initialize with pre-seeded test documents and team members.

### 4. Build for production
```bash
npm run build
npm start
```

### 5. Run automated tests
```bash
npm test
```

---

## Automated Test Coverage

The test suite validates the core business logic, access control rules, and file ingestion pipeline:
1. `src/__tests__/document-permissions.test.ts`: Enforces RBAC permissions (Owner full rights, Editor write permissions, Viewer read-only restrictions, non-collaborator denial).
2. `src/__tests__/sharing-logic.test.ts`: Verifies collaborator invitations, permission promotions (Viewer &rarr; Editor), and access revocation.
3. `src/__tests__/file-parser.test.ts`: Verifies markdown heading hierarchy, bullet/numbered lists, inline formatting, and plain text word count calculations.

All 15 automated tests pass with 100% success.

---

## Supported File Types
- **Direct Document Ingestion**: `.md`, `.markdown`, `.txt`, `.json`
- **Document Attachments**: Images (`.png`, `.jpg`, `.svg`), PDFs (`.pdf`), text files (`.txt`), documents (`.docx`, `.csv`).

---

## Candidate Information
- **Candidate**: Kritika Rajput
- **Email**: kritikarajput203@gmail.com
- **Role**: AI-Native Full Stack Product Engineer (Ajaia LLC Take-Home Assessment)
