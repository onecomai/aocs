import { db } from './db.js';

export function logActivity(agent, input, output) {
  const time = new Date().toISOString();
  const stmt = db.prepare(
    'INSERT INTO activity_log (agent, input, output, time) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(agent, input, output, time);
  return { id: Number(result.lastInsertRowid), agent, input, output, time };
}

export function getActivity(limit = 50) {
  return db.prepare(
    'SELECT * FROM activity_log ORDER BY id DESC LIMIT ?'
  ).all(limit);
}

export function getStats() {
  const today = new Date().toISOString().split('T')[0];
  const total = db.prepare('SELECT COUNT(*) as count FROM activity_log').get().count;
  const todayCount = db.prepare(
    "SELECT COUNT(*) as count FROM activity_log WHERE time LIKE ?"
  ).get(`${today}%`).count;
  const byAgentRows = db.prepare(
    'SELECT agent, COUNT(*) as count FROM activity_log GROUP BY agent'
  ).all();
  const byAgent = {};
  for (const row of byAgentRows) byAgent[row.agent] = row.count;
  const last = db.prepare('SELECT time FROM activity_log ORDER BY id DESC LIMIT 1').get();
  return {
    total,
    today: todayCount,
    byAgent,
    lastActivity: last?.time || null
  };
}
