import { stepCountIs } from '@openrouter/sdk';
import { getClient } from './llm.js';
import { tools } from './tools.js';
import { config } from './config.js';

export class Agent {
  constructor(opts = {}) {
    this.name = opts.name || 'aocs';
    this.maxIterations = opts.maxIterations || config.get('agent.maxIterations');
    this.systemPrompt = opts.systemPrompt || 'You are a helpful AI assistant.';
    this.model = opts.model || config.get('llm.model');
    this._tools = opts.tools || tools.list();
    this._history = [];
  }

  async run(input) {
    const client = getClient();

    this._history.push({ role: 'user', content: input });

    const result = client.callModel({
      model: this.model,
      instructions: this.systemPrompt,
      input: [...this._history],
      tools: this._tools,
      stopWhen: [stepCountIs(this.maxIterations)]
    });

    const text = await result.getText();
    this._history.push({ role: 'assistant', content: text });
    return text;
  }

  async *streamRun(input) {
    const client = getClient();

    this._history.push({ role: 'user', content: input });

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
  }

  reset() {
    this._history = [];
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
