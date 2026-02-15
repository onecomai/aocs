#!/usr/bin/env node

import { agent, tools, config } from '../src/index.js';
import { readFileSync } from 'fs';
import { homedir } from 'os';

const cfgPath = `${homedir()}/.aocs.json`;
config.load(cfgPath);

const args = process.argv.slice(2);
const cmd = args[0];

async function main() {
  if (!config.get('llm.apiKey')) {
    console.error('Error: Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY');
    console.error('  export OPENROUTER_API_KEY="your-key"');
    process.exit(1);
  }

  if (cmd === 'tools') {
    console.log('Available tools:');
    for (const t of tools.list()) {
      console.log(`  ${t.name}: ${t.description}`);
    }
    return;
  }

  if (cmd === 'run' && args[1]) {
    const result = await agent.run(args.slice(1).join(' '));
    console.log(result);
    return;
  }

  if (cmd === 'stream' && args[1]) {
    process.stdout.write('> ');
    for await (const chunk of agent.streamRun(args.slice(1).join(' '))) {
      process.stdout.write(chunk);
    }
    console.log('\n');
    return;
  }

  if (cmd === 'repl') {
    console.log('AOCS REPL (Ctrl+C to exit)\n');
    while (true) {
      process.stdout.write('> ');
      const input = await new Promise(resolve => {
        process.stdin.once('data', d => resolve(d.toString().trim()));
      });
      if (!input) continue;
      if (input === 'exit' || input === 'quit') break;
      if (input === 'reset') {
        agent.reset();
        console.log('History cleared.\n');
        continue;
      }
      const result = await agent.run(input);
      console.log(result, '\n');
    }
    return;
  }

  console.log(`AOCS v1.0.0 - Lightweight AI Agent

Usage:
  aocs run <prompt>     Run a single prompt
  aocs stream <prompt> Stream response token by token
  aocs repl            Interactive REPL mode
  aocs tools           List available tools

Environment:
  OPENROUTER_API_KEY   Your API key (free tier available)
  ANTHROPIC_API_KEY    Alternative: Anthropic key`);
}

main().catch(console.error);
