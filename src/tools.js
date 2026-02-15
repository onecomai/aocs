export class ToolRegistry {
  constructor() {
    this._tools = new Map();
  }

  register(name, fn, description = '', parameters = {}) {
    if (typeof fn !== 'function') {
      throw new Error(`Tool "${name}" must be a function`);
    }
    this._tools.set(name, { name, fn, description, parameters });
    return this;
  }

  get(name) {
    return this._tools.get(name);
  }

  list() {
    return Array.from(this._tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }));
  }

  async execute(name, args = {}) {
    const tool = this._tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    try {
      return await tool.fn(args);
    } catch (err) {
      return { error: err.message };
    }
  }
}

export const tools = new ToolRegistry();

tools.register('echo', (args) => args.text, 'Echo back the input')
  .register('datetime', () => new Date().toISOString(), 'Get current datetime')
  .register('calculator', ({ expr }) => {
    const safe = expr.replace(/[^0-9+\-*/.() ]/g, '');
    return Function(`"use strict"; return (${safe})`)();
  }, 'Calculate math expression', { expr: { type: 'string', description: 'Math expression' } });
