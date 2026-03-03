import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';

const lookupCustomer = tool({
  name: 'lookup_customer',
  description: 'Look up customer by email or ID',
  inputSchema: z.object({
    query: z.string().describe('Customer email or ID')
  }),
  execute: async ({ query }) => {
    // Hook: override with your DB
    return JSON.stringify({ id: query, name: 'Customer', plan: 'pro', since: '2024-01' });
  }
});

const searchKnowledge = tool({
  name: 'search_knowledge',
  description: 'Search knowledge base for answers',
  inputSchema: z.object({
    query: z.string().describe('Search query')
  }),
  execute: async ({ query }) => {
    // Hook: override with your vector DB / search
    return JSON.stringify({ results: [`Answer for: ${query}`], confidence: 0.85 });
  }
});

const createTicket = tool({
  name: 'create_ticket',
  description: 'Escalate to human support by creating a ticket',
  inputSchema: z.object({
    subject: z.string().describe('Ticket subject'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).describe('Priority level'),
    summary: z.string().describe('Conversation summary for the agent')
  }),
  execute: async ({ subject, priority, summary }) => {
    // Hook: override with your ticketing system
    return JSON.stringify({ ticket_id: `TKT-${Date.now()}`, status: 'created' });
  }
});

const sendReply = tool({
  name: 'send_reply',
  description: 'Send a reply to the customer',
  inputSchema: z.object({
    message: z.string().describe('Reply message'),
    channel: z.enum(['email', 'chat', 'sms']).describe('Reply channel')
  }),
  execute: async ({ message, channel }) => {
    // Hook: override with your messaging system
    return JSON.stringify({ sent: true, channel });
  }
});

export const support = {
  title: 'Customer Support Agent',
  description: 'AI support agent with knowledge base search, customer lookup, ticket escalation, and multi-channel replies',
  price: '$49/mo',
  model: 'anthropic/claude-3.5-haiku',
  systemPrompt: `You are a customer support agent. Your job is to help customers quickly and accurately.

Rules:
1. Always look up the customer first to personalize your response
2. Search the knowledge base before answering technical questions
3. If confidence is below 0.7 or the issue is complex, escalate to a human via ticket
4. Be concise, empathetic, and solution-oriented
5. Never make up information - if you don't know, escalate
6. Always send a reply to the customer at the end`,

  tools: [lookupCustomer, searchKnowledge, createTicket, sendReply],
  maxIterations: 8
};
