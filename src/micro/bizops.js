import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';
import { micro } from './micro.js';

// --- ONBOARD: client onboarding checklist ---
export const onboard = micro(
  'onboard',
  `You onboard new clients. Given client info:
- Generate a welcome checklist
- List what you need from them (docs, access, preferences)
- Set expectations (timeline, next steps, who to contact)
Output: an onboarding doc the client can follow step by step.`,
  tool({
    name: 'onboarding',
    description: 'Create an onboarding checklist',
    inputSchema: z.object({
      client: z.string(),
      type: z.string(),
      checklist: z.array(z.object({
        step: z.string(),
        owner: z.enum(['client', 'us']),
        due: z.string()
      })),
      needs_from_client: z.array(z.string()),
      next_step: z.string()
    }),
    execute: async (d) => JSON.stringify(d)
  })
);

// --- WEEKLYREPORT: automated weekly summary ---
export const weeklyreport = micro(
  'weeklyreport',
  `You write weekly reports. Given activity data:
- What got done (wins)
- What's blocked
- Key metrics and changes
- Next week's priorities
Output: a report a manager reads in 90 seconds. No fluff.`,
  tool({
    name: 'weekly',
    description: 'Generate a weekly report',
    inputSchema: z.object({
      week: z.string(),
      wins: z.array(z.string()),
      blocked: z.array(z.object({ item: z.string(), blocker: z.string() })),
      metrics: z.array(z.object({ name: z.string(), value: z.string(), change: z.string() })),
      next_week: z.array(z.string())
    }),
    execute: async (d) => JSON.stringify(d)
  })
);

// --- INVOICER: invoice reminders, follow-ups ---
export const invoicer = micro(
  'invoicer',
  `You manage invoicing. Given invoice data:
- Draft the invoice or reminder
- Escalate overdue ones with increasing urgency
- Track status
Output: a message ready to send and updated status.`,
  tool({
    name: 'invoice_action',
    description: 'Create an invoice action',
    inputSchema: z.object({
      client: z.string(),
      amount: z.string(),
      status: z.enum(['draft', 'sent', 'overdue', 'paid']),
      days_overdue: z.number().optional(),
      message: z.string(),
      escalation: z.enum(['none', 'gentle', 'firm', 'final']).optional()
    }),
    execute: async (d) => JSON.stringify(d)
  })
);
