import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';
import { micro } from './micro.js';

// --- AUDITOR: finds what's broken in a company's process ---
export const auditor = micro(
  'auditor',
  `You audit business processes. Find the waste.
Ask: "Walk me through how you handle X."
Spot: manual steps that should be automated, bottlenecks, 
handoffs that lose info, things that take days but should take minutes.
Output one clear finding at a time.`,
  tool({
    name: 'finding',
    description: 'Log an audit finding',
    inputSchema: z.object({
      process: z.string(),
      waste: z.string(),
      hours_wasted: z.number(),
      fix: z.string()
    }),
    execute: async (d) => JSON.stringify({ ...d, logged: true })
  })
);

// --- PROPOSAL: turns audit findings into a sell ---
export const proposal = micro(
  'proposal',
  `You write proposals. Short, sharp, money-focused.
Structure: Problem (their pain) → Cost (what it costs them now) → 
Fix (what you replace) → Price (your price) → ROI (their savings).
One page max. No fluff.`,
  tool({
    name: 'write_proposal',
    description: 'Generate a proposal document',
    inputSchema: z.object({
      client: z.string(),
      problem: z.string(),
      current_cost: z.string(),
      solution: z.string(),
      price: z.string(),
      roi: z.string()
    }),
    execute: async (d) => JSON.stringify({ proposal_id: `PROP-${Date.now()}`, ...d })
  })
);

// --- OUTREACH: cold message that lands ---
export const outreach = micro(
  'outreach',
  `You write cold outreach. One message. Must land.
Rules: Lead with THEIR problem, not your product.
Under 80 words. One question at the end.
No "I hope this finds you well." No "I'd love to." No fluff.`,
  tool({
    name: 'send',
    description: 'Queue an outreach message',
    inputSchema: z.object({
      to: z.string(),
      channel: z.enum(['email', 'linkedin', 'twitter']),
      message: z.string()
    }),
    execute: async (d) => JSON.stringify({ queued: true, ...d })
  })
);

// --- REPLACER: shows exactly which roles an agent replaces ---
export const replacer = micro(
  'replacer',
  `You map human roles to agent replacements.
For each role: what they do, hours per week, cost per year,
which micro-agent replaces them, savings.
Be honest - some roles can't be replaced yet. Say so.`,
  tool({
    name: 'map_role',
    description: 'Map a human role to agent replacement',
    inputSchema: z.object({
      role: z.string(),
      tasks: z.string(),
      hours_week: z.number(),
      annual_cost: z.string(),
      agent: z.string(),
      savings: z.string(),
      replaceable: z.boolean()
    }),
    execute: async (d) => JSON.stringify(d)
  })
);

// --- CLOSER: handles objections, closes the deal ---
export const closer = micro(
  'closer',
  `You close deals. When they hesitate, find the real objection.
"What's holding you back?" Then address it directly.
Never be pushy. Be clear about what happens if they don't act.
Ask for the yes.`,
  tool({
    name: 'close',
    description: 'Log deal outcome',
    inputSchema: z.object({
      client: z.string(),
      outcome: z.enum(['closed', 'follow_up', 'lost']),
      value: z.string(),
      next_step: z.string()
    }),
    execute: async (d) => JSON.stringify(d)
  })
);
