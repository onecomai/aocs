# Operator Agents

Replace human operators. One endpoint per job.

## Agents

### receptionist
Answers calls, routes to departments, takes messages.

```bash
curl -X POST http://localhost:3000/agent/receptionist \
  -H "Content-Type: application/json" \
  -d '{"input": "Hi, I need to talk to someone about my bill"}'
```

**Replaces:** Front desk, phone answering service, after-hours operator
**Customers:** Dental offices, law firms, plumbers, salons
**Savings:** $35-45k/yr per receptionist

---

### scheduler
Books appointments. Checks conflicts. Confirms.

```bash
curl -X POST http://localhost:3000/agent/scheduler \
  -H "Content-Type: application/json" \
  -d '{"input": "I need a haircut next Tuesday afternoon"}'
```

**Replaces:** Booking coordinators, scheduling assistants
**Customers:** Medical clinics, repair services, consultants
**Savings:** $30-40k/yr per coordinator

---

### intake
Collects new client/patient information step by step.

```bash
curl -X POST http://localhost:3000/agent/intake \
  -H "Content-Type: application/json" \
  -d '{"input": "I am a new patient, Dr. Smith referred me"}'
```

**Replaces:** Intake clerks, registration staff
**Customers:** Hospitals, insurance, legal intake
**Savings:** $28-38k/yr per clerk

---

### dispatcher
Matches jobs to available workers by skill and location.

```bash
curl -X POST http://localhost:3000/agent/dispatcher \
  -H "Content-Type: application/json" \
  -d '{"input": "Water leak at 45 Oak Street, needs a plumber ASAP"}'
```

**Replaces:** Dispatch operators, job assigners
**Customers:** HVAC, plumbing, delivery, field service
**Savings:** $40-55k/yr per dispatcher

---

### qualifier
Screens leads. 3 questions. Score. Pass or decline.

```bash
curl -X POST http://localhost:3000/agent/qualifier \
  -H "Content-Type: application/json" \
  -d '{"input": "I saw your ad, we might need a new website"}'
```

**Replaces:** SDRs doing initial qualification
**Customers:** Agencies, SaaS, B2B services
**Savings:** $50-65k/yr per SDR (qualification portion)

---

### ordertaker
Takes orders, confirms items, totals.

```bash
curl -X POST http://localhost:3000/agent/ordertaker \
  -H "Content-Type: application/json" \
  -d '{"input": "Two large pepperoni, one garlic bread, delivery to 12 Main St"}'
```

**Replaces:** Phone order staff, counter order takers
**Customers:** Restaurants, bakeries, wholesale suppliers
**Savings:** $25-35k/yr per order taker

---

## Integration

Wire the `execute` hooks to your systems:

```js
// Replace the stub with your real booking system
import { getMicro } from 'aocs';

const scheduler = getMicro('scheduler');
// The tool's execute function is a hook - override it with your API
```

## Total addressable

6 agents x avg $37k savings = $222k/yr saved per small business.
You charge $200/mo = $2,400/yr. ROI: 92x.
