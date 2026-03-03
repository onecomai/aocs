// Business presets: one command, you're live.
// aocs init dental → receptionist + scheduler + intake + reminder
// aocs init hvac   → receptionist + dispatcher + ordertaker + invoicer

export const presets = {
  dental: {
    name: 'Dental / Medical Office',
    agents: ['receptionist', 'scheduler', 'intake', 'reminder', 'checker'],
    description: 'Answer calls, book appointments, collect patient info, send reminders',
    replaces: '1-2 front desk staff',
    saves: '$60-80k/yr'
  },
  hvac: {
    name: 'HVAC / Plumbing / Field Service',
    agents: ['receptionist', 'dispatcher', 'ordertaker', 'scheduler', 'invoicer'],
    description: 'Answer calls, dispatch techs, take job orders, schedule, invoice',
    replaces: '1 dispatcher + 1 receptionist',
    saves: '$70-90k/yr'
  },
  restaurant: {
    name: 'Restaurant / Food Service',
    agents: ['ordertaker', 'receptionist', 'scheduler'],
    description: 'Take orders by phone/chat, answer questions, book reservations',
    replaces: '1 phone order taker',
    saves: '$30-40k/yr'
  },
  agency: {
    name: 'Marketing / Creative Agency',
    agents: ['qualifier', 'onboard', 'weeklyreport', 'trendscout', 'invoicer'],
    description: 'Qualify leads, onboard clients, weekly reports, trend scouting, invoicing',
    replaces: '1 project coordinator',
    saves: '$50-65k/yr'
  },
  realestate: {
    name: 'Real Estate',
    agents: ['qualifier', 'scheduler', 'receptionist', 'outreach', 'closer'],
    description: 'Screen leads, schedule showings, answer calls, follow up, close',
    replaces: '1 ISA (inside sales agent)',
    saves: '$45-60k/yr'
  },
  law: {
    name: 'Law Firm',
    agents: ['receptionist', 'intake', 'scheduler', 'qualifier', 'invoicer'],
    description: 'Answer calls, client intake, schedule consults, qualify cases, invoice',
    replaces: '1 legal intake specialist',
    saves: '$40-55k/yr'
  },
  ecommerce: {
    name: 'E-commerce / Retail',
    agents: ['receptionist', 'ordertaker', 'monitor', 'weeklyreport', 'invoicer'],
    description: 'Customer support, order handling, brand monitoring, reports, invoicing',
    replaces: '1 customer service rep',
    saves: '$35-45k/yr'
  },
  saas: {
    name: 'SaaS / Tech Startup',
    agents: ['coordinator', 'prreview', 'nightwatch', 'ciwatch', 'weeklyreport', 'inbox'],
    description: 'Dev coordination, PR reviews, incident response, CI monitoring, reports',
    replaces: 'Junior devops + part-time PM',
    saves: '$80-120k/yr'
  },
  eldercare: {
    name: 'Elder Care Facility',
    agents: ['checker', 'reminder', 'listener', 'storyteller', 'caller', 'walker'],
    description: 'Daily check-ins, medication reminders, companionship, exercise guidance',
    replaces: 'Supplements care staff (does not replace)',
    saves: 'Reduces isolation, improves outcomes'
  },
  solo: {
    name: 'Solo Consultant / Freelancer',
    agents: ['inbox', 'briefing', 'timeblock', 'invoicer', 'qualifier', 'proposal'],
    description: 'Email triage, morning briefs, time management, invoicing, lead qualification',
    replaces: 'Virtual assistant',
    saves: '$15-25k/yr'
  }
};

export function getPreset(type) {
  const p = presets[type];
  if (!p) {
    const available = Object.entries(presets).map(([k, v]) => `  ${k.padEnd(12)} ${v.name}`).join('\n');
    throw new Error(`Unknown business type: ${type}\n\nAvailable:\n${available}`);
  }
  return p;
}

export function listPresets() {
  return Object.entries(presets).map(([key, p]) => ({
    key,
    name: p.name,
    agents: p.agents.length,
    saves: p.saves
  }));
}
