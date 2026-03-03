# Disruptor Agents

Find companies doing things manually. Show them the cost. Sell the fix.

## The Play

```
auditor → proposal → outreach → closer
```

Four agents, one pipeline. Each runs independently.

## Agents

### auditor
Finds waste in business processes.

```bash
curl -X POST http://localhost:3000/agent/auditor \
  -H "Content-Type: application/json" \
  -d '{"input": "We have 3 people who spend all day copying data from emails into our CRM"}'
```

**Ask:** "Walk me through how you handle X."
**Output:** Process name, waste found, hours wasted, fix.
**Target:** Any company still running on email + spreadsheets.

---

### proposal
Turns audit findings into a one-page sell.

```bash
curl -X POST http://localhost:3000/agent/proposal \
  -H "Content-Type: application/json" \
  -d '{"input": "They spend 120 hours/month manually entering invoices. 3 staff at $20/hr = $7,200/month"}'
```

**Structure:** Problem → Cost → Fix → Price → ROI.
**Rule:** One page. No fluff. Money talks.

---

### outreach
Cold message that lands. Under 80 words.

```bash
curl -X POST http://localhost:3000/agent/outreach \
  -H "Content-Type: application/json" \
  -d '{"input": "Target: operations manager at a 50-person HVAC company still dispatching by phone"}'
```

**Rule:** Lead with THEIR problem. One question at the end.
**Channel:** Email, LinkedIn, Twitter.

---

### replacer
Maps human roles to agent replacements with honest assessment.

```bash
curl -X POST http://localhost:3000/agent/replacer \
  -H "Content-Type: application/json" \
  -d '{"input": "They have: 2 receptionists, 1 dispatcher, 1 data entry clerk, 1 office manager"}'
```

**Output:** Role, tasks, hours/week, annual cost, which agent replaces it, savings, and whether it's actually replaceable.
**Honest:** Some roles can't be replaced. Says so.

---

### closer
Handles objections. Asks for the yes.

```bash
curl -X POST http://localhost:3000/agent/closer \
  -H "Content-Type: application/json" \
  -d '{"input": "They said they like it but need to think about it"}'
```

**Method:** Find the real objection. Address it. Show cost of inaction. Ask.

---

## The Pipeline

Chain them in code:

```js
import { getMicro } from 'aocs';

// 1. Audit their process
const waste = await getMicro('auditor').run(
  'They have 4 people answering phones and booking appointments manually'
);

// 2. Build a proposal
const deal = await getMicro('proposal').run(waste);

// 3. Write outreach
const msg = await getMicro('outreach').run(
  `Target: office manager at dental clinic. Context: ${deal}`
);

// 4. When they respond, close
const result = await getMicro('closer').run(
  'They replied: "Interesting but we tried software before and it was complicated"'
);
```

Or hit the endpoints:

```bash
# Step 1
AUDIT=$(curl -s -X POST http://localhost:3000/agent/auditor \
  -H "Content-Type: application/json" \
  -d '{"input": "3 staff doing manual data entry"}' | jq -r '.output')

# Step 2
curl -X POST http://localhost:3000/agent/proposal \
  -H "Content-Type: application/json" \
  -d "{\"input\": \"$AUDIT\"}"
```

## Target Industries

| Industry | Pain | Agent combo |
|----------|------|-------------|
| Dental/Medical | Phone scheduling, intake forms | receptionist + scheduler + intake |
| HVAC/Plumbing | Phone dispatch, job assignment | receptionist + dispatcher |
| Law firms | Client intake, scheduling | intake + scheduler + qualifier |
| Restaurants | Phone orders, reservations | ordertaker + scheduler |
| Agencies | Lead qual, proposals | qualifier + proposal |
| Real estate | Lead screening, scheduling | qualifier + scheduler |

## Revenue math

Land 10 small businesses at $200/mo = $2,000/mo.
Your API cost: ~$100/mo.
Margin: 95%.

Land 50 = $10,000/mo.
Land 200 = $40,000/mo.

The disruptor agents find the customers. The operator agents are the product. The companions are the mission.
