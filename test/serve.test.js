import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { serve } from '../src/serve.js';
import { config } from '../src/config.js';

let server;
let port;
const SERVER_TOKEN = 'serve-test-server-token';
const DASH_TOKEN = 'serve-test-dash-token';
const WIDGET_TOKEN = 'serve-test-widget-tok';

before(async () => {
  config.set('llm.apiKey', 'test-key');
  config.set('business.name', 'Test Business');
  config.set('server.token', SERVER_TOKEN);
  config.set('dashboard.token', DASH_TOKEN);
  config.set('widget.token', WIDGET_TOKEN);
  port = 3456 + Math.floor(Math.random() * 1000);
  server = await serve(port);
});

after(() => {
  server?.close();
});

function serverHeaders() {
  return { 'Authorization': `Bearer ${SERVER_TOKEN}`, 'Content-Type': 'application/json' };
}

function dashHeaders() {
  return { 'Authorization': `Bearer ${DASH_TOKEN}`, 'Content-Type': 'application/json' };
}

function widgetHeaders() {
  return { 'Authorization': `Bearer ${WIDGET_TOKEN}`, 'Content-Type': 'application/json' };
}

describe('HTTP Server', () => {
  it('should serve dashboard HTML at root with server token', async () => {
    const res = await fetch(`http://localhost:${port}/?token=${SERVER_TOKEN}`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Test Business'));
    assert.ok(html.includes('agentPicker'));
    assert.ok(html.includes('stats'));
  });

  it('should embed dashboard token (not server token) into dashboard JS', async () => {
    const res = await fetch(`http://localhost:${port}/?token=${SERVER_TOKEN}`);
    const html = await res.text();
    assert.ok(html.includes(DASH_TOKEN), 'dashboard token should be in HTML');
    assert.ok(!html.includes(SERVER_TOKEN), 'server token must NOT be in HTML');
  });

  it('should serve widget code with widget token (not server token)', async () => {
    const res = await fetch(`http://localhost:${port}/widget?agent=scheduler&token=${SERVER_TOKEN}`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('aocs-widget'));
    assert.ok(html.includes('scheduler'));
    assert.ok(html.includes(WIDGET_TOKEN), 'widget token should be in HTML');
    assert.ok(!html.includes(SERVER_TOKEN), 'server token must NOT be in widget HTML');
  });

  it('should return health status without auth', async () => {
    const res = await fetch(`http://localhost:${port}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.ok(data.agents > 0);
  });

  it('should return API catalog with server token', async () => {
    const res = await fetch(`http://localhost:${port}/api`, { headers: serverHeaders() });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.agents);
    assert.ok(data.total > 0);
  });

  it('should return API catalog with dashboard token', async () => {
    const res = await fetch(`http://localhost:${port}/api`, { headers: dashHeaders() });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.agents);
  });

  it('should reject API catalog with widget token (403 Forbidden)', async () => {
    const res = await fetch(`http://localhost:${port}/api`, { headers: widgetHeaders() });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error.includes('Forbidden'));
  });

  it('should reject API catalog without auth (401)', async () => {
    const res = await fetch(`http://localhost:${port}/api`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.ok(data.error.includes('Unauthorized'));
  });

  it('should return activity log with dashboard token', async () => {
    const res = await fetch(`http://localhost:${port}/activity`, { headers: dashHeaders() });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
  });

  it('should reject activity log with widget token (403)', async () => {
    const res = await fetch(`http://localhost:${port}/activity`, { headers: widgetHeaders() });
    assert.strictEqual(res.status, 403);
  });

  it('should reject activity log without auth (401)', async () => {
    const res = await fetch(`http://localhost:${port}/activity`);
    assert.strictEqual(res.status, 401);
  });

  it('should return stats with dashboard token', async () => {
    const res = await fetch(`http://localhost:${port}/stats`, { headers: dashHeaders() });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(typeof data.total === 'number');
    assert.ok(typeof data.today === 'number');
  });

  it('should reject stats with widget token (403)', async () => {
    const res = await fetch(`http://localhost:${port}/stats`, { headers: widgetHeaders() });
    assert.strictEqual(res.status, 403);
  });

  it('should accept POST /agent/:name with widget token', async () => {
    // widget token is valid for agent routes — 404 because agent doesn't exist, not 401/403
    const res = await fetch(`http://localhost:${port}/agent/nonexistent`, {
      method: 'POST',
      headers: widgetHeaders(),
      body: JSON.stringify({ input: 'test' })
    });
    assert.strictEqual(res.status, 404);
  });

  it('should 404 for unknown agent', async () => {
    const res = await fetch(`http://localhost:${port}/agent/nonexistent`, {
      method: 'POST',
      headers: serverHeaders(),
      body: JSON.stringify({ input: 'test' })
    });
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.ok(data.error.includes('Unknown'));
  });

  it('should 400 for missing input', async () => {
    const res = await fetch(`http://localhost:${port}/agent/receptionist`, {
      method: 'POST',
      headers: serverHeaders(),
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('input'));
  });

  it('should handle CORS preflight', async () => {
    const res = await fetch(`http://localhost:${port}/agent/receptionist`, {
      method: 'OPTIONS'
    });
    assert.strictEqual(res.status, 204);
    assert.ok(res.headers.get('access-control-allow-origin'));
  });

  it('should 404 for unknown path', async () => {
    const res = await fetch(`http://localhost:${port}/unknown-path?token=${SERVER_TOKEN}`);
    assert.strictEqual(res.status, 404);
  });
});
