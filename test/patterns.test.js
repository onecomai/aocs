import { describe, it } from 'node:test';
import assert from 'node:assert';
import { patterns, listPatterns, loadPattern } from '../src/patterns/index.js';

describe('Patterns', () => {
  it('should list all patterns', () => {
    const list = listPatterns();
    assert.ok(list.length > 0);
    assert.ok(list.every(p => p.name && p.title && p.description));
  });

  it('should load a pattern by name', () => {
    const pattern = loadPattern('support');
    assert.ok(pattern.title);
    assert.ok(pattern.description);
    assert.ok(pattern.systemPrompt);
    assert.ok(Array.isArray(pattern.tools));
    assert.ok(pattern.model);
    assert.ok(pattern.maxIterations);
  });

  it('should throw for unknown pattern', () => {
    assert.throws(() => loadPattern('unknown'), /Unknown/);
  });

  it('should have all required pattern properties', () => {
    for (const [name, pattern] of Object.entries(patterns)) {
      assert.ok(pattern.title, `${name} missing title`);
      assert.ok(pattern.description, `${name} missing description`);
      assert.ok(pattern.systemPrompt, `${name} missing systemPrompt`);
      assert.ok(Array.isArray(pattern.tools), `${name} tools not array`);
      assert.ok(pattern.model, `${name} missing model`);
      assert.ok(typeof pattern.maxIterations === 'number', `${name} missing maxIterations`);
    }
  });

  it('should include support pattern with customer service tools', () => {
    const pattern = loadPattern('support');
    assert.ok(pattern.title.includes('Support') || pattern.title.includes('Customer'));
    assert.ok(pattern.tools.length >= 4);
    
    const toolNames = pattern.tools.map(t => t.function?.name || t.name).filter(Boolean);
    assert.ok(toolNames.length > 0 || pattern.tools.length > 0);
  });

  it('should include reviewer pattern with code review focus', () => {
    const pattern = loadPattern('reviewer');
    assert.ok(pattern.systemPrompt.toLowerCase().includes('review') || 
              pattern.systemPrompt.toLowerCase().includes('code'));
  });

  it('should include researcher pattern with research tools', () => {
    const pattern = loadPattern('researcher');
    assert.ok(pattern.systemPrompt.toLowerCase().includes('research') ||
              pattern.systemPrompt.toLowerCase().includes('analyst'));
  });

  it('should have proper pricing format', () => {
    for (const pattern of listPatterns()) {
      assert.ok(pattern.price);
      assert.ok(pattern.price.includes('$') || pattern.price.includes('/mo'));
    }
  });
});
