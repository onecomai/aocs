import { DatabaseSync } from 'node:sqlite';

const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : '.aocs.db';
export const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT,
    input TEXT,
    output TEXT,
    time TEXT
  );

  CREATE TABLE IF NOT EXISTS agent_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT,
    role TEXT,
    content TEXT,
    time TEXT
  );
`);
