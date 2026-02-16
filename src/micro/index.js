import { receptionist, scheduler, intake, dispatcher, qualifier, ordertaker } from './operators.js';
import { listener, reminder, checker, storyteller, caller, walker } from './companions.js';
import { auditor, proposal, outreach, replacer, closer } from './disruptors.js';
import { coordinator, prreview, nightwatch, ciwatch } from './dev.js';
import { incident, inbox, digest, timeblock } from './ops.js';
import { trendscout, clipper, monitor } from './content.js';
import { onboard, weeklyreport, invoicer } from './bizops.js';
import { briefing, transcriber } from './personal.js';

export const micros = {
  // operators
  receptionist, scheduler, intake, dispatcher, qualifier, ordertaker,
  // companions
  listener, reminder, checker, storyteller, caller, walker,
  // disruptors
  auditor, proposal, outreach, replacer, closer,
  // dev
  coordinator, prreview, nightwatch, ciwatch,
  // ops
  incident, inbox, digest, timeblock,
  // content
  trendscout, clipper, monitor,
  // bizops
  onboard, weeklyreport, invoicer,
  // personal
  briefing, transcriber
};

const categories = {
  operators:  { title: 'Operator Replacements', agents: ['receptionist', 'scheduler', 'intake', 'dispatcher', 'qualifier', 'ordertaker'] },
  companions: { title: 'Companion Agents',      agents: ['listener', 'reminder', 'checker', 'storyteller', 'caller', 'walker'] },
  disruptors: { title: 'Business Disruptors',    agents: ['auditor', 'proposal', 'outreach', 'replacer', 'closer'] },
  dev:        { title: 'Dev Coordination',       agents: ['coordinator', 'prreview', 'nightwatch', 'ciwatch'] },
  ops:        { title: 'Ops & Productivity',     agents: ['incident', 'inbox', 'digest', 'timeblock'] },
  content:    { title: 'Content & Social',       agents: ['trendscout', 'clipper', 'monitor'] },
  bizops:     { title: 'Business Operations',    agents: ['onboard', 'weeklyreport', 'invoicer'] },
  personal:   { title: 'Personal Productivity',  agents: ['briefing', 'transcriber'] }
};

export function listMicros() {
  const out = [];
  for (const [cat, info] of Object.entries(categories)) {
    for (const name of info.agents) {
      const m = micros[name];
      out.push({ name, category: info.title, prompt: m.prompt.split('\n')[0] });
    }
  }
  return out;
}

export function getMicro(name) {
  const m = micros[name];
  if (!m) throw new Error(`Unknown micro: ${name}. Available: ${Object.keys(micros).join(', ')}`);
  return m;
}

export { categories };
