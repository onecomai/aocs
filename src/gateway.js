import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';
import { stepCountIs } from '@openrouter/sdk';
import { getClient } from './llm.js';
import { micros } from './micro/index.js';
import { logActivity } from './activity.js';
import { db } from './db.js';

// --- Queue backed by SQLite ---
function initQueue() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS gateway_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent TEXT NOT NULL,
      input TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      priority INTEGER NOT NULL DEFAULT 5,
      result TEXT,
      error TEXT,
      created_at TEXT NOT NULL,
      started_at TEXT,
      finished_at TEXT
    );
  `);
}

initQueue();

export function enqueue(agent, input, priority = 5) {
  const stmt = db.prepare(
    'INSERT INTO gateway_queue (agent, input, status, priority, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(agent, input, 'pending', priority, new Date().toISOString());
  return Number(result.lastInsertRowid);
}

export function getQueue(limit = 50) {
  return db.prepare(
    'SELECT * FROM gateway_queue ORDER BY priority ASC, id ASC LIMIT ?'
  ).all(limit);
}

export function getQueueItem(id) {
  return db.prepare('SELECT * FROM gateway_queue WHERE id = ?').get(id);
}

function markRunning(id) {
  db.prepare(
    "UPDATE gateway_queue SET status = 'running', started_at = ? WHERE id = ?"
  ).run(new Date().toISOString(), id);
}

function markDone(id, result) {
  db.prepare(
    "UPDATE gateway_queue SET status = 'done', result = ?, finished_at = ? WHERE id = ?"
  ).run(result, new Date().toISOString(), id);
}

function markFailed(id, error) {
  db.prepare(
    "UPDATE gateway_queue SET status = 'failed', error = ?, finished_at = ? WHERE id = ?"
  ).run(error, new Date().toISOString(), id);
}

// --- Process one pending item from the queue ---
export async function processNext() {
  const item = db.prepare(
    "SELECT * FROM gateway_queue WHERE status = 'pending' ORDER BY priority ASC, id ASC LIMIT 1"
  ).get();
  if (!item) return null;

  markRunning(item.id);
  const agent = micros[item.agent];
  if (!agent) {
    markFailed(item.id, `Unknown agent: ${item.agent}`);
    return item;
  }

  try {
    const result = await agent.run(item.input);
    markDone(item.id, result);
    logActivity(item.agent, item.input, result);
    return { ...item, status: 'done', result };
  } catch (e) {
    markFailed(item.id, e.message);
    return { ...item, status: 'failed', error: e.message };
  }
}

// --- Gateway Coordinator Agent ---
// Routes requests to the right agent and manages the queue

const routeTool = tool({
  name: 'route_to_agent',
  description: 'Route a task to a specific agent in the swarm',
  inputSchema: z.object({
    agent: z.string().describe('Agent name (e.g. receptionist, scheduler, nightwatch)'),
    input: z.string().describe('The task or message for that agent'),
    priority: z.number().min(1).max(10).default(5).describe('Priority: 1=urgent, 10=low')
  }),
  execute: async ({ agent, input, priority }) => {
    const available = Object.keys(micros);
    if (!available.includes(agent)) {
      return JSON.stringify({ error: `Unknown agent: ${agent}. Available: ${available.join(', ')}` });
    }
    const id = enqueue(agent, input, priority);
    return JSON.stringify({ queued: true, job_id: id, agent, priority });
  }
});

const queueStatusTool = tool({
  name: 'queue_status',
  description: 'Check the current state of the agent queue',
  inputSchema: z.object({
    limit: z.number().default(10).describe('Max items to return')
  }),
  execute: async ({ limit }) => {
    const items = getQueue(limit);
    const summary = {
      pending: items.filter(i => i.status === 'pending').length,
      running: items.filter(i => i.status === 'running').length,
      done: items.filter(i => i.status === 'done').length,
      failed: items.filter(i => i.status === 'failed').length,
      items: items.map(i => ({ id: i.id, agent: i.agent, status: i.status, priority: i.priority }))
    };
    return JSON.stringify(summary);
  }
});

const handoffTool = tool({
  name: 'handoff',
  description: 'Immediately hand off the conversation to another agent and get their response',
  inputSchema: z.object({
    agent: z.string().describe('Target agent name'),
    context: z.string().describe('Full context to pass to the target agent')
  }),
  execute: async ({ agent: agentName, context }) => {
    const agent = micros[agentName];
    if (!agent) {
      return JSON.stringify({ error: `Unknown agent: ${agentName}` });
    }
    try {
      const result = await agent.run(context);
      logActivity(agentName, context, result);
      return JSON.stringify({ agent: agentName, response: result });
    } catch (e) {
      return JSON.stringify({ error: e.message });
    }
  }
});

export const GATEWAY_PROMPT = `You are the AOCS Gateway Coordinator. You are the single entry point for all tasks.

Your job:
1. Understand what the user needs
2. Identify which agent(s) in the swarm can best handle it
3. Either route tasks to the queue (for async work) or hand off directly (for immediate responses)
4. Report back clearly on what was done and what to expect

Available agents by category:
- operators: receptionist, scheduler, intake, dispatcher, qualifier, ordertaker
- companions: listener, reminder, checker, storyteller, caller, walker
- disruptors: auditor, proposal, outreach, replacer, closer
- dev: coordinator, prreview, nightwatch, ciwatch
- ops: incident, inbox, digest, timeblock
- content: trendscout, clipper, monitor
- bizops: onboard, weeklyreport, invoicer
- personal: briefing, transcriber

Rules:
- For urgent or conversational tasks: use handoff (immediate response)
- For background or batch work: use route_to_agent (queued)
- For complex tasks requiring multiple agents: queue each step with appropriate priority
- Always explain to the user what you did and why`;

export function createGateway() {
  const model = 'anthropic/claude-3.5-haiku';

  return {
    name: 'gateway',
    prompt: GATEWAY_PROMPT,

    async run(input) {
      const client = getClient();
      const result = client.callModel({
        model,
        instructions: GATEWAY_PROMPT,
        input,
        tools: [routeTool, queueStatusTool, handoffTool],
        stopWhen: [stepCountIs(8)]
      });
      return result.getText();
    },

    async *stream(input) {
      const client = getClient();
      const result = client.callModel({
        model,
        instructions: GATEWAY_PROMPT,
        input,
        tools: [routeTool, queueStatusTool, handoffTool],
        stopWhen: [stepCountIs(8)]
      });
      for await (const chunk of result.getTextStream()) yield chunk;
    }
  };
}

export const gateway = createGateway();
