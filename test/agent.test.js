import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Agent } from '../src/agent.js';
import { config } from '../src/config.js';

describe('Agent functionality', () => {
  beforeEach(() => {
    config.set('llm.apiKey', 'test-key-for-coverage');
  });

  it('should create agent with custom options', () => {
    const agent = new Agent({
      name: 'custom-agent',
      maxIterations: 5,
      systemPrompt: 'Custom prompt',
      model: 'test-model'
    });
    
    assert.strictEqual(agent.name, 'custom-agent');
    assert.strictEqual(agent.maxIterations, 5);
    assert.strictEqual(agent.systemPrompt, 'Custom prompt');
    assert.strictEqual(agent.model, 'test-model');
  });

  it('should use defaults when options not provided', () => {
    const agent = new Agent();
    
    assert.strictEqual(agent.name, 'aocs');
    assert.strictEqual(agent.maxIterations, 10); // Default from config
    assert.strictEqual(agent.systemPrompt, 'You are a helpful AI assistant.');
  });

  it('should track history', () => {
    const agent = new Agent();
    assert.deepStrictEqual(agent.history, []);
    
    // Manually add to history for testing
    agent._history.push({ role: 'user', content: 'test' });
    assert.strictEqual(agent.history.length, 1);
  });

  it('should reset history', () => {
    const agent = new Agent();
    agent._history.push({ role: 'user', content: 'test' });
    assert.strictEqual(agent.history.length, 1);
    
    agent.reset();
    assert.strictEqual(agent.history.length, 0);
  });

  it('should create agent from pattern', () => {
    const mockPattern = {
      title: 'Test Pattern',
      model: 'test-model',
      systemPrompt: 'Test prompt',
      tools: [],
      maxIterations: 5
    };
    
    const agent = Agent.fromPattern(mockPattern);
    
    assert.strictEqual(agent.name, 'Test Pattern');
    assert.strictEqual(agent.model, 'test-model');
    assert.strictEqual(agent.systemPrompt, 'Test prompt');
    assert.strictEqual(agent.maxIterations, 5);
    assert.deepStrictEqual(agent._tools, []);
  });

  it('should set custom tools', () => {
    const agent = new Agent({ tools: ['tool1', 'tool2'] });
    assert.deepStrictEqual(agent._tools, ['tool1', 'tool2']);
  });

  // Note: run() and streamRun() require actual LLM connection
  // Skipping those tests as they need network/API key
});
