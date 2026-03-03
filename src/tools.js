import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';

export class ToolRegistry {
  constructor() {
    this._tools = new Map();
  }

  add(sdkTool) {
    this._tools.set(sdkTool.function.name, sdkTool);
    return this;
  }

  get(name) {
    return this._tools.get(name);
  }

  list() {
    return Array.from(this._tools.values());
  }

  names() {
    return Array.from(this._tools.keys());
  }

  async execute(name, args = {}) {
    const t = this._tools.get(name);
    if (!t) throw new Error(`Unknown tool: ${name}`);
    return t.function.execute(args);
  }
}

export const tools = new ToolRegistry();

// Built-in tools using SDK tool() + Zod v4
tools
  .add(tool({
    name: 'echo',
    description: 'Echo back the input text',
    inputSchema: z.object({
      text: z.string().describe('Text to echo back')
    }),
    execute: async ({ text }) => text
  }))
  .add(tool({
    name: 'datetime',
    description: 'Get current date and time',
    inputSchema: z.object({}),
    execute: async () => new Date().toISOString()
  }))
  .add(tool({
    name: 'calculator',
    description: 'Calculate a math expression',
    inputSchema: z.object({
      expr: z.string().describe('Math expression (e.g. 2+2, 10*5)')
    }),
    execute: async ({ expr }) => {
      if (!/^[-+/*().0-9 ]+$/.test(expr)) return "Error: Invalid characters in expression";
      try {
        const { runInNewContext } = await import('vm');
        return String(runInNewContext(expr, Object.create(null)));
      } catch (e) {
        return "Error evaluating expression";
      }
    }
  }));
