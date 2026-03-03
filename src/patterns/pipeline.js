import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';

const readData = tool({
  name: 'read_data',
  description: 'Read data from a file (CSV, JSON, TXT)',
  inputSchema: z.object({
    path: z.string().describe('Path to data file'),
    format: z.enum(['csv', 'json', 'text']).describe('File format')
  }),
  execute: async ({ path, format }) => {
    const { readFileSync } = await import('fs');
    const pathModule = await import('path');
    try {
      const safePath = pathModule.resolve(process.cwd(), path);
      const rel = pathModule.relative(process.cwd(), safePath);
      if (rel.startsWith('..') || pathModule.isAbsolute(rel)) throw new Error('Access denied: Path outside working directory');
      const content = readFileSync(safePath, 'utf-8');
      if (format === 'csv') {
        const lines = content.split('\n').filter(Boolean);
        const headers = lines[0].split(',');
        const rows = lines.slice(1).map(l => {
          const vals = l.split(',');
          return Object.fromEntries(headers.map((h, i) => [h.trim(), vals[i]?.trim()]));
        });
        return JSON.stringify({ headers, rows: rows.slice(0, 100), total: rows.length });
      }
      return content.slice(0, 10000);
    } catch (e) {
      return `Error: ${e.message}`;
    }
  }
});

const transformData = tool({
  name: 'transform_data',
  description: 'Apply a transformation to data',
  inputSchema: z.object({
    operation: z.enum(['filter', 'map', 'aggregate', 'sort', 'deduplicate']).describe('Transform operation'),
    field: z.string().describe('Field to operate on'),
    condition: z.string().describe('Condition or expression'),
    data: z.string().describe('JSON stringified data to transform')
  }),
  execute: async ({ operation, field, condition, data }) => {
    try {
      const rows = JSON.parse(data);
      let result;
      switch (operation) {
        case 'filter':
          result = rows.filter(r => String(r[field]).includes(condition));
          break;
        case 'sort':
          result = [...rows].sort((a, b) => String(a[field]).localeCompare(String(b[field])));
          break;
        case 'deduplicate':
          const seen = new Set();
          result = rows.filter(r => { const k = r[field]; if (seen.has(k)) return false; seen.add(k); return true; });
          break;
        default:
          result = rows;
      }
      return JSON.stringify({ rows: result, count: result.length });
    } catch (e) {
      return `Error: ${e.message}`;
    }
  }
});

const writeOutput = tool({
  name: 'write_output',
  description: 'Write processed data to a file',
  inputSchema: z.object({
    path: z.string().describe('Output file path'),
    content: z.string().describe('Content to write'),
    format: z.enum(['csv', 'json', 'text']).describe('Output format')
  }),
  execute: async ({ path, content, format }) => {
    const { writeFileSync } = await import('fs');
    const pathModule = await import('path');
    try {
      const safePath = pathModule.resolve(process.cwd(), path);
      const rel = pathModule.relative(process.cwd(), safePath);
      if (rel.startsWith('..') || pathModule.isAbsolute(rel)) throw new Error('Access denied: Path outside working directory');
      writeFileSync(safePath, content, 'utf-8');
      return JSON.stringify({ written: safePath, bytes: content.length });
    } catch (e) {
      return `Error: ${e.message}`;
    }
  }
});

const analyze = tool({
  name: 'analyze',
  description: 'Compute stats on a numeric field',
  inputSchema: z.object({
    data: z.string().describe('JSON array of objects'),
    field: z.string().describe('Numeric field to analyze')
  }),
  execute: async ({ data, field }) => {
    try {
      const rows = JSON.parse(data);
      const vals = rows.map(r => parseFloat(r[field])).filter(v => !isNaN(v));
      const sum = vals.reduce((a, b) => a + b, 0);
      const mean = sum / vals.length;
      const sorted = [...vals].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      return JSON.stringify({ count: vals.length, sum, mean, median, min: sorted[0], max: sorted.at(-1) });
    } catch (e) {
      return `Error: ${e.message}`;
    }
  }
});

export const pipeline = {
  title: 'Data Pipeline Agent',
  description: 'Read, transform, analyze, and export data with AI-driven ETL decisions',
  price: '$39/mo',
  model: 'anthropic/claude-3.5-haiku',
  systemPrompt: `You are a data pipeline agent. Your job is to process data files intelligently.

Process:
1. Read the input data
2. Understand the schema and data quality
3. Apply transformations as needed (filter, sort, deduplicate, etc.)
4. Analyze key numeric fields
5. Write clean output

Rules:
- Always inspect data before transforming
- Report data quality issues (nulls, duplicates, outliers)
- Preserve original data - write to new files
- Provide a summary of what was done and why`,

  tools: [readData, transformData, writeOutput, analyze],
  maxIterations: 12
};
