# 3–5 Minute Walkthrough Video Script & Talking Points

**Candidate**: Kritika Rajput  
**Role**: AI-Native Full Stack Product Engineer (Ajaia LLC)  
**Estimated Duration**: 3:30 – 4:30 minutes  

---

## Video Structure & Timeline

### 0:00 – 0:45 | Introduction & Product Overview
> *"Hi everyone, I'm Kritika Rajput. Today I'm walking you through Ajaia Docs, an AI-native collaborative document editor inspired by Google Docs that I built for this assessment.*  
>  
> *Under the 4–6 hour delivery constraint, my goal was not to build a superficial mock clone, but rather to ship a cohesive, resilient product slice covering document creation, rich-text editing, smart file ingestion, role-based sharing, and rock-solid persistence."*

**On Screen**: Show the Dashboard at `http://localhost:3000`. Point out the clean UI, the template buttons, and the document shelf.

---

### 0:45 – 1:30 | Core Editing Experience & Document Creation
> *"Let's start by creating a new document. We can start with a blank page or select one of our pre-built templates like the Product RFC.*  
>  
> *Notice our Google Docs canvas layout. We have full rich-text formatting: headings H1 through H3, bold, italics, underline, strikethrough, lists, blockquotes, and alignment.*  
>  
> *Notice our auto-save engine in the header: as I type or rename the document title, changes are automatically debounced and saved to our SQLite database with live visual feedback showing 'Saving to cloud' and 'All changes saved.' Word counts and reading times are updated in real time at the bottom."*

**On Screen**: Click "Product RFC". Edit the title. Bold a phrase, create a bullet list. Highlight the auto-save indicator transition from "Saving to cloud..." to "All changes saved."

---

### 1:30 – 2:30 | File Ingestion & Sharing / RBAC Permissions
> *"Now let's examine the file ingestion requirement. Instead of treating uploaded files as dead attachments, we built an ingestion engine. Clicking 'Import File', we can drop a Markdown or text file—or click our 1-click sample button.*  
>  
> *The engine parses markdown headers, lists, and bold text directly into our ProseMirror editor canvas as an editable document.*  
>  
> *Next, let's look at sharing. Opening our Google Docs-style Share modal, we see document ownership and collaborators. As the owner (Kritika), I can invite teammates like Sarah Chen as an Editor or Alex Rivera as a Viewer.*  
>  
> *Here's the best part: to make evaluation completely seamless, I built an instant User Switcher in the top right. If I switch to Alex Rivera (who is a Viewer), look at what happens: the editor instantly locks into viewing mode, the formatting ribbon disappears, and a clear notification banner warns that the document is read-only. Server-side APIs strictly enforce this with 403 Forbidden checks."*

**On Screen**: 
1. Open "Import File" modal & click "Load Demo RFC (.md)".
2. Open Share Modal & show invite controls.
3. Switch user from Kritika (Owner) to Alex Rivera (Viewer) using top-right avatar switcher.
4. Show the "Viewing Mode" alert banner and locked inputs.

---

### 2:30 – 3:30 | Key Implementation Decisions & Deprioritizations
> *"Let's talk engineering quality and tradeoffs.  
>  
> For persistence, I chose Node's native embedded SQLite engine configured with Write-Ahead Logging (WAL) and foreign-key cascades. It requires zero configuration, survives restarts, and provides ACID durability.  
>  
> I also built snapshot version history, allowing teams to preview past revisions and restore them with one click.  
>  
> What did I intentionally deprioritize? A full real-time CRDT mesh like Yjs across WebSockets. Implementing decentralized CRDTs within 4 hours is high-risk and prone to edge-case bugs. I chose to prioritize deterministic RBAC, rock-solid persistence, and smart file ingestion first."*

**On Screen**: Open the Version History modal and click preview on a version.

---

### 3:30 – 4:15 | AI-Native Workflow & Verification
> *"Finally, how AI supported my workflow:  
>  
> AI was immensely valuable for scaffolding boilerplate—drafting the SQLite schema, setting up TipTap extensions, and generating test fixtures, saving over an hour of repetitive setup.  
>  
> However, mature AI engineering means knowing what to reject:  
> - I rejected AI's initial proposal to use in-memory state and replaced it with WAL-backed SQLite.  
> - I overhauled client-only permission suggestions to ensure strict server-side authorization in every API route.  
> - I resolved an SQLite concurrency lock in Vitest by configuring serialized test workers.  
>  
> We have 15 automated unit and integration tests covering our RBAC matrix and markdown parsing, all passing with 100% success.*  
>  
> *Thank you for your time and for reviewing Ajaia Docs!"*

**On Screen**: Show terminal running `npm test` with all 15 tests green, and `npm run build` compiling with 0 errors.
