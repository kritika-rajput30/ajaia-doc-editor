import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

let dbInstance: DatabaseSync | null = null;

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  role: string;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  plain_text: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_archived: number;
}

export interface Collaborator {
  id: string;
  document_id: string;
  user_id: string;
  permission: "editor" | "viewer";
  created_at: string;
}

export interface Attachment {
  id: string;
  document_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_content_base64?: string;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  title: string;
  content: string;
  created_by: string;
  version_number: number;
  created_at: string;
}

export function getDatabase(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = process.env.DATABASE_PATH || path.join(dataDir, "ajaia-docs.sqlite");
  const db = new DatabaseSync(dbPath);

  // Set busy timeout and WAL mode for concurrent access
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatar_url TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Member',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      plain_text TEXT NOT NULL DEFAULT '',
      owner_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      is_archived INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collaborators (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      permission TEXT NOT NULL CHECK(permission IN ('editor', 'viewer')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(document_id, user_id),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_content_base64 TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_versions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_by TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  seedInitialData(db);

  dbInstance = db;
  return dbInstance;
}

function seedInitialData(db: DatabaseSync) {
  const userCount = (
    db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }
  ).count;

  if (userCount === 0) {
    const seedUsers: User[] = [
      {
        id: "usr_kritika",
        name: "Kritika Rajput",
        email: "kritikarajput203@gmail.com",
        avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        role: "Full Stack Product Engineer",
        created_at: new Date().toISOString(),
      },
      {
        id: "usr_sarah",
        name: "Sarah Chen",
        email: "sarah.chen@ajaia.com",
        avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        role: "Head of Product",
        created_at: new Date().toISOString(),
      },
      {
        id: "usr_alex",
        name: "Alex Rivera",
        email: "alex.rivera@ajaia.com",
        avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        role: "Staff Infrastructure Engineer",
        created_at: new Date().toISOString(),
      },
      {
        id: "usr_marcus",
        name: "Marcus Brody",
        email: "marcus.brody@ajaia.com",
        avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        role: "Design Lead",
        created_at: new Date().toISOString(),
      },
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, avatar_url, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const u of seedUsers) {
      insertUser.run(u.id, u.name, u.email, u.avatar_url, u.role, u.created_at);
    }

    const insertDoc = db.prepare(`
      INSERT INTO documents (id, title, content, plain_text, owner_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertCollab = db.prepare(`
      INSERT INTO collaborators (id, document_id, user_id, permission, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertVersion = db.prepare(`
      INSERT INTO document_versions (id, document_id, title, content, created_by, version_number, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();

    // Document 1: Owned by Kritika, shared with Sarah (Editor) & Alex (Viewer)
    const doc1Content = `
      <h1>Ajaia Product Roadmap & Architecture Strategy</h1>
      <p>Welcome to the collaborative strategy document for <strong>Ajaia's next-generation workspace tools</strong>. Our mission is to accelerate team workflows through AI-native interfaces.</p>
      <h2>Core Engineering Objectives</h2>
      <ul>
        <li><strong>Ultra-low latency rich-text editing</strong>: Sub-10ms keystroke dispatch with zero input lag.</li>
        <li><strong>Flexible file ingestion</strong>: Seamless parsing of Markdown, plain text, and structured imports.</li>
        <li><strong>Fine-grained permission model</strong>: Transparent ownership, editor capabilities, and viewer read-only sandboxes.</li>
      </ul>
      <h2>Key Architectural Milestones</h2>
      <ol>
        <li>Milestone 1: Resilient SQLite storage engine with instant schema migrations.</li>
        <li>Milestone 2: Modular ProseMirror / TipTap formatting ribbon with keyboard shortcuts.</li>
        <li>Milestone 3: Live presence simulation and collaborator role elevation.</li>
      </ol>
      <blockquote>"Prioritize depth in critical product workflows over broad, shallow implementations." — Engineering Principles</blockquote>
    `;

    insertDoc.run(
      "doc_roadmap",
      "Ajaia Product Roadmap & Architecture Strategy",
      doc1Content,
      "Welcome to the collaborative strategy document for Ajaia's next-generation workspace tools...",
      "usr_kritika",
      now,
      now
    );

    insertCollab.run("col_1", "doc_roadmap", "usr_sarah", "editor", now);
    insertCollab.run("col_2", "doc_roadmap", "usr_alex", "viewer", now);
    insertVersion.run("ver_1", "doc_roadmap", "Ajaia Product Roadmap & Architecture Strategy", doc1Content, "usr_kritika", 1, now);

    // Document 2: Owned by Alex Rivera, shared with Kritika (Editor)
    const doc2Content = `
      <h1>AI Collaboration Infrastructure Specs</h1>
      <p>This technical specification outlines the infrastructure supporting our <em>real-time collaborative editing surface</em>.</p>
      <h2>Storage & Durability Tier</h2>
      <p>We utilize an embedded relational SQLite store configured in WAL (Write-Ahead Logging) mode to guarantee durability without operational overhead.</p>
      <h2>Access Control Matrix</h2>
      <ul>
        <li><strong>Owner</strong>: Full read, write, title renaming, permission delegation, and deletion.</li>
        <li><strong>Editor</strong>: Read and content modification rights. Cannot delete document or revoke owner.</li>
        <li><strong>Viewer</strong>: Strict read-only mode with disabled toolbar actions and save lock.</li>
      </ul>
    `;

    insertDoc.run(
      "doc_infra",
      "AI Collaboration Infrastructure Specs",
      doc2Content,
      "This technical specification outlines the infrastructure supporting our real-time collaborative editing surface...",
      "usr_alex",
      now,
      now
    );

    insertCollab.run("col_3", "doc_infra", "usr_kritika", "editor", now);
    insertVersion.run("ver_2", "doc_infra", "AI Collaboration Infrastructure Specs", doc2Content, "usr_alex", 1, now);

    // Document 3: Owned by Sarah Chen, shared with Kritika (Viewer)
    const doc3Content = `
      <h1>Q3 Engineering Retrospective & Team OKRs</h1>
      <p>Review of our product delivery velocity and team metrics across Q3.</p>
      <h2>Highlights</h2>
      <ul>
        <li>Delivered candidate evaluation tooling on schedule.</li>
        <li>Reduced document cold-start load time by 45%.</li>
        <li>Introduced Markdown drag-and-drop file imports.</li>
      </ul>
      <h2>Areas for Improvement</h2>
      <p>Streamline test coverage and provide interactive multi-user previews during code reviews.</p>
    `;

    insertDoc.run(
      "doc_retro",
      "Q3 Engineering Retrospective & Team OKRs",
      doc3Content,
      "Review of our product delivery velocity and team metrics across Q3...",
      "usr_sarah",
      now,
      now
    );

    insertCollab.run("col_4", "doc_retro", "usr_kritika", "viewer", now);
    insertVersion.run("ver_3", "doc_retro", "Q3 Engineering Retrospective & Team OKRs", doc3Content, "usr_sarah", 1, now);
  }
}
