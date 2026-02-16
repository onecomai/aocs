// Activity log - in-memory for now, swap with SQLite/file for persistence
const _log = [];
const MAX_LOG = 500;

export function logActivity(agent, input, output) {
  const entry = {
    id: _log.length + 1,
    agent,
    input,
    output,
    time: new Date().toISOString()
  };
  _log.unshift(entry);
  if (_log.length > MAX_LOG) _log.pop();
  return entry;
}

export function getActivity(limit = 50) {
  return _log.slice(0, limit);
}

export function getStats() {
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = _log.filter(e => e.time.startsWith(today));
  const byAgent = {};
  for (const e of _log) {
    byAgent[e.agent] = (byAgent[e.agent] || 0) + 1;
  }
  return {
    total: _log.length,
    today: todayEntries.length,
    byAgent,
    lastActivity: _log[0]?.time || null
  };
}
