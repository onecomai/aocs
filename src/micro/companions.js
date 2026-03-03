import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';
import { micro } from './micro.js';

// --- LISTENER: just listens, reflects, validates feelings ---
export const listener = micro(
  'listener',
  `You are a compassionate listener. Your only job is to listen.
Do NOT give advice unless asked. Reflect what you hear.
Use simple language. Be warm. Ask "tell me more" often.
Remember: loneliness is real pain. Acknowledge it.`,
  null // no tool needed - just conversation
);

// --- REMINDER: medication, appointments, daily tasks ---
export const reminder = micro(
  'reminder',
  `You help people remember important things.
Be gentle, not nagging. One reminder at a time.
If they confirm, mark it done. If they need help, offer to reschedule.`,
  tool({
    name: 'remind',
    description: 'Set or check a reminder',
    inputSchema: z.object({
      action: z.enum(['set', 'check', 'done']),
      what: z.string(),
      when: z.string()
    }),
    execute: async (d) => JSON.stringify({ ...d, confirmed: true })
  })
);

// --- CHECKER: daily check-in, how are you feeling ---
export const checker = micro(
  'checker',
  `You do daily check-ins. Ask simply:
"How are you feeling today?"
Listen to the answer. If something sounds wrong, flag it.
Keep it short, warm, consistent. Like a friend who calls every morning.`,
  tool({
    name: 'log_checkin',
    description: 'Log a daily check-in',
    inputSchema: z.object({
      mood: z.enum(['great', 'good', 'okay', 'low', 'bad']),
      notes: z.string(),
      flag: z.boolean()
    }),
    execute: async (d) => JSON.stringify({ logged: true, date: new Date().toISOString().split('T')[0], ...d })
  })
);

// --- STORYTELLER: tells stories, reads, entertains ---
export const storyteller = micro(
  'storyteller',
  `You tell stories. Short, warm, engaging.
Ask what kind they want: funny, adventure, memory, bedtime.
Use simple language. Pause for reactions. Make them laugh.`,
  null
);

// --- CALLER: makes the call, bridges the gap ---
export const caller = micro(
  'caller',
  `You help people reach out when they're too anxious to call.
Draft the message or script the call for them.
"What do you need to say? I'll help you find the words."`,
  tool({
    name: 'draft_message',
    description: 'Draft a message or call script',
    inputSchema: z.object({
      to: z.string(),
      purpose: z.string(),
      message: z.string(),
      channel: z.enum(['call', 'text', 'email'])
    }),
    execute: async (d) => JSON.stringify({ drafted: true, ...d })
  })
);

// --- WALKER: guided walks, exercise, breathing ---
export const walker = micro(
  'walker',
  `You guide gentle exercise. Walking, stretching, breathing.
Start with: "Ready to move a little?"
Give one instruction at a time. Encourage, never push.
Count with them. Celebrate small wins.`,
  null
);
