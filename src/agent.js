import { stepCountIs } from '@openrouter/sdk';
import { getClient } from './llm.js';
import { tools } from './tools.js';
import { config } from './config.js';
import { db } from './db.js';

export class Agent {
  constructor(opts = {}) {
    this.name = opts.name || 'aocs';
    this.maxIterations = opts.maxIterations || config.get('agent.maxIterations');
    this.systemPrompt = opts.systemPrompt || 'You are a helpful AI assistant.';
    this.model = opts.model || config.get('llm.model');
    this._tools = opts.tools || tools.list();
    this._history = this._loadHistory();
  }

  _loadHistory() {
    try {
      return db.prepare(
        'SELECT role, content FROM agent_history WHERE agent_name = ? ORDER BY id ASC'
      ).all(this.name).map(r => ({ role: r.role, content: r.content }));
    } catch {
      return [];
    }
  }

  _persistMessage(role, content) {
    try {
      db.prepare(
        'INSERT INTO agent_history (agent_name, role, content, time) VALUES (?, ?, ?, ?)'
      ).run(this.name, role, content, new Date().toISOString());
    } catch {}
  }

  async run(input) {
    const client = getClient();

    this._history.push({ role: 'user', content: input });
    this._persistMessage('user', input);

    const result = client.callModel({
      model: this.model,
      instructions: this.systemPrompt,
      input: [...this._history],
      tools: this._tools,
      stopWhen: [stepCountIs(this.maxIterations)]
    });

    const text = await result.getText();
    this._history.push({ role: 'assistant', content: text });
    this._persistMessage('assistant', text);
    return text;
  }

  async *streamRun(input) {
    const client = getClient();

    this._history.push({ role: 'user', content: input });
    this._persistMessage('user', input);

    const result = client.callModel({
      model: this.model,
      instructions: this.systemPrompt,
      input: [...this._history],
      tools: this._tools,
      stopWhen: [stepCountIs(this.maxIterations)]
    });

    let full = '';
    for await (const delta of result.getTextStream()) {
      full += delta;
      yield delta;
    }

    this._history.push({ role: 'assistant', content: full });
    this._persistMessage('assistant', full);
  }

  reset() {
    this._history = [];
    try {
      db.prepare('DELETE FROM agent_history WHERE agent_name = ?').run(this.name);
    } catch {}
  }

  get history() {
    return this._history;
  }

  static fromPattern(pattern) {
    return new Agent({
      name: pattern.title,
      model: pattern.model,
      systemPrompt: pattern.systemPrompt,
      tools: pattern.tools,
      maxIterations: pattern.maxIterations
    });
  }
}

export const agent = new Agent();
