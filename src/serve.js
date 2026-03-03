import { createServer } from 'http';
import { randomBytes } from 'crypto';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, resolve } from 'path';
import { micros, categories } from './micro/index.js';
import { config } from './config.js';
import { logActivity, getActivity, getStats } from './activity.js';
import { dashboardHTML, widgetHTML } from './dashboard.js';
import { gateway, enqueue, getQueue, getQueueItem, processNext } from './gateway.js';
import { tools } from './tools.js';

// --- BYOT: load user-defined tools from ./tools/ directory ---
export async function loadUserTools(dir = join(process.cwd(), 'tools')) {
  if (!existsSync(dir)) return [];
  const loaded = [];
  const files = (await readdir(dir)).filter(f => f.endsWith('.js'));
  for (const file of files) {
    try {
      const mod = await import(resolve(dir, file));
      for (const exp of Object.values(mod)) {
        if (exp && exp.function && exp.function.name) {
          tools.add(exp);
          loaded.push(exp.function.name);
        }
      }
    } catch (e) {
      console.warn(`[BYOT] Failed to load ${file}: ${e.message}`);
    }
  }
  if (loaded.length) console.log(`[BYOT] Loaded tools: ${loaded.join(', ')}`);
  return loaded;
}

export async function serve(port = 3000) {
  const agentNames = Object.keys(micros);
  const businessName = config.get('business.name') || 'AOCS';

  await loadUserTools();

  let token = config.get('server.token');
  if (!token) {
    token = randomBytes(16).toString('hex');
    config.set('server.token', token);
    console.log(`\n[SECURITY] Server token:    ${token}`);
  }

  let dashboardToken = config.get('dashboard.token');
  if (!dashboardToken) {
    dashboardToken = randomBytes(12).toString('hex');
    config.set('dashboard.token', dashboardToken);
    console.log(`[SECURITY] Dashboard token: ${dashboardToken}`);
  }

  let widgetToken = config.get('widget.token');
  if (!widgetToken) {
    widgetToken = randomBytes(8).toString('hex');
    config.set('widget.token', widgetToken);
    console.log(`[SECURITY] Widget token:    ${widgetToken}`);
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const path = url.pathname;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // Auth check — 3-tier token scoping
    // server token:    full access to all routes
    // dashboard token: /agent/, /agent/:name/stream, /stats, /activity, /api
    // widget token:    /agent/, /agent/:name/stream only
    const publicPaths = ['/health', '/webhook/'];
    const isPublic = publicPaths.some(p => path.startsWith(p));
    if (!isPublic) {
      const auth = req.headers.authorization?.replace('Bearer ', '');
      const queryTok = url.searchParams.get('token');
      const presented = auth || queryTok;

      const DASHBOARD_ROUTES = ['/agent/', '/stats', '/activity', '/api'];
      const WIDGET_ROUTES = ['/agent/'];

      let authorized = false;
      if (presented === token) {
        authorized = true;
      } else if (presented === dashboardToken) {
        authorized = DASHBOARD_ROUTES.some(r => path.startsWith(r));
      } else if (presented === widgetToken) {
        authorized = WIDGET_ROUTES.some(r => path.startsWith(r));
      }

      if (!authorized) {
        const status = presented ? 403 : 401;
        json(res, status, { error: presented ? 'Forbidden' : 'Unauthorized' });
        return;
      }
    }

    // --- Dashboard ---
    if (req.method === 'GET' && path === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(dashboardHTML(businessName, agentNames, dashboardToken));
      return;
    }

    // --- Widget embed code ---
    if (req.method === 'GET' && path === '/widget') {
      const agent = url.searchParams.get('agent') || 'receptionist';
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<html><head><title>Widget Code</title><style>body{font-family:monospace;padding:20px;background:#f5f5f5}pre{background:#fff;padding:20px;border-radius:8px;overflow-x:auto;font-size:13px}h2{margin-bottom:10px}</style></head><body><h2>Paste this before &lt;/body&gt; on your website:</h2><pre>${widgetHTML(agent, widgetToken).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`);
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

    // --- Health (public) ---
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

    // --- Gateway: route any task through the coordinator ---
    if (req.method === 'POST' && path === '/gateway') {
      const body = await readBody(req);
      if (!body.input) { json(res, 400, { error: 'Missing "input" field' }); return; }
      try {
        const result = await gateway.run(body.input);
        logActivity('gateway', body.input, result);
        json(res, 200, { agent: 'gateway', input: body.input, output: result });
      } catch (e) {
        json(res, 500, { agent: 'gateway', error: e.message });
      }
      return;
    }

    // --- Queue: enqueue a task ---
    if (req.method === 'POST' && path === '/queue') {
      const body = await readBody(req);
      if (!body.agent || !body.input) { json(res, 400, { error: 'Missing "agent" or "input" field' }); return; }
      const id = enqueue(body.agent, body.input, body.priority ?? 5);
      json(res, 202, { queued: true, job_id: id });
      // fire-and-forget process
      processNext().catch(() => {});
      return;
    }

    // --- Queue: get status ---
    if (req.method === 'GET' && path === '/queue') {
      json(res, 200, getQueue(parseInt(url.searchParams.get('limit')) || 50));
      return;
    }

    // --- Queue: get single item ---
    const queueItemMatch = path.match(/^\/queue\/(\d+)$/);
    if (req.method === 'GET' && queueItemMatch) {
      const item = getQueueItem(parseInt(queueItemMatch[1]));
      if (!item) { json(res, 404, { error: 'Job not found' }); return; }
      json(res, 200, item);
      return;
    }

    // --- Webhooks (public, no auth - external services call these) ---
    const webhookMatch = path.match(/^\/webhook\/(\w+)$/);
    if (req.method === 'POST' && webhookMatch) {
      const agentName = webhookMatch[1];
      if (!micros[agentName]) { json(res, 404, { error: `Unknown agent: ${agentName}` }); return; }
      const body = await readBody(req);
      const input = `Webhook event received:\n${JSON.stringify(body, null, 2)}`;
      const id = enqueue(agentName, input, 3); // webhooks are higher priority
      // fire-and-forget
      processNext().catch(() => {});
      json(res, 202, { accepted: true, job_id: id, agent: agentName });
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
    console.log(`  API:        http://localhost:${port}/api`);
    console.log(`  Gateway:    http://localhost:${port}/gateway`);
    console.log(`  Queue:      http://localhost:${port}/queue`);
    console.log(`  Webhooks:   http://localhost:${port}/webhook/:agent\n`);
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
