import { stepCountIs } from '@openrouter/sdk';
import { getClient } from '../llm.js';
import { config } from '../config.js';

// Micro-agent: 1 agent, 1 task, 1 tool. Dead simple.
export function micro(name, prompt, toolDef, opts = {}) {
  const model = opts.model || 'anthropic/claude-3.5-haiku';

  return {
    name,
    prompt,
    tool: toolDef,
    model,

    async run(input) {
      const client = getClient();
      const result = client.callModel({
        model,
        instructions: prompt,
        input,
        tools: toolDef ? [toolDef] : [],
        stopWhen: [stepCountIs(3)]
      });
      return result.getText();
    },

    async *stream(input) {
      const client = getClient();
      const result = client.callModel({
        model,
        instructions: prompt,
        input,
        tools: toolDef ? [toolDef] : [],
        stopWhen: [stepCountIs(3)]
      });
      for await (const d of result.getTextStream()) yield d;
    }
  };
}
