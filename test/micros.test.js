import { describe, it } from 'node:test';
import assert from 'node:assert';
import { micros, listMicros, getMicro, categories } from '../src/micro/index.js';

describe('Micro-agents', () => {
  it('should list all micro-agents', () => {
    const list = listMicros();
    assert.ok(list.length >= 33);
    assert.ok(list.every(m => m.name && m.category && m.prompt));
  });

  it('should get any micro-agent by name', () => {
    for (const name of Object.keys(micros)) {
      const agent = getMicro(name);
      assert.ok(agent, `Failed to get ${name}`);
      assert.ok(agent.name, `${name} missing name`);
      assert.ok(agent.prompt, `${name} missing prompt`);
      assert.ok(agent.model, `${name} missing model`);
    }
  });

  it('should throw for unknown micro-agent', () => {
    assert.throws(() => getMicro('nonexistent'), /Unknown/);
  });

  it('should have proper categories', () => {
    const cats = Object.keys(categories);
    assert.ok(cats.includes('operators'));
    assert.ok(cats.includes('companions'));
    assert.ok(cats.includes('disruptors'));
    assert.ok(cats.includes('dev'));
    assert.ok(cats.includes('ops'));
    assert.ok(cats.includes('content'));
    assert.ok(cats.includes('bizops'));
    assert.ok(cats.includes('personal'));
  });

  it('should have operators with business functions', () => {
    const ops = categories.operators.agents;
    assert.ok(ops.includes('receptionist'));
    assert.ok(ops.includes('scheduler'));
    assert.ok(ops.includes('intake'));
    assert.ok(ops.includes('dispatcher'));
    assert.ok(ops.includes('qualifier'));
    assert.ok(ops.includes('ordertaker'));
  });

  it('should have companions with care functions', () => {
    const comps = categories.companions.agents;
    assert.ok(comps.includes('listener'));
    assert.ok(comps.includes('reminder'));
    assert.ok(comps.includes('checker'));
    assert.ok(comps.includes('storyteller'));
    assert.ok(comps.includes('caller'));
    assert.ok(comps.includes('walker'));
  });

  it('should have disruptors with business disruption functions', () => {
    const dis = categories.disruptors.agents;
    assert.ok(dis.includes('auditor'));
    assert.ok(dis.includes('proposal'));
    assert.ok(dis.includes('outreach'));
    assert.ok(dis.includes('replacer'));
    assert.ok(dis.includes('closer'));
  });

  it('should have dev agents with coordination functions', () => {
    const dev = categories.dev.agents;
    assert.ok(dev.includes('coordinator'));
    assert.ok(dev.includes('prreview'));
    assert.ok(dev.includes('nightwatch'));
    assert.ok(dev.includes('ciwatch'));
  });

  it('should have ops agents with productivity functions', () => {
    const ops = categories.ops.agents;
    assert.ok(ops.includes('incident'));
    assert.ok(ops.includes('inbox'));
    assert.ok(ops.includes('digest'));
    assert.ok(ops.includes('timeblock'));
  });

  it('should have content agents with marketing functions', () => {
    const content = categories.content.agents;
    assert.ok(content.includes('trendscout'));
    assert.ok(content.includes('clipper'));
    assert.ok(content.includes('monitor'));
  });

  it('should have bizops agents with operations functions', () => {
    const biz = categories.bizops.agents;
    assert.ok(biz.includes('onboard'));
    assert.ok(biz.includes('weeklyreport'));
    assert.ok(biz.includes('invoicer'));
  });

  it('should have personal agents with productivity functions', () => {
    const pers = categories.personal.agents;
    assert.ok(pers.includes('briefing'));
    assert.ok(pers.includes('transcriber'));
  });

  it('should have agents with appropriate prompts', () => {
    const receptionist = getMicro('receptionist');
    assert.ok(receptionist.prompt.toLowerCase().includes('receptionist'));
    
    const listener = getMicro('listener');
    assert.ok(listener.prompt.toLowerCase().includes('listen'));
    
    const auditor = getMicro('auditor');
    assert.ok(auditor.prompt.toLowerCase().includes('audit') || 
              auditor.prompt.toLowerCase().includes('waste'));
  });

  it('should have agents with or without tools', () => {
    // Some agents have tools, some don't
    const withTools = getMicro('receptionist');
    const withoutTools = getMicro('listener');
    
    // Just verify structure is valid
    assert.ok(withTools.prompt);
    assert.ok(withoutTools.prompt);
  });

  it('should have streaming capability', () => {
    const agent = getMicro('receptionist');
    assert.strictEqual(typeof agent.stream, 'function');
  });

  it('should have run capability', () => {
    const agent = getMicro('receptionist');
    assert.strictEqual(typeof agent.run, 'function');
  });
});
