import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';
import { micro } from './micro.js';

// --- COORDINATOR: supervises parallel coding workers ---
export const coordinator = micro(
  'coordinator',
  `You coordinate parallel coding tasks. You receive a goal and break it into independent units of work.
Output: a task list with assignments, dependencies, and verification steps.
Each task must have: what to do, how to verify it passed, and what blocks it.
You produce a checklist, not code.`,
  tool({
    name: 'task_plan',
    description: 'Create a parallelizable task plan',
    inputSchema: z.object({
      goal: z.string(),
      tasks: z.array(z.object({
        id: z.string(),
        task: z.string(),
        verify: z.string(),
        depends_on: z.array(z.string()),
        worker: z.string().optional()
      })),
      parallel_groups: z.array(z.array(z.string()))
    }),
    execute: async (d) => JSON.stringify(d)
  })
);

// --- PRREVIEW: reads diffs, flags risks ---
export const prreview = micro(
  'prreview',
  `You review pull request diffs. For each issue found, output:
- File and line
- Severity: critical / warning / nit
- What's wrong
- Suggested fix
Focus on: missing tests, security holes, logic bugs, confusing names, error handling gaps.
Skip style opinions. Only flag things that break or confuse.`,
  tool({
    name: 'review_finding',
    description: 'Log a PR review finding',
    inputSchema: z.object({
      file: z.string(),
      line: z.number(),
      severity: z.enum(['critical', 'warning', 'nit']),
      issue: z.string(),
      fix: z.string()
    }),
    execute: async (d) => JSON.stringify(d)
  })
);

// --- NIGHTWATCH: 3AM autopilot, pulls logs, proposes fix ---
export const nightwatch = micro(
  'nightwatch',
  `You are the 3AM autopilot. An alert fired. Your job:
1. Summarize what happened (from the error/log/alert)
2. Identify what changed recently that could have caused it
3. Propose a fix with specific steps
4. Output a decision memo the on-call engineer reads in the morning.
Never push fixes. Only propose. Always include rollback steps.`,
  tool({
    name: 'incident_memo',
    description: 'Create an incident decision memo',
    inputSchema: z.object({
      alert: z.string(),
      summary: z.string(),
      likely_cause: z.string(),
      proposed_fix: z.string(),
      rollback: z.string(),
      severity: z.enum(['p0', 'p1', 'p2', 'p3']),
      needs_human: z.boolean()
    }),
    execute: async (d) => JSON.stringify({ ...d, created: new Date().toISOString() })
  })
);

// --- CIWATCH: monitors builds, deps, security advisories ---
export const ciwatch = micro(
  'ciwatch',
  `You monitor CI/CD and dependencies. Given build output or dependency info:
- Flag what failed and why
- Identify deps that are outdated or have security advisories
- Say what's safe to bump and what will break
Output: a checklist of actions, each marked safe/risky/blocked.`,
  tool({
    name: 'ci_report',
    description: 'Create a CI/dependency report',
    inputSchema: z.object({
      status: z.enum(['passing', 'failing', 'degraded']),
      failures: z.array(z.object({
        what: z.string(),
        why: z.string()
      })),
      deps: z.array(z.object({
        name: z.string(),
        current: z.string(),
        latest: z.string(),
        safe: z.boolean(),
        note: z.string()
      }))
    }),
    execute: async (d) => JSON.stringify(d)
  })
);
