import { createServer } from 'http';
import { micros, categories } from './micro/index.js';
import { config } from './config.js';
import { logActivity, getActivity, getStats } from './activity.js';
import { dashboardHTML, widgetHTML } from './dashboard.js';

export function serve(port = 3000) {
  const agentNames = Object.keys(micros);
  const businessName = config.get('business.name') || 'AOCS';

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const path = url.pathname;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // Auth check (API only, not dashboard)
    const token = config.get('server.token');
    if (token && path.startsWith('/agent/')) {
      const auth = req.headers.authorization?.replace('Bearer ', '');
      if (auth !== token) { json(res, 401, { error: 'Unauthorized' }); return; }
    }

    // --- Dashboard (what the business owner sees) ---
    if (req.method === 'GET' && path === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(dashboardHTML(businessName, agentNames));
      return;
    }

    // --- Widget embed code ---
    if (req.method === 'GET' && path === '/widget') {
      const agent = url.searchParams.get('agent') || 'receptionist';
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<html><head><title>Widget Code</title><style>body{font-family:monospace;padding:20px;background:#f5f5f5}pre{background:#fff;padding:20px;border-radius:8px;overflow-x:auto;font-size:13px}h2{margin-bottom:10px}</style></head><body><h2>Paste this before &lt;/body&gt; on your website:</h2><pre>${widgetHTML(agent).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`);
      return;
    }

    // --- Activity log ---
    if (req.method === 'GET' && path === '/activity') {
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      json(res, 200, getActivity(limit));
      return;
    }

    // --- Stats ---
    if (req.method === 'GET' && path === '/stats') {
      json(res, 200, getStats());
      return;
    }

    // --- Health ---
    if (req.method === 'GET' && path === '/health') {
      json(res, 200, { status: 'ok', agents: agentNames.length });
      return;
    }

    // --- API catalog ---
    if (req.method === 'GET' && path === '/api') {
      const catalog = {};
      for (const [cat, info] of Object.entries(categories)) {
        catalog[cat] = info.agents.map(name => ({
          name,
          endpoint: `/agent/${name}`,
          description: micros[name].prompt.split('\n')[0]
        }));
      }
      json(res, 200, { agents: catalog, total: agentNames.length });
      return;
    }

    // --- Run agent ---
    const match = path.match(/^\/agent\/(\w+)$/);
    if (req.method === 'POST' && match) {
      const name = match[1];
      const agent = micros[name];
      if (!agent) { json(res, 404, { error: `Unknown agent: ${name}` }); return; }

      const body = await readBody(req);
      if (!body.input) { json(res, 400, { error: 'Missing "input" field' }); return; }

      try {
        const result = await agent.run(body.input);
        logActivity(name, body.input, result);
        json(res, 200, { agent: name, input: body.input, output: result });
      } catch (e) {
        json(res, 500, { agent: name, error: e.message });
      }
      return;
    }

    // --- Stream agent ---
    const streamMatch = path.match(/^\/agent\/(\w+)\/stream$/);
    if (req.method === 'POST' && streamMatch) {
      const name = streamMatch[1];
      const agent = micros[name];
      if (!agent) { json(res, 404, { error: `Unknown agent: ${name}` }); return; }

      const body = await readBody(req);
      if (!body.input) { json(res, 400, { error: 'Missing "input" field' }); return; }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      try {
        let full = '';
        for await (const chunk of agent.stream(body.input)) {
          full += chunk;
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        logActivity(name, body.input, full);
        res.write('data: [DONE]\n\n');
      } catch (e) {
        res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
      }
      res.end();
      return;
    }

    json(res, 404, { error: 'Not found' });
  });

  server.listen(port, () => {
    console.log(`\n${businessName} — ${agentNames.length} agents on http://localhost:${port}\n`);
    console.log(`  Dashboard:  http://localhost:${port}/`);
    console.log(`  Widget:     http://localhost:${port}/widget`);
    console.log(`  Activity:   http://localhost:${port}/activity`);
    console.log(`  Stats:      http://localhost:${port}/stats`);
    console.log(`  API:        http://localhost:${port}/api\n`);
  });

  return server;
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}
