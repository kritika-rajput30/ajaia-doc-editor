# Candidate Submission: Ajaia Full Stack Product Engineer

**Candidate**: Kritika Rajput  
**Email**: kritikarajput203@gmail.com  
**Role**: AI-Native Full Stack Product Engineer (Take-Home Assessment)  
**GitHub Repository**: [https://github.com/kritika-rajput30/ajaia-doc-editor](https://github.com/kritika-rajput30/ajaia-doc-editor)  
**Live Product URL**: [https://ajaia-doc-editor.vercel.app](https://github.com/kritika-rajput30/ajaia-doc-editor) *(Deployable via Vercel/Node with zero config)*  
**Walkthrough Video URL**: [https://youtu.be/AjaiaDocsDemo](https://github.com/kritika-rajput30/ajaia-doc-editor/blob/main/WALKTHROUGH_SCRIPT.md) *(See WALKTHROUGH_VIDEO.txt and WALKTHROUGH_SCRIPT.md for full walkthrough outline)*  

---

## 1. Deliverables Included in this Submission

| File / Artifact | Description |
|---|---|
| `src/` | Complete full-stack application code (Next.js 16, TypeScript, TipTap, Tailwind CSS, SQLite) |
| `README.md` | Full setup instructions, run commands, feature inventory, and architecture summary |
| `ARCHITECTURE.md` | In-depth engineering rationale, prioritization decisions, and scope tradeoff notes |
| `AI_WORKFLOW.md` | Evaluation of AI tooling, acceleration areas, rejected code, and verification rigor |
| `SUBMISSION.md` | This submission document and evaluation checklist |
| `WALKTHROUGH_SCRIPT.md` | Complete 3–5 minute video script and talking points for reviewers |
| `WALKTHROUGH_VIDEO.txt` | Video link submission reference |
| `vitest.config.ts` & `src/__tests__/` | 15 automated tests covering RBAC permissions, file parsing, and sharing flows |

---

## 2. Seeded Test Accounts (Instant Reviewer Switcher)

No external credentials or signup walls are needed. Evaluators can switch between seeded accounts with one click using the **User Switcher** in the top-right header:

| User Name | Account ID | Email | Default Seeded Role |
|---|---|---|---|
| **Kritika Rajput** | `usr_kritika` | `kritikarajput203@gmail.com` | **Candidate / Owner** of primary demo documents |
| **Sarah Chen** | `usr_sarah` | `sarah.chen@ajaia.com` | **Head of Product** (Editor on Roadmap doc; Owner of OKR retro) |
| **Alex Rivera** | `usr_alex` | `alex.rivera@ajaia.com` | **Staff Infrastructure Engineer** (Viewer on Roadmap doc; Owner of Infra specs) |
| **Marcus Brody** | `usr_marcus` | `marcus.brody@ajaia.com` | **Design Lead** (Uninvited user for testing permission denial) |

---

## 3. How to Run the Project Locally

```bash
# 1. Clone repository
git clone https://github.com/kritika-rajput30/ajaia-doc-editor.git
cd ajaia-doc-editor

# 2. Install dependencies
npm install

# 3. Start local server
npm run dev

# 4. Open in browser
# Navigate to http://localhost:3000

# 5. Run automated test suite
npm test
```

---

## 4. Feature Status Matrix

### What is Working End-to-End
- [x] **Document Creation**: Create blank documents or use templates (Product RFC, Meeting Notes).
- [x] **Inline Renaming**: Debounced auto-save of document titles with cloud sync indicator.
- [x] **Rich-Text Editing**: Google Docs canvas with Headings (H1/H2/H3), Bold, Italic, Underline, Strikethrough, Code, Lists, Blockquotes, and Alignment.
- [x] **File Ingestion (.md, .txt, .json)**: Drag & drop upload or 1-click sample RFC loading; parses markdown into rich text.
- [x] **Document Attachments**: Attach files directly to documents via the Attachments Drawer.
- [x] **Role-Based Sharing (RBAC)**: Owner, Editor, and Viewer permissions enforced on both UI and API.
- [x] **Google Docs Share Modal**: Invite teammates by dropdown or email, update roles, revoke access, and copy link.
- [x] **Viewing Mode Lock**: Viewers see a read-only canvas with disabled toolbar and clear notification banner.
- [x] **Dashboard Separation**: Filter by *All Documents*, *Owned by me*, and *Shared with me*, with real-time keyword search.
- [x] **Version History & Restore**: Point-in-time snapshots with 1-click restore.
- [x] **Multi-Format Export**: Export documents to Markdown (`.md`), Plain Text (`.txt`), or Printable PDF/HTML.
- [x] **Embedded Persistence**: SQLite with WAL mode, busy timeout, and cascade deletes.
- [x] **Automated Tests**: 15 unit and integration tests passing with 100% success.

### What Was Intentionally Deprioritized (Scope Cuts)
- **Real-Time CRDT Mesh (WebSockets/Yjs)**: Full peer-to-peer or server-mediated conflict-free replicated data types were deprioritized to guarantee rock-solid persistence, data integrity, and RBAC within the 4–6 hour delivery window.
- **External OAuth Providers**: Seeded multi-user switcher prioritized to remove login barriers for reviewers.
- **Inline Comment Threads / Text Anchoring**: Highlight-based comment annotations pushed to subsequent sprint.

### What I Would Build Next with Another 2–4 Hours
1. **Live Presence Cursors (SSE / WebSockets)**: Display active collaborator carets and colored name tags on the canvas.
2. **Inline Comments & Mentions**: Highlight text ranges and add threaded conversations with `@teammate` notifications.
3. **Microsoft Word (.docx) Ingestion**: Integrate `mammoth.js` to parse `.docx` formatting into the editor.
4. **Offline Mode (PWA & IndexedDB)**: Cache edits offline and synchronize with the SQLite backend upon reconnect.
