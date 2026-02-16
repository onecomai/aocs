import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';
import { micro } from './micro.js';

// --- RECEPTIONIST: answers, routes, takes messages ---
export const receptionist = micro(
  'receptionist',
  `You are a receptionist. You answer calls and messages.
If you can answer, answer. If not, route to the right department.
Be warm, brief, professional. Never say "I'm an AI".`,
  tool({
    name: 'route',
    description: 'Route caller to a department or take a message',
    inputSchema: z.object({
      action: z.enum(['route', 'message', 'answer']),
      department: z.string().optional(),
      note: z.string()
    }),
    execute: async (d) => JSON.stringify(d)
  })
);

// --- SCHEDULER: books time, checks conflicts ---
export const scheduler = micro(
  'scheduler',
  `You are a scheduling assistant. You book appointments.
Ask for: what, when, who. Confirm the slot. Done.`,
  tool({
    name: 'book',
    description: 'Book an appointment slot',
    inputSchema: z.object({
      date: z.string(),
      time: z.string(),
      duration: z.string(),
      with_whom: z.string(),
      purpose: z.string()
    }),
    execute: async (d) => JSON.stringify({ booked: true, ...d })
  })
);

// --- INTAKE: collects info from new clients/patients ---
export const intake = micro(
  'intake',
  `You collect intake information. Ask questions one at a time.
Be patient, clear, simple. Collect: name, contact, reason for visit, urgency.
When done, save the form.`,
  tool({
    name: 'save_intake',
    description: 'Save completed intake form',
    inputSchema: z.object({
      name: z.string(),
      phone: z.string(),
      email: z.string().optional(),
      reason: z.string(),
      urgency: z.enum(['low', 'medium', 'high'])
    }),
    execute: async (d) => JSON.stringify({ saved: true, id: `INT-${Date.now()}`, ...d })
  })
);

// --- DISPATCHER: assigns jobs to available workers ---
export const dispatcher = micro(
  'dispatcher',
  `You are a dispatcher. Match incoming requests to available workers.
Consider: location, skill, availability. Assign and confirm.`,
  tool({
    name: 'dispatch',
    description: 'Assign a job to a worker',
    inputSchema: z.object({
      job: z.string(),
      worker: z.string(),
      location: z.string(),
      eta: z.string()
    }),
    execute: async (d) => JSON.stringify({ dispatched: true, ...d })
  })
);

// --- QUALIFIER: screens leads/calls before human handoff ---
export const qualifier = micro(
  'qualifier',
  `You qualify leads. Ask 3 questions max:
1. What do you need?
2. What's your budget range?
3. When do you need it?
Score and pass to sales or decline politely.`,
  tool({
    name: 'qualify',
    description: 'Score and qualify a lead',
    inputSchema: z.object({
      need: z.string(),
      budget: z.string(),
      timeline: z.string(),
      score: z.number(),
      qualified: z.boolean()
    }),
    execute: async (d) => JSON.stringify(d)
  })
);

// --- ORDER TAKER: takes orders, confirms, totals ---
export const ordertaker = micro(
  'ordertaker',
  `You take orders. List items, confirm quantities, read back the order.
Be fast, accurate, friendly. Confirm total at the end.`,
  tool({
    name: 'place_order',
    description: 'Place the confirmed order',
    inputSchema: z.object({
      items: z.string(),
      total: z.string(),
      customer: z.string(),
      notes: z.string().optional()
    }),
    execute: async (d) => JSON.stringify({ order_id: `ORD-${Date.now()}`, ...d })
  })
);
