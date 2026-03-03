import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class Config {
  constructor() {
    this._cfg = {
      llm: {
        provider: 'openrouter',
        model: 'anthropic/claude-3-haiku:free',
        apiKey: process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || ''
      },
      agent: {
        maxIterations: 10,
        timeout: 30000
      }
    };
  }

  get(key) {
    const keys = key.split('.');
    let val = this._cfg;
    for (const k of keys) val = val?.[k];
    return val;
  }

  set(key, value) {
    const keys = key.split('.');
    let obj = this._cfg;
    for (const k of keys.slice(0, -1)) obj = obj[k] || (obj[k] = {});
    obj[keys.at(-1)] = value;
  }

  load(path) {
    try {
      const file = JSON.parse(readFileSync(path, 'utf-8'));
      this._cfg = { ...this._cfg, ...file };
    } catch {}
  }

  get all() {
    return this._cfg;
  }
}

export const config = new Config();
