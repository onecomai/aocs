import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { getPreset } from './presets.js';
import { getMicro } from './micro/index.js';

export function init(businessType, dir = '.') {
  const preset = getPreset(businessType);
  const outDir = `${dir}/aocs-${businessType}`;

  if (existsSync(outDir)) {
    throw new Error(`Directory ${outDir} already exists`);
  }

  mkdirSync(outDir, { recursive: true });

  // package.json
  writeFileSync(`${outDir}/package.json`, JSON.stringify({
    name: `aocs-${businessType}`,
    version: '1.0.0',
    type: 'module',
    scripts: {
      start: 'node server.js',
      dev: 'node --watch server.js'
    },
    dependencies: {
      aocs: 'file:../'
    }
  }, null, 2));

  // server.js - plug and play with dashboard
  writeFileSync(`${outDir}/server.js`, `import { config, serve } from 'aocs';

config.set('llm.apiKey', process.env.OPENROUTER_API_KEY);
config.set('business.name', '${preset.name}');

const port = process.env.PORT || 3000;
serve(port);
`);

  // .env template
  writeFileSync(`${outDir}/.env`, `OPENROUTER_API_KEY=your-key-here
PORT=3000
`);

  // README
  const agentDocs = preset.agents.map(a => {
    const m = getMicro(a);
    return `### ${a}\n${m.prompt.split('\n')[0]}\n\`\`\`bash\ncurl -X POST http://localhost:3000/agent/${a} \\\n  -H "Content-Type: application/json" \\\n  -d '{"input": "your message here"}'\n\`\`\``;
  }).join('\n\n');

  writeFileSync(`${outDir}/README.md`, `# ${preset.name}

${preset.description}

**Replaces:** ${preset.replaces}
**Saves:** ${preset.saves}

## Setup (4 steps)

\`\`\`bash
cd ${outDir}
npm install
export OPENROUTER_API_KEY="your-key"
npm start
\`\`\`

Free API key: https://openrouter.ai/keys

## What you get

Open http://localhost:3000 in your browser.

- **Dashboard** — see every conversation, stats, activity log
- **Chat** — talk to any agent from the browser
- **Widget** — visit /widget to get code you paste on your website
- **API** — visit /api for the full endpoint list

## Your agents

${agentDocs}

## Add the chat widget to your website

1. Go to http://localhost:3000/widget
2. Copy the code
3. Paste it before \`</body>\` on your website
4. Done. Customers can now chat with your AI.

## That's it.

No config files. No dashboards to learn. No training.
Open the browser. Your agents are working.
`);

  return { dir: outDir, preset };
}
