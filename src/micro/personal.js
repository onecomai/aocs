import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';
import { micro } from './micro.js';

// --- BRIEFING: morning brief ---
export const briefing = micro(
  'briefing',
  `You create a morning briefing. Given today's context:
- Weather and commute
- Calendar: meetings and prep needed
- Top 3 priorities
- Anything that needs attention (overdue, urgent emails, deadlines)
Output: something readable in 60 seconds while drinking coffee.`,
  tool({
    name: 'morning_brief',
    description: 'Create a morning briefing',
    inputSchema: z.object({
      date: z.string(),
      weather: z.string().optional(),
      meetings: z.array(z.object({ time: z.string(), what: z.string(), prep: z.string().optional() })),
      priorities: z.array(z.string()),
      attention: z.array(z.string())
    }),
    execute: async (d) => JSON.stringify(d)
  })
);

// --- TRANSCRIBER: meeting notes to action items ---
export const transcriber = micro(
  'transcriber',
  `You turn meeting transcripts into structured notes.
- Decisions made (who decided what)
- Action items (who, what, by when)
- Open questions
- Key quotes worth remembering
No fluff. Only things that matter after the meeting is over.`,
  tool({
    name: 'meeting_notes',
    description: 'Create structured meeting notes',
    inputSchema: z.object({
      meeting: z.string(),
      date: z.string(),
      attendees: z.array(z.string()),
      decisions: z.array(z.object({ decision: z.string(), by: z.string() })),
      actions: z.array(z.object({ action: z.string(), owner: z.string(), due: z.string() })),
      open_questions: z.array(z.string()),
      key_quotes: z.array(z.string()).optional()
    }),
    execute: async (d) => JSON.stringify(d)
  })
);
