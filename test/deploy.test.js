import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { deploy, listPlatforms, DEPLOYMENTS } from '../src/deploy.js';
import { rmSync, existsSync, readFileSync } from 'fs';

describe('Deploy functionality', () => {
  const testDir = '/tmp/aocs-test-deploy';

  before(() => {
    try { rmSync(testDir, { recursive: true }); } catch {}
  });

  after(() => {
    try { rmSync(testDir, { recursive: true }); } catch {}
  });

  it('should list all platforms', () => {
    const platforms = listPlatforms();
    assert.ok(platforms.length > 0);
    assert.ok(platforms.some(p => p.key === 'railway'));
    assert.ok(platforms.some(p => p.key === 'render'));
    assert.ok(platforms.some(p => p.key === 'docker'));
    assert.ok(platforms.some(p => p.key === 'fly'));
  });

  it('should generate Railway config', () => {
    const result = deploy('railway', testDir);
    
    assert.strictEqual(result.platform, 'Railway');
    assert.ok(existsSync(`${testDir}/railway.json`));
    
    const config = JSON.parse(readFileSync(`${testDir}/railway.json`, 'utf-8'));
    assert.strictEqual(config.name, 'aocs');
    assert.ok(config.services[0].envVars.some(v => v.key === 'OPENROUTER_API_KEY'));
  });

  it('should generate Render config', () => {
    deploy('render', testDir);
    
    assert.ok(existsSync(`${testDir}/render.yaml`));
    const config = readFileSync(`${testDir}/render.yaml`, 'utf-8');
    assert.ok(config.includes('services:'));
    assert.ok(config.includes('OPENROUTER_API_KEY'));
  });

  it('should generate Docker config', () => {
    deploy('docker', testDir);
    
    assert.ok(existsSync(`${testDir}/Dockerfile`));
    assert.ok(existsSync(`${testDir}/docker-compose.yml`));
    
    const dockerfile = readFileSync(`${testDir}/Dockerfile`, 'utf-8');
    assert.ok(dockerfile.includes('FROM node:'));
    assert.ok(dockerfile.includes('serve'));
    
    const compose = readFileSync(`${testDir}/docker-compose.yml`, 'utf-8');
    assert.ok(compose.includes('OPENROUTER_API_KEY'));
  });

  it('should generate Fly.io config', () => {
    deploy('fly', testDir);
    
    assert.ok(existsSync(`${testDir}/fly.toml`));
    assert.ok(existsSync(`${testDir}/.dockerignore`));
    
    const fly = readFileSync(`${testDir}/fly.toml`, 'utf-8');
    assert.ok(fly.includes('app = "aocs"'));
    assert.ok(fly.includes('services'));
  });

  it('should skip existing files', () => {
    // File already exists from previous test
    const result = deploy('railway', testDir);
    assert.ok(result.instructions.includes('Railway'));
  });

  it('should throw for unknown platform', () => {
    assert.throws(() => deploy('unknown'), /Unknown/);
  });

  it('should include instructions for each platform', () => {
    for (const [key, config] of Object.entries(DEPLOYMENTS)) {
      assert.ok(config.instructions.trim().length > 0, `${key} missing instructions`);
      assert.ok(config.url, `${key} missing url`);
      assert.ok(Object.keys(config.files).length > 0, `${key} missing files`);
    }
  });
});
