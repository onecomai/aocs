import { llm } from './llm.js';
import { tools } from './tools.js';
import { config } from './config.js';

export class Agent {
  constructor(opts = {}) {
    this.name = opts.name || 'aocs';
    this.maxIterations = opts.maxIterations || config.get('agent.maxIterations');
    this.timeout = opts.timeout || config.get('agent.timeout');
    this.systemPrompt = opts.systemPrompt || 'You are a helpful AI assistant.';
    this._history = [];
  }

  async run(input) {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...this._history,
      { role: 'user', content: input }
    ];

    for (let i = 0; i < this.maxIterations; i++) {
      const response = await llm.complete(messages, tools.list());

      if (!response.tool_calls?.length) {
        this._history.push({ role: 'user', content: input });
        this._history.push(response);
        return response.content;
      }

      const toolResults = [];
      for (const call of response.tool_calls) {
        const result = await tools.execute(call.function.name, 
          JSON.parse(call.function.arguments || '{}'));
        toolResults.push({
          tool_call_id: call.id,
          role: 'tool',
          content: typeof result === 'string' ? result : JSON.stringify(result)
        });
      }

      messages.push(response, ...toolResults);
    }

    return 'Max iterations reached';
  }

  async *streamRun(input) {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...this._history,
      { role: 'user', content: input }
    ];

    for (let i = 0; i < this.maxIterations; i++) {
      const response = await llm.stream(messages, tools.list());

      let fullContent = '';
      for await (const chunk of response) {
        fullContent += chunk;
        yield chunk;
      }

      const msg = { role: 'assistant', content: fullContent };

      if (!msg.tool_calls?.length) {
        this._history.push({ role: 'user', content: input });
        this._history.push(msg);
        return;
      }

      const toolResults = [];
      for (const call of msg.tool_calls) {
        const result = await tools.execute(call.function.name,
          JSON.parse(call.function.arguments || '{}'));
        toolResults.push({
          tool_call_id: call.id,
          role: 'tool',
          content: typeof result === 'string' ? result : JSON.stringify(result)
        });
      }

      messages.push(msg, ...toolResults);
    }
  }

  reset() {
    this._history = [];
  }

  get history() {
    return this._history;
  }
}

export const agent = new Agent();
