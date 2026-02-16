import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { config, Config } from '../src/config.js';
import { getPreset, listPresets, presets } from '../src/presets.js';

describe('Config', () => {
  beforeEach(() => {
    // Reset to known state
    config.set('test.key', null);
  });

  it('should get nested values', () => {
    const provider = config.get('llm.provider');
    assert.strictEqual(provider, 'openrouter');
  });

  it('should set nested values', () => {
    config.set('test.nested.value', 42);
    assert.strictEqual(config.get('test.nested.value'), 42);
  });

  it('should return all config', () => {
    const all = config.all;
    assert.ok(all.llm);
    assert.ok(all.agent);
  });

  it('should handle missing keys', () => {
    const missing = config.get('nonexistent.key.that.doesnt.exist');
    assert.strictEqual(missing, undefined);
  });

  it('should create new Config instance', () => {
    const cfg = new Config();
    assert.ok(cfg.get('llm.provider'));
    assert.ok(cfg.get('agent.maxIterations'));
  });
});

describe('Presets', () => {
  it('should list all presets', () => {
    const list = listPresets();
    assert.ok(list.length >= 10);
    
    const keys = list.map(p => p.key);
    assert.ok(keys.includes('dental'));
    assert.ok(keys.includes('hvac'));
    assert.ok(keys.includes('saas'));
  });

  it('should get preset by key', () => {
    const dental = getPreset('dental');
    assert.strictEqual(dental.name, 'Dental / Medical Office');
    assert.ok(dental.agents.length > 0);
    assert.ok(dental.description);
    assert.ok(dental.replaces);
    assert.ok(dental.saves);
  });

  it('should get hvac preset', () => {
    const hvac = getPreset('hvac');
    assert.strictEqual(hvac.name, 'HVAC / Plumbing / Field Service');
    assert.ok(hvac.agents.includes('dispatcher'));
  });

  it('should get saas preset with dev agents', () => {
    const saas = getPreset('saas');
    assert.ok(saas.agents.includes('coordinator'));
    assert.ok(saas.agents.includes('nightwatch'));
  });

  it('should throw for unknown preset', () => {
    assert.throws(() => getPreset('unknown-business'), /Unknown/);
  });

  it('should have all presets with required fields', () => {
    for (const [key, preset] of Object.entries(presets)) {
      assert.ok(preset.name, `${key} missing name`);
      assert.ok(preset.description, `${key} missing description`);
      assert.ok(Array.isArray(preset.agents), `${key} agents not array`);
      assert.ok(preset.agents.length > 0, `${key} has no agents`);
      assert.ok(preset.replaces, `${key} missing replaces`);
      assert.ok(preset.saves, `${key} missing saves`);
    }
  });

  it('should have dental preset with 5 agents', () => {
    const dental = presets.dental;
    assert.strictEqual(dental.agents.length, 5);
    assert.ok(dental.agents.includes('receptionist'));
    assert.ok(dental.agents.includes('scheduler'));
    assert.ok(dental.agents.includes('intake'));
    assert.ok(dental.agents.includes('reminder'));
    assert.ok(dental.agents.includes('checker'));
  });

  it('should have restaurant preset with 3 agents', () => {
    const restaurant = presets.restaurant;
    assert.strictEqual(restaurant.agents.length, 3);
  });

  it('should show cost savings', () => {
    for (const preset of listPresets()) {
      assert.ok(preset.saves);
      assert.ok(preset.saves.includes('$') || preset.saves.includes('isolation'));
    }
  });
});
