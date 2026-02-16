import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { serve } from '../src/serve.js';
import { config } from '../src/config.js';
import { getActivity, getStats } from '../src/activity.js';

describe('HTTP Server', () => {
  let server;
  let port;

  before(() => {
    config.set('llm.apiKey', 'test-key');
    config.set('business.name', 'Test Business');
    // Find available port
    port = 3456 + Math.floor(Math.random() * 1000);
    server = serve(port);
  });

  after(() => {
    server.close();
  });

  it('should serve dashboard HTML at root', async () => {
    const res = await fetch(`http://localhost:${port}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Test Business'));
    assert.ok(html.includes('agentPicker'));
    assert.ok(html.includes('stats'));
  });

  it('should serve widget code', async () => {
    const res = await fetch(`http://localhost:${port}/widget?agent=scheduler`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('aocs-widget'));
    assert.ok(html.includes('scheduler'));
  });

  it('should return health status', async () => {
    const res = await fetch(`http://localhost:${port}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.ok(data.agents > 0);
  });

  it('should return API catalog', async () => {
    const res = await fetch(`http://localhost:${port}/api`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.agents);
    assert.ok(data.total > 0);
  });

  it('should return activity log', async () => {
    const res = await fetch(`http://localhost:${port}/activity`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
  });

  it('should return stats', async () => {
    const res = await fetch(`http://localhost:${port}/stats`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(typeof data.total === 'number');
    assert.ok(typeof data.today === 'number');
  });

  it('should 404 for unknown agent', async () => {
    const res = await fetch(`http://localhost:${port}/agent/nonexistent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'test' })
    });
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.ok(data.error.includes('Unknown'));
  });

  it('should 400 for missing input', async () => {
    const res = await fetch(`http://localhost:${port}/agent/receptionist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`http://localhost:${port}/unknown-path`);
    assert.strictEqual(res.status, 404);
  });
});
