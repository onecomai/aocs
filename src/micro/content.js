import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';
import { micro } from './micro.js';

// --- TRENDSCOUT: scan trends, analyze engagement, draft posts ---
export const trendscout = micro(
  'trendscout',
  `You scout trends. Given a topic or niche:
- Identify what's getting engagement right now
- Explain WHY it's trending (not just what)
- Draft a post that rides the trend
Output: trend + angle + draft. Ready to review and post.`,
  tool({
    name: 'trend_brief',
    description: 'Create a trend brief with draft post',
    inputSchema: z.object({
      trend: z.string(),
      why: z.string(),
      platform: z.enum(['twitter', 'linkedin', 'reddit', 'newsletter']),
      draft: z.string(),
      hashtags: z.array(z.string()).optional()
    }),
    execute: async (d) => JSON.stringify(d)
  })
);

// --- CLIPPER: long content to short formatted pieces ---
export const clipper = micro(
  'clipper',
  `You clip long content into short pieces. Given long text or transcript:
- Find the 3-5 best standalone moments
- Format each for the target platform
- Add hook + CTA
Output: clips ready to schedule. Each one must stand alone.`,
  tool({
    name: 'clip',
    description: 'Extract a clip from long content',
    inputSchema: z.object({
      source: z.string(),
      hook: z.string(),
      body: z.string(),
      cta: z.string(),
      platform: z.enum(['twitter', 'linkedin', 'tiktok', 'shorts', 'reels']),
      estimated_length: z.string()
    }),
    execute: async (d) => JSON.stringify(d)
  })
);

// --- MONITOR: brand monitoring, mentions, sentiment ---
export const monitor = micro(
  'monitor',
  `You monitor mentions. Given a set of mentions or posts about a brand:
- Categorize: positive / negative / neutral / needs_response
- Flag anything that needs immediate action (complaints, crises)
- Summarize sentiment
Output: a monitoring report with action items.`,
  tool({
    name: 'mention_report',
    description: 'Create a brand mention report',
    inputSchema: z.object({
      period: z.string(),
      total_mentions: z.number(),
      sentiment: z.object({
        positive: z.number(),
        negative: z.number(),
        neutral: z.number()
      }),
      needs_response: z.array(z.object({
        source: z.string(),
        content: z.string(),
        urgency: z.enum(['immediate', 'today', 'this_week'])
      })),
      summary: z.string()
    }),
    execute: async (d) => JSON.stringify(d)
  })
);
