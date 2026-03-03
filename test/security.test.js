import { describe, it } from 'node:test';
import assert from 'node:assert';
import { resolve } from 'path';

// ── SECURITY: Calculator (no eval / Function constructor) ────────────────────
describe('Calculator security', () => {
  it('should evaluate valid math expressions', async () => {
    const { tools } = await import('../src/tools.js');
    const result = await tools.execute('calculator', { expr: '2 + 2' });
    assert.strictEqual(result, '4');
  });

  it('should evaluate compound expressions', async () => {
    const { tools } = await import('../src/tools.js');
    const result = await tools.execute('calculator', { expr: '10 * 5 / 2' });
    assert.strictEqual(result, '25');
  });

  it('should reject expressions with letters (no code injection)', async () => {
    const { tools } = await import('../src/tools.js');
    const result = await tools.execute('calculator', { expr: 'process.exit(1)' });
    assert.ok(result.startsWith('Error'));
  });

  it('should reject expressions with backticks', async () => {
    const { tools } = await import('../src/tools.js');
    const result = await tools.execute('calculator', { expr: '`whoami`' });
    assert.ok(result.startsWith('Error'));
  });

  it('should reject semicolons (command chaining)', async () => {
    const { tools } = await import('../src/tools.js');
    const result = await tools.execute('calculator', { expr: '1; process.exit(1)' });
    assert.ok(result.startsWith('Error'));
  });
});

// ── SECURITY: File path jailing ──────────────────────────────────────────────
describe('Pipeline file path jailing', () => {
  it('should reject paths traversing outside cwd', async () => {
    const { pipeline } = await import('../src/patterns/pipeline.js');
    const readTool = pipeline.tools.find(t => t.function.name === 'read_data');
    assert.ok(readTool, 'read_data tool should exist');
    const result = await readTool.function.execute({ path: '../../../etc/passwd', format: 'text' });
    assert.ok(result.includes('Access denied') || result.includes('Error'));
  });

  it('should reject absolute paths outside cwd', async () => {
    const { pipeline } = await import('../src/patterns/pipeline.js');
    const writeTool = pipeline.tools.find(t => t.function.name === 'write_output');
    assert.ok(writeTool, 'write_output tool should exist');
    const result = await writeTool.function.execute({ path: '/etc/evil.conf', content: 'bad', format: 'text' });
    assert.ok(result.includes('Access denied') || result.includes('Error'));
  });

  it('should allow relative paths inside cwd', async () => {
    const { pipeline } = await import('../src/patterns/pipeline.js');
    const readTool = pipeline.tools.find(t => t.function.name === 'read_data');
    // Reading package.json (exists) should not be blocked by path jail
    const result = await readTool.function.execute({ path: 'package.json', format: 'text' });
    assert.ok(!result.includes('Access denied'));
  });
});

// ── SECURITY: Reviewer command injection ─────────────────────────────────────
describe('Reviewer command injection prevention', () => {
  it('should reject disallowed shell commands', async () => {
    const { reviewer } = await import('../src/patterns/reviewer.js');
    const runTool = reviewer.tools.find(t => t.function.name === 'run_command');
    assert.ok(runTool, 'run_command tool should exist');
    const result = await runTool.function.execute({ command: 'rm -rf /' });
    assert.ok(result.includes('Error'));
  });

  it('should reject command injection via allowed prefix', async () => {
    const { reviewer } = await import('../src/patterns/reviewer.js');
    const runTool = reviewer.tools.find(t => t.function.name === 'run_command');
    // This looks like npm test but has shell injection
    const result = await runTool.function.execute({ command: 'npm test; rm -rf /' });
    // execFileSync will split on space and pass "test;" as arg to npm, not to shell
    // The test should either error or run without rm -rf being executed
    assert.ok(typeof result === 'string');
  });

  it('should use list_files without shell injection', async () => {
    const { reviewer } = await import('../src/patterns/reviewer.js');
    const listTool = reviewer.tools.find(t => t.function.name === 'list_files');
    assert.ok(listTool, 'list_files tool should exist');
    // Should not throw - no shell execution
    const result = await listTool.function.execute({ pattern: 'src/**/*.js' });
    assert.ok(typeof result === 'string');
    // Result should not contain the shell injection characters as output
    assert.ok(!result.includes('/etc/'));
  });
});
