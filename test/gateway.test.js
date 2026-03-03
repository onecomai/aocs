import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { config } from '../src/config.js';
import { serve } from '../src/serve.js';
import { enqueue, getQueue, getQueueItem, processNext, createGateway, GATEWAY_PROMPT } from '../src/gateway.js';

let server;
let port;
const TOKEN = 'gw-test-token-fixed';

function h() {
  return { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
}

before(async () => {
  config.set('llm.apiKey', 'test-key');
  config.set('server.token', TOKEN);
  config.set('dashboard.token', 'gw-test-dash-token');
  config.set('widget.token', 'gw-test-widget-tok');
  port = 4200 + Math.floor(Math.random() * 800);
  server = await serve(port);
});

after(() => server?.close());

describe('Gateway & Queue', () => {
  it('should enqueue a job and return a numeric id', () => {
    const id = enqueue('receptionist', 'Hello there', 5);
    assert.ok(typeof id === 'number');
    assert.ok(id > 0);
  });

  it('should retrieve a queued job by id', () => {
    const id = enqueue('scheduler', 'Book a meeting', 3);
    const item = getQueueItem(id);
    assert.ok(item);
    assert.strictEqual(item.agent, 'scheduler');
    assert.strictEqual(item.input, 'Book a meeting');
    assert.strictEqual(item.status, 'pending');
    assert.strictEqual(item.priority, 3);
  });

  it('should list queued jobs', () => {
    enqueue('nightwatch', 'Check errors', 2);
    const queue = getQueue(100);
    assert.ok(Array.isArray(queue));
    assert.ok(queue.length > 0);
    const found = queue.find(j => j.agent === 'nightwatch' && j.input === 'Check errors');
    assert.ok(found);
  });

  it('should order queue by priority then id', () => {
    enqueue('ciwatch', 'low priority task', 10);
    enqueue('ciwatch', 'high priority task', 1);
    const queue = getQueue(100);
    const pendingCiwatch = queue.filter(j => j.agent === 'ciwatch' && j.status === 'pending');
    if (pendingCiwatch.length >= 2) {
      const highIdx = pendingCiwatch.findIndex(j => j.input === 'high priority task');
      const lowIdx = pendingCiwatch.findIndex(j => j.input === 'low priority task');
      assert.ok(highIdx < lowIdx, 'High priority tasks should come before low priority tasks');
    }
  });

  it('should mark unknown agent as failed when processing', async () => {
    const id = enqueue('does-not-exist', 'test input', 1);
    // Drain queue until our specific job is processed
    let item = getQueueItem(id);
    let attempts = 0;
    while (item.status === 'pending' && attempts < 20) {
      await processNext();
      item = getQueueItem(id);
      attempts++;
    }
    assert.strictEqual(item.status, 'failed');
    assert.ok(item.error.includes('Unknown agent'));
  });

  it('should expose correct gateway prompt', () => {
    assert.ok(GATEWAY_PROMPT.includes('Gateway Coordinator'));
    assert.ok(GATEWAY_PROMPT.includes('handoff'));
    assert.ok(GATEWAY_PROMPT.includes('route_to_agent'));
  });

  it('should create a gateway with run and stream methods', () => {
    const gw = createGateway();
    assert.ok(typeof gw.run === 'function');
    assert.ok(typeof gw.stream === 'function');
    assert.strictEqual(gw.name, 'gateway');
  });
});

describe('Gateway HTTP routes', () => {
  it('should reject POST /queue without auth', async () => {
    const res = await fetch(`http://localhost:${port}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: 'receptionist', input: 'hello' })
    });
    assert.strictEqual(res.status, 401);
  });

  it('should accept POST /queue with auth and return job_id', async () => {
    const res = await fetch(`http://localhost:${port}/queue`, {
      method: 'POST',
      headers: h(),
      body: JSON.stringify({ agent: 'receptionist', input: 'Hello from queue', priority: 5 })
    });
    assert.strictEqual(res.status, 202);
    const data = await res.json();
    assert.ok(data.queued);
    assert.ok(typeof data.job_id === 'number');
  });

  it('should GET /queue and return array with auth', async () => {
    const res = await fetch(`http://localhost:${port}/queue`, { headers: h() });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
  });

  it('should GET /queue/:id for a specific job', async () => {
    const enqueueRes = await fetch(`http://localhost:${port}/queue`, {
      method: 'POST',
      headers: h(),
      body: JSON.stringify({ agent: 'scheduler', input: 'book a slot' })
    });
    const { job_id } = await enqueueRes.json();
    const res = await fetch(`http://localhost:${port}/queue/${job_id}`, { headers: h() });
    assert.strictEqual(res.status, 200);
    const job = await res.json();
    assert.strictEqual(job.id, job_id);
    assert.strictEqual(job.agent, 'scheduler');
  });

  it('should GET /queue/:id return 404 for unknown job', async () => {
    const res = await fetch(`http://localhost:${port}/queue/9999999`, { headers: h() });
    assert.strictEqual(res.status, 404);
  });

  it('should accept webhook without auth and enqueue job', async () => {
    const res = await fetch(`http://localhost:${port}/webhook/nightwatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'github', event: 'push', ref: 'refs/heads/main' })
    });
    assert.strictEqual(res.status, 202);
    const data = await res.json();
    assert.ok(data.accepted);
    assert.ok(typeof data.job_id === 'number');
    assert.strictEqual(data.agent, 'nightwatch');
  });

  it('should return 404 for webhook to unknown agent', async () => {
    const res = await fetch(`http://localhost:${port}/webhook/fakeagent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'test' })
    });
    assert.strictEqual(res.status, 404);
  });
});
