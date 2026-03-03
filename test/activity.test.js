import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { logActivity, getActivity, getStats } from '../src/activity.js';

describe('Activity Logging', () => {
  beforeEach(() => {
    // Clear activity log by importing fresh module state won't work with ESM
    // Instead we'll just test the functions work
  });

  it('should log an activity', () => {
    const entry = logActivity('receptionist', 'Hello', 'Hi there');
    assert.ok(entry.id);
    assert.strictEqual(entry.agent, 'receptionist');
    assert.strictEqual(entry.input, 'Hello');
    assert.strictEqual(entry.output, 'Hi there');
    assert.ok(entry.time);
  });

  it('should get activity list', () => {
    // Log a few entries
    logActivity('agent1', 'input1', 'output1');
    logActivity('agent2', 'input2', 'output2');
    
    const activities = getActivity(10);
    assert.ok(Array.isArray(activities));
    assert.ok(activities.length >= 2);
    
    // Most recent first
    if (activities.length >= 2) {
      assert.ok(activities[0].id > activities[1].id || activities[0].time >= activities[1].time);
    }
  });

  it('should respect limit parameter', () => {
    // Clear by getting current then adding more
    const initial = getActivity(1000);
    
    // Add more than limit
    for (let i = 0; i < 5; i++) {
      logActivity(`agent${i}`, `input${i}`, `output${i}`);
    }
    
    const limited = getActivity(2);
    assert.strictEqual(limited.length, 2);
  });

  it('should return stats', () => {
    const stats = getStats();
    assert.ok(typeof stats.total === 'number');
    assert.ok(typeof stats.today === 'number');
    assert.ok(typeof stats.byAgent === 'object');
    // lastActivity can be null or a string
    assert.ok(stats.lastActivity === null || typeof stats.lastActivity === 'string');
  });

  it('should track agent counts in stats', () => {
    // Log from specific agents
    logActivity('test-agent-a', 'input', 'output');
    logActivity('test-agent-b', 'input', 'output');
    logActivity('test-agent-a', 'input', 'output');
    
    const stats = getStats();
    assert.ok(stats.byAgent['test-agent-a'] >= 2);
    assert.ok(stats.byAgent['test-agent-b'] >= 1);
  });
});
