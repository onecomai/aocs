import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { init } from '../src/init.js';
import { getPreset, listPresets } from '../src/presets.js';
import { rmSync, existsSync, readFileSync } from 'fs';

describe('Init functionality', () => {
  const testDir = '/tmp/aocs-test-init';

  before(() => {
    // Clean up if exists
    try { rmSync(testDir, { recursive: true }); } catch {}
  });

  after(() => {
    try { rmSync(testDir, { recursive: true }); } catch {}
  });

  it('should list all presets', () => {
    const presets = listPresets();
    assert.ok(presets.length > 0);
    assert.ok(presets.some(p => p.key === 'dental'));
    assert.ok(presets.some(p => p.key === 'hvac'));
    assert.ok(presets.every(p => p.name && p.agents && p.saves));
  });

  it('should get a preset by type', () => {
    const preset = getPreset('dental');
    assert.strictEqual(preset.name, 'Dental / Medical Office');
    assert.ok(preset.agents.length > 0);
    assert.ok(preset.replaces);
    assert.ok(preset.saves);
  });

  it('should throw for unknown preset', () => {
    assert.throws(() => getPreset('unknown'), /Unknown/);
  });

  it('should generate a project directory', () => {
    const result = init('dental', testDir);
    
    assert.ok(existsSync(result.dir));
    assert.ok(existsSync(`${result.dir}/package.json`));
    assert.ok(existsSync(`${result.dir}/server.js`));
    assert.ok(existsSync(`${result.dir}/README.md`));
    assert.ok(existsSync(`${result.dir}/.env`));
  });

  it('should generate valid package.json', () => {
    const pkg = JSON.parse(readFileSync(`${testDir}/aocs-dental/package.json`, 'utf-8'));
    assert.strictEqual(pkg.name, 'aocs-dental');
    assert.ok(pkg.scripts.start);
    assert.ok(pkg.scripts.dev);
    assert.ok(pkg.dependencies.aocs);
  });

  it('should generate valid server.js', () => {
    const server = readFileSync(`${testDir}/aocs-dental/server.js`, 'utf-8');
    assert.ok(server.includes('serve'));
    assert.ok(server.includes('OPENROUTER_API_KEY'));
    assert.ok(server.includes('Dental / Medical Office'));
  });

  it('should throw if directory exists', () => {
    init('hvac', testDir); // Create first
    assert.throws(() => init('hvac', testDir), /already exists/);
  });

  it('should include agent documentation in README', () => {
    const readme = readFileSync(`${testDir}/aocs-dental/README.md`, 'utf-8');
    assert.ok(readme.includes('receptionist'));
    assert.ok(readme.includes('curl'));
    assert.ok(readme.includes('POST'));
  });
});
