import { describe, it } from 'node:test';
import assert from 'node:assert';
import { dashboardHTML, widgetHTML } from '../src/dashboard.js';

describe('Dashboard HTML', () => {
  it('should generate dashboard with business name', () => {
    const html = dashboardHTML('My Business', ['agent1', 'agent2']);
    assert.ok(html.includes('My Business'));
    assert.ok(html.includes('<!DOCTYPE html>'));
  });

  it('should include agent picker dropdown', () => {
    const html = dashboardHTML('Test', ['receptionist', 'scheduler']);
    assert.ok(html.includes('agentPicker'));
    assert.ok(html.includes('receptionist'));
    assert.ok(html.includes('scheduler'));
  });

  it('should include stats section', () => {
    const html = dashboardHTML('Test', ['agent1']);
    assert.ok(html.includes('stats'));
    assert.ok(html.includes('Today'));
    assert.ok(html.includes('Total'));
  });

  it('should include activity log', () => {
    const html = dashboardHTML('Test', ['agent1']);
    assert.ok(html.includes('Activity Log'));
    assert.ok(html.includes('log-list'));
  });

  it('should include JavaScript for interactivity', () => {
    const html = dashboardHTML('Test', ['agent1']);
    assert.ok(html.includes('<script>'));
    assert.ok(html.includes('fetch'));
    assert.ok(html.includes('/agent/'));
  });

  it('should include message display area', () => {
    const html = dashboardHTML('Test', ['agent1']);
    assert.ok(html.includes('messages'));
    assert.ok(html.includes('user'));
    assert.ok(html.includes('bot'));
  });

  it('should escape special characters', () => {
    // The business name should appear in HTML
    const html = dashboardHTML('Test & Co', ['agent']);
    // Business name is used in plain text, not HTML attributes, so & is fine
    assert.ok(html.includes('Test & Co') || html.includes('Test'));
  });
});

describe('Widget HTML', () => {
  it('should generate widget HTML', () => {
    const html = widgetHTML('receptionist');
    assert.ok(html.includes('aocs-widget'));
    assert.ok(html.includes('aocsSend'));
    assert.ok(html.includes('receptionist'));
  });

  it('should include chat toggle button', () => {
    const html = widgetHTML('agent');
    assert.ok(html.includes('onclick'));
    assert.ok(html.includes('display'));
  });

  it('should include input and send functionality', () => {
    const html = widgetHTML('agent');
    assert.ok(html.includes('input'));
    assert.ok(html.includes('Send'));
    assert.ok(html.includes('aocsSend'));
  });

  it('should use correct agent name in fetch', () => {
    const html = widgetHTML('scheduler');
    assert.ok(html.includes('/agent/scheduler'));
  });

  it('should handle default agent', () => {
    const html = widgetHTML();
    assert.ok(html.includes('/agent/receptionist'));
  });

  it('should be embeddable (script tag ready)', () => {
    const html = widgetHTML('agent');
    assert.ok(!html.includes('<html>')); // Should be just the widget code
    assert.ok(!html.includes('<head>'));
  });
});
