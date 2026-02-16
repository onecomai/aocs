import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';

const lookupLead = tool({
  name: 'lookup_lead',
  description: 'Look up lead/prospect information',
  inputSchema: z.object({
    query: z.string().describe('Company name, domain, or email')
  }),
  execute: async ({ query }) => {
    // Hook: override with your CRM (HubSpot, Salesforce, etc.)
    return JSON.stringify({
      company: query, industry: 'Tech', size: '50-200',
      contacts: [{ name: 'Decision Maker', role: 'CTO', email: 'cto@example.com' }]
    });
  }
});

const enrichCompany = tool({
  name: 'enrich_company',
  description: 'Get company intel - funding, tech stack, recent news',
  inputSchema: z.object({
    domain: z.string().describe('Company domain')
  }),
  execute: async ({ domain }) => {
    // Hook: override with enrichment API (Clearbit, Apollo, etc.)
    return JSON.stringify({
      domain, funding: 'Series B', techStack: ['React', 'Node.js', 'AWS'],
      recentNews: 'Placeholder - wire enrichment API'
    });
  }
});

const draftOutreach = tool({
  name: 'draft_outreach',
  description: 'Draft a personalized outreach message',
  inputSchema: z.object({
    to: z.string().describe('Recipient name'),
    role: z.string().describe('Their role'),
    company: z.string().describe('Their company'),
    angle: z.string().describe('Personalization angle'),
    channel: z.enum(['email', 'linkedin', 'twitter']).describe('Outreach channel'),
    message: z.string().describe('The drafted message')
  }),
  execute: async (draft) => {
    return JSON.stringify({ ...draft, drafted: true, id: `OUT-${Date.now()}` });
  }
});

const scoreOpportunity = tool({
  name: 'score_opportunity',
  description: 'Score a sales opportunity',
  inputSchema: z.object({
    company: z.string().describe('Company name'),
    signals: z.array(z.string()).describe('Buying signals observed'),
    score: z.number().describe('Score 1-100'),
    reasoning: z.string().describe('Why this score')
  }),
  execute: async (opp) => {
    return JSON.stringify({ ...opp, scored: true });
  }
});

export const sales = {
  title: 'Sales Outreach Agent',
  description: 'Lead enrichment, company intel, personalized outreach drafting, and opportunity scoring',
  price: '$59/mo',
  model: 'anthropic/claude-3.5-haiku',
  systemPrompt: `You are a sales development agent. Your job is to research prospects and craft personalized outreach.

Process:
1. Look up the lead/company
2. Enrich with company intel (funding, tech stack, news)
3. Identify personalization angles (recent news, shared connections, pain points)
4. Score the opportunity
5. Draft outreach tailored to the channel

Rules:
- Never be spammy or generic
- Reference specific company details
- Keep emails under 150 words
- LinkedIn messages under 100 words
- Lead with value, not pitch
- Always include a clear, low-friction CTA`,

  tools: [lookupLead, enrichCompany, draftOutreach, scoreOpportunity],
  maxIterations: 10
};
