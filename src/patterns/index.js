import { support } from './support.js';
import { reviewer } from './reviewer.js';
import { researcher } from './researcher.js';
import { sales } from './sales.js';
import { pipeline } from './pipeline.js';
import { writer } from './writer.js';

export const patterns = {
  support,
  reviewer,
  researcher,
  sales,
  pipeline,
  writer
};

export function listPatterns() {
  return Object.entries(patterns).map(([key, p]) => ({
    name: key,
    title: p.title,
    description: p.description,
    price: p.price
  }));
}

export function loadPattern(name) {
  const p = patterns[name];
  if (!p) throw new Error(`Unknown pattern: ${name}. Available: ${Object.keys(patterns).join(', ')}`);
  return p;
}
