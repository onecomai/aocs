import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { serve } from '../src/serve.js';
import { config } from '../src/config.js';

let server;
let port;
const TOKEN = 'serve-test-token-xyz';

before(async () => {
  config.set('llm.apiKey', 'test-key');
  config.set('business.name', 'Test Business');
  config.set('server.token', TOKEN);
  port = 3456 + Math.floor(Math.random() * 1000);
  server = await serve(port);
});

after(() => {
  server?.close();
});

function authHeaders() {
  return { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
}

describe('HTTP Server', () => {
  it('should serve dashboard HTML at root', async () => {
    const res = await fetch(`http://localhost:${port}/?token=${TOKEN}`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Test Business'));
    assert.ok(html.includes('agentPicker'));
    assert.ok(html.includes('stats'));
  });

  it('should embed token into dashboard JS', async () => {
    const res = await fetch(`http://localhost:${port}/?token=${TOKEN}`);
    const html = await res.text();
    assert.ok(html.includes(TOKEN));
  });

  it('should serve widget code', async () => {
    const res = await fetch(`http://localhost:${port}/widget?agent=scheduler&token=${TOKEN}`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('aocs-widget'));
    assert.ok(html.includes('scheduler'));
  });

  it('should return health status without auth', async () => {
    const res = await fetch(`http://localhost:${port}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.ok(data.agents > 0);
  });

  it('should return API catalog with auth', async () => {
    const res = await fetch(`http://localhost:${port}/api`, { headers: authHeaders() });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.agents);
    assert.ok(data.total > 0);
  });

  it('should reject API catalog without auth', async () => {
    const res = await fetch(`http://localhost:${port}/api`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.ok(data.error.includes('Unauthorized'));
  });

  it('should return activity log with auth', async () => {
    const res = await fetch(`http://localhost:${port}/activity`, { headers: authHeaders() });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
  });

  it('should reject activity log without auth', async () => {
    const res = await fetch(`http://localhost:${port}/activity`);
    assert.strictEqual(res.status, 401);
  });

  it('should return stats with auth', async () => {
    const res = await fetch(`http://localhost:${port}/stats`, { headers: authHeaders() });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(typeof data.total === 'number');
    assert.ok(typeof data.today === 'number');
  });

  it('should 404 for unknown agent', async () => {
    const res = await fetch(`http://localhost:${port}/agent/nonexistent`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ input: 'test' })
    });
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.ok(data.error.includes('Unknown'));
  });

  it('should 400 for missing input', async () => {
    const res = await fetch(`http://localhost:${port}/agent/receptionist`, {
      method: 'POST',
      headers: authHeaders(),
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
    const res = await fetch(`http://localhost:${port}/unknown-path?token=${TOKEN}`);
    assert.strictEqual(res.status, 404);
  });
});
