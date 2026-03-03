import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const testToolsDir = join(process.cwd(), 'test-tools-tmp');

describe('BYOT Auto-loader', () => {
  before(() => {
    mkdirSync(testToolsDir, { recursive: true });
    // Write a valid SDK tool file
    writeFileSync(join(testToolsDir, 'greet.js'), `
import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';

export const greetTool = tool({
  name: 'greet',
  description: 'Greet someone by name',
  inputSchema: z.object({ name: z.string() }),
  execute: async ({ name }) => 'Hello, ' + name + '!'
});
`);
    // Write a second tool file
    writeFileSync(join(testToolsDir, 'ping.js'), `
import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';

export const pingTool = tool({
  name: 'ping',
  description: 'Ping check',
  inputSchema: z.object({}),
  execute: async () => 'pong'
});
`);
    // Write a bad file that will fail to import
    writeFileSync(join(testToolsDir, 'broken.js'), `this is not valid javascript @@##`);
  });

  after(() => {
    if (existsSync(testToolsDir)) rmSync(testToolsDir, { recursive: true });
  });

  it('should load valid tool files and return loaded tool names', async () => {
    const { loadUserTools } = await import('../src/serve.js');
    const loaded = await loadUserTools(testToolsDir);
    assert.ok(Array.isArray(loaded));
    assert.ok(loaded.includes('greet'), 'greet tool should be loaded');
    assert.ok(loaded.includes('ping'), 'ping tool should be loaded');
  });

  it('should skip broken files and not throw', async () => {
    const { loadUserTools } = await import('../src/serve.js');
    // Should not throw even with a broken JS file in the dir
    await assert.doesNotReject(() => loadUserTools(testToolsDir));
  });

  it('should register loaded tools in the ToolRegistry', async () => {
    const { loadUserTools } = await import('../src/serve.js');
    const { tools } = await import('../src/tools.js');
    await loadUserTools(testToolsDir);
    const names = tools.names();
    assert.ok(names.includes('greet'));
    assert.ok(names.includes('ping'));
  });

  it('should be able to execute a loaded tool', async () => {
    const { loadUserTools } = await import('../src/serve.js');
    const { tools } = await import('../src/tools.js');
    await loadUserTools(testToolsDir);
    const result = await tools.execute('greet', { name: 'World' });
    assert.strictEqual(result, 'Hello, World!');
  });

  it('should return empty array when tools dir does not exist', async () => {
    const { loadUserTools } = await import('../src/serve.js');
    const loaded = await loadUserTools('/nonexistent/dir/path');
    assert.deepStrictEqual(loaded, []);
  });
});
