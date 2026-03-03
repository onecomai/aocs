# Companion Agents

For elderly, isolated, and lonely people. Not a replacement for humans. A bridge until one shows up.

## Agents

### listener
Listens. Reflects. Validates. Does not give advice.

```bash
curl -X POST http://localhost:3000/agent/listener \
  -H "Content-Type: application/json" \
  -d '{"input": "Nobody called me this week again"}'
```

**For:** Elderly living alone, people in isolation, grief
**Deployed by:** Elder care facilities, nonprofits, community orgs
**Not a therapist.** Flags distress for human follow-up.

---

### reminder
Medication, appointments, daily tasks. Gentle, not nagging.

```bash
curl -X POST http://localhost:3000/agent/reminder \
  -H "Content-Type: application/json" \
  -d '{"input": "Did I take my morning pills?"}'
```

**For:** Medication adherence, appointment reminders
**Deployed by:** Home health, family caregivers, pharmacies
**Critical:** Wire to real reminder system for timed alerts.

---

### checker
Daily check-in. "How are you feeling today?"

```bash
curl -X POST http://localhost:3000/agent/checker \
  -H "Content-Type: application/json" \
  -d '{"input": "I am okay I think, my knee hurts a bit"}'
```

**For:** Daily wellness monitoring
**Deployed by:** Assisted living, remote family monitoring
**Key feature:** Logs mood. Flags bad days. Alerts caregivers when `flag: true`.

---

### storyteller
Tells stories. Asks what kind. Makes them laugh.

```bash
curl -X POST http://localhost:3000/agent/storyteller \
  -H "Content-Type: application/json" \
  -d '{"input": "Tell me something funny about a cat"}'
```

**For:** Entertainment, cognitive engagement, bedtime
**Deployed by:** Care homes, family tablets, community programs
**Why it matters:** Loneliness kills. Laughter heals.

---

### caller
Helps people reach out when they're too anxious to call.

```bash
curl -X POST http://localhost:3000/agent/caller \
  -H "Content-Type: application/json" \
  -d '{"input": "I need to call my doctor but I dont know what to say"}'
```

**For:** Phone anxiety, cognitive decline, language barriers
**Deployed by:** Social workers, patient advocates
**Output:** A script or drafted message they can read or send.

---

### walker
Guided gentle exercise. Walking, stretching, breathing.

```bash
curl -X POST http://localhost:3000/agent/walker \
  -H "Content-Type: application/json" \
  -d '{"input": "I have been sitting all day"}'
```

**For:** Mobility, fall prevention, daily movement
**Deployed by:** Physical therapy, senior centers
**Key:** One instruction at a time. Celebrates small wins.

---

## Deployment model

Companion agents run behind a simple interface:
- Tablet in the living room
- WhatsApp bot (add adapter)
- Daily automated check-in via SMS
- Voice via Twilio (add TTS/STT layer)

## Ethics

- These agents do NOT replace human connection
- They bridge the gap between visits
- All companion agents should flag distress to a real human
- Data is sensitive - encrypt everything in production
- Get consent from the person AND their caregiver

## Pricing

Nonprofits and elder care: $10/mo per resident.
100 residents = $1,000/mo recurring.
Cost to run: ~$50/mo in API calls.
