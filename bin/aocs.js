#!/usr/bin/env node

import { agent, tools, config, Agent, listPatterns, loadPattern, listMicros, getMicro, categories, serve, listPresets, init } from '../src/index.js';
import { homedir } from 'os';

const cfgPath = `${homedir()}/.aocs.json`;
config.load(cfgPath);

const args = process.argv.slice(2);
const cmd = args[0];

async function main() {
  // --- No-key commands ---

  if (cmd === 'init' && args[1]) {
    try {
      const { dir, preset } = init(args[1]);
      console.log(`\n  Created: ${dir}/\n`);
      console.log(`  ${preset.name}`);
      console.log(`  ${preset.description}\n`);
      console.log(`  Agents: ${preset.agents.join(', ')}`);
      console.log(`  Replaces: ${preset.replaces}`);
      console.log(`  Saves: ${preset.saves}\n`);
      console.log(`  Next steps:`);
      console.log(`    cd ${dir}`);
      console.log(`    npm install`);
      console.log(`    export OPENROUTER_API_KEY="your-key"`);
      console.log(`    npm start\n`);
    } catch (e) {
      console.error(e.message);
    }
    return;
  }

  if (cmd === 'init') {
    console.log('Pick your business:\n');
    for (const p of listPresets()) {
      console.log(`  aocs init ${p.key.padEnd(12)} ${p.name} (${p.agents} agents, saves ${p.saves})`);
    }
    console.log();
    return;
  }

  if (cmd === 'ls') {
    for (const [cat, info] of Object.entries(categories)) {
      console.log(`\n${info.title}:`);
      for (const name of info.agents) {
        const m = getMicro(name);
        console.log(`  ${name.padEnd(14)} ${m.prompt.split('\n')[0]}`);
      }
    }
    return;
  }

  if (cmd === 'patterns') {
    console.log('Patterns (multi-tool agents):\n');
    for (const p of listPatterns()) {
      console.log(`  ${p.name.padEnd(12)} ${p.price.padEnd(10)} ${p.description}`);
    }
    return;
  }

  if (cmd === 'tools') {
    console.log('Built-in tools:');
    for (const t of tools.list()) {
      console.log(`  ${t.function.name}: ${t.function.description}`);
    }
    return;
  }

  // --- Key required ---

  if (!config.get('llm.apiKey')) {
    console.error('Set OPENROUTER_API_KEY');
    console.error('  export OPENROUTER_API_KEY="your-key"');
    console.error('  Free keys: https://openrouter.ai/keys');
    process.exit(1);
  }

  if (cmd === 'serve') {
    const port = parseInt(args[1]) || 3000;
    serve(port);
    return;
  }

  // Micro-agent direct: aocs <agent> <input>
  if (cmd && !['run', 'stream', 'repl', 'use', 'serve'].includes(cmd)) {
    try {
      const m = getMicro(cmd);
      const input = args.slice(1).join(' ');
      if (!input) {
        console.log(`${m.name}: ${m.prompt.split('\n')[0]}`);
        console.log(`\nUsage: aocs ${cmd} "<input>"`);
        return;
      }
      for await (const chunk of m.stream(input)) {
        process.stdout.write(chunk);
      }
      console.log();
      return;
    } catch {}
  }

  if (cmd === 'use' && args[1]) {
    const pattern = loadPattern(args[1]);
    const a = Agent.fromPattern(pattern);
    const prompt = args.slice(2).join(' ');
    if (!prompt) {
      console.log(`${pattern.title} | ${pattern.model}`);
      console.log(`Tools: ${pattern.tools.map(t => t.function.name).join(', ')}`);
      console.log(`\nUsage: aocs use ${args[1]} "<prompt>"`);
      return;
    }
    for await (const chunk of a.streamRun(prompt)) {
      process.stdout.write(chunk);
    }
    console.log();
    return;
  }

  if (cmd === 'run' && args[1]) {
    const result = await agent.run(args.slice(1).join(' '));
    console.log(result);
    return;
  }

  if (cmd === 'stream' && args[1]) {
    for await (const chunk of agent.streamRun(args.slice(1).join(' '))) {
      process.stdout.write(chunk);
    }
    console.log();
    return;
  }

  if (cmd === 'repl') {
    const name = args[1];
    let runner;
    if (name) {
      try {
        const m = getMicro(name);
        runner = (input) => m.run(input);
        console.log(`AOCS [${m.name}] (Ctrl+C to exit)\n`);
      } catch {
        const p = loadPattern(name);
        const a = Agent.fromPattern(p);
        runner = (input) => a.run(input);
        console.log(`AOCS [${p.title}] (Ctrl+C to exit)\n`);
      }
    } else {
      runner = (input) => agent.run(input);
      console.log('AOCS REPL (Ctrl+C to exit)\n');
    }
    while (true) {
      process.stdout.write('> ');
      const input = await new Promise(resolve => {
        process.stdin.once('data', d => resolve(d.toString().trim()));
      });
      if (!input) continue;
      if (input === 'exit' || input === 'quit') break;
      const result = await runner(input);
      console.log(result, '\n');
    }
    return;
  }

  console.log(`AOCS - Governed AI Agent Swarm

  aocs init                        Pick a business, get a server
  aocs init <type>                 Generate plug-and-play project
  aocs serve [port]                Run all 33 agents as endpoints
  aocs <agent> <input>             Run one agent from terminal
  aocs repl [agent]                Interactive mode
  aocs ls                          List all agents

Business types:
  dental hvac restaurant agency realestate law ecommerce saas eldercare solo

Examples:
  aocs init dental                 → ready-to-run dental office server
  aocs serve 3000                  → all 33 agents live
  aocs nightwatch "500 errors on /checkout"
  aocs receptionist "I need to reschedule"`);
}

main().catch(console.error);
