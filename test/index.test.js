import { describe, it } from 'node:test';
import assert from 'node:assert';
import { tools, ToolRegistry, config, Agent } from '../src/index.js';

describe('tools', () => {
  it('should register and execute echo', async () => {
    const result = await tools.execute('echo', { text: 'hello' });
    assert.strictEqual(result, 'hello');
  });

  it('should execute datetime', async () => {
    const result = await tools.execute('datetime');
    assert.ok(result.includes('T'));
  });

  it('should calculate', async () => {
    const result = await tools.execute('calculator', { expr: '2+2' });
    assert.strictEqual(result, 4);
  });

  it('should throw for unknown tool', async () => {
    await assert.rejects(() => tools.execute('nonexistent', {}), /Unknown tool/);
  });

  it('should list tools', () => {
    const list = tools.list();
    assert.ok(list.length >= 3);
    assert.ok(list.some(t => t.name === 'echo'));
  });
});

describe('config', () => {
  it('should get and set values', () => {
    config.set('test.value', 42);
    assert.strictEqual(config.get('test.value'), 42);
  });

  it('should return nested values', () => {
    assert.strictEqual(config.get('llm.provider'), 'openrouter');
  });
});

describe('Agent', () => {
  it('should create agent with defaults', () => {
    const a = new Agent();
    assert.strictEqual(a.maxIterations, 10);
    assert.strictEqual(a.name, 'aocs');
  });

  it('should reset history', () => {
    const a = new Agent();
    a._history = [{ role: 'user', content: 'test' }];
    a.reset();
    assert.strictEqual(a.history.length, 0);
  });
});
