import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';

const readFile = tool({
  name: 'read_file',
  description: 'Read a source code file',
  inputSchema: z.object({
    path: z.string().describe('File path to read')
  }),
  execute: async ({ path }) => {
    const { readFileSync } = await import('fs');
    try {
      return readFileSync(path, 'utf-8');
    } catch {
      return `Error: Cannot read ${path}`;
    }
  }
});

const listFiles = tool({
  name: 'list_files',
  description: 'List files matching a glob pattern',
  inputSchema: z.object({
    pattern: z.string().describe('Glob pattern like src/**/*.js')
  }),
  execute: async ({ pattern }) => {
    const { globSync } = await import('fs');
    try {
      const files = globSync(pattern, { cwd: process.cwd() });
      return files.slice(0, 50).join('\n') || 'No files found';
    } catch {
      return 'Error reading files';
    }
  }
});

const writeReview = tool({
  name: 'write_review',
  description: 'Write a structured code review',
  inputSchema: z.object({
    file: z.string().describe('File reviewed'),
    severity: z.enum(['info', 'warning', 'critical']).describe('Issue severity'),
    line: z.number().describe('Line number'),
    issue: z.string().describe('Description of the issue'),
    suggestion: z.string().describe('Suggested fix')
  }),
  execute: async ({ file, severity, line, issue, suggestion }) => {
    return JSON.stringify({ file, severity, line, issue, suggestion, reviewed: true });
  }
});

const runCommand = tool({
  name: 'run_command',
  description: 'Run a shell command (lint, test, type-check)',
  inputSchema: z.object({
    command: z.string().describe('Shell command to run')
  }),
  execute: async ({ command }) => {
    const { execFileSync } = await import('child_process');
    const allowed = ['npm test', 'npm run lint', 'npx tsc', 'npm run build', 'npx eslint'];
    if (!allowed.some(a => command.startsWith(a))) {
      return 'Error: Only lint/test/build commands allowed';
    }
    try {
      const [cmd, ...args] = command.split(' ');
      return execFileSync(cmd, args, { encoding: 'utf-8', timeout: 30000 }).slice(0, 5000);
    } catch (e) {
      return `Exit ${e.status || 1}: ${e.stderr?.slice(0, 3000) || e.message}`;
    }
  }
});

export const reviewer = {
  title: 'Code Reviewer Agent',
  description: 'Automated code review with file reading, linting, testing, and structured feedback',
  price: '$29/mo',
  model: 'anthropic/claude-sonnet-4',
  systemPrompt: `You are a senior code reviewer. Review code for:

1. Bugs and logic errors
2. Security vulnerabilities
3. Performance issues
4. Code style and readability
5. Missing error handling
6. Test coverage gaps

Process:
- Read the files to review
- Run lint and tests if available
- Write a structured review for each issue found
- Prioritize critical issues first
- Be specific with line numbers and suggestions`,

  tools: [readFile, listFiles, writeReview, runCommand],
  maxIterations: 15
};
