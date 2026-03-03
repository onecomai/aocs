import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';
import { micro } from './micro.js';

// --- INCIDENT: structured incident notes, paper trail ---
export const incident = micro(
  'incident',
  `You write incident reports. Given what happened:
Timeline, impact, root cause, resolution, follow-up actions.
Be factual. No blame. Output a document someone can paste into Confluence or Notion.`,
  tool({
    name: 'incident_report',
    description: 'Generate a structured incident report',
    inputSchema: z.object({
      title: z.string(),
      severity: z.enum(['sev1', 'sev2', 'sev3']),
      timeline: z.string(),
      impact: z.string(),
      root_cause: z.string(),
      resolution: z.string(),
      followups: z.array(z.string())
    }),
    execute: async (d) => JSON.stringify({ ...d, id: `INC-${Date.now()}` })
  })
);

// --- INBOX: categorize, draft replies, unsubscribe ---
export const inbox = micro(
  'inbox',
  `You process email. For each message:
- Categorize: urgent / action_needed / fyi / spam
- If spam: recommend unsubscribe rule
- If action needed: draft a reply (under 3 sentences)
- If FYI: one-line summary
Output a checklist the human reviews in 2 minutes.`,
  tool({
    name: 'email_action',
    description: 'Categorize and action an email',
    inputSchema: z.object({
      from: z.string(),
      subject: z.string(),
      category: z.enum(['urgent', 'action_needed', 'fyi', 'spam']),
      action: z.string(),
      draft_reply: z.string().optional(),
      rule: z.string().optional()
    }),
    execute: async (d) => JSON.stringify(d)
  })
);

// --- DIGEST: daily digest with summaries and reply drafts ---
export const digest = micro(
  'digest',
  `You create a daily digest. Given a list of inputs (emails, messages, notifications):
Group by priority. Summarize each in one line. Draft replies for anything that needs response.
Output: a single document the person reads over coffee.`,
  tool({
    name: 'daily_digest',
    description: 'Compile a daily digest',
    inputSchema: z.object({
      date: z.string(),
      urgent: z.array(z.object({ item: z.string(), action: z.string() })),
      needs_reply: z.array(z.object({ item: z.string(), draft: z.string() })),
      fyi: z.array(z.string()),
      stats: z.string().optional()
    }),
    execute: async (d) => JSON.stringify(d)
  })
);

// --- TIMEBLOCK: calendar scoring, conflict resolution, protect deep work ---
export const timeblock = micro(
  'timeblock',
  `You organize time. Given tasks and calendar:
- Score each task by urgency and importance
- Assign time blocks
- Protect at least 2 hours of uninterrupted deep work
- Flag conflicts
Output: a schedule for the day with reasoning.`,
  tool({
    name: 'schedule',
    description: 'Create a timeblocked schedule',
    inputSchema: z.object({
      date: z.string(),
      blocks: z.array(z.object({
        time: z.string(),
        task: z.string(),
        type: z.enum(['deep_work', 'meeting', 'admin', 'break']),
        priority: z.enum(['high', 'medium', 'low'])
      })),
      conflicts: z.array(z.string()),
      deep_work_hours: z.number()
    }),
    execute: async (d) => JSON.stringify(d)
  })
);
