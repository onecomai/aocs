import { writeFileSync, existsSync, mkdirSync } from 'fs';

const DEPLOYMENTS = {
  railway: {
    name: 'Railway',
    files: {
      'railway.json': JSON.stringify({
        name: 'aocs',
        services: [{
          type: 'web',
          name: 'aocs',
          env: 'node',
          buildCommand: 'npm ci',
          startCommand: 'node -e "import(\'./src/index.js\').then(m => m.serve(process.env.PORT || 3000))"',
          envVars: [
            { key: 'NODE_ENV', value: 'production' },
            { key: 'OPENROUTER_API_KEY', required: true },
            { key: 'PORT', value: '3000' }
          ]
        }]
      }, null, 2)
    },
    url: 'https://railway.app/template',
    instructions: `
1. Create account at railway.app
2. Install Railway CLI: npm i -g @railway/cli
3. Run: railway login
4. Run: railway init
5. Run: railway up
6. Set secret: railway variables set OPENROUTER_API_KEY=your-key
7. Open: railway open
`
  },
  render: {
    name: 'Render',
    files: {
      'render.yaml': `services:
  - type: web
    name: aocs
    runtime: node
    buildCommand: npm ci
    startCommand: node -e "import('./src/index.js').then(m => m.serve(process.env.PORT || 3000))"
    envVars:
      - key: NODE_ENV
        value: production
      - key: OPENROUTER_API_KEY
        sync: false
    healthCheckPath: /health
`
    },
    url: 'https://render.com',
    instructions: `
1. Push code to GitHub
2. Go to render.com → New → Web Service
3. Connect your repo
4. Add environment variable: OPENROUTER_API_KEY
5. Deploy
`
  },
  docker: {
    name: 'Docker',
    files: {
      'Dockerfile': `FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "-e", "import('./src/index.js').then(m => m.serve(process.env.PORT || 3000))"]
`,
      'docker-compose.yml': `version: '3.8'
services:
  aocs:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENROUTER_API_KEY=\${OPENROUTER_API_KEY}
      - NODE_ENV=production
`
    },
    instructions: `
1. Run: docker build -t aocs .
2. Run: docker run -p 3000:3000 -e OPENROUTER_API_KEY=your-key aocs
3. Open: http://localhost:3000
`
  },
  fly: {
    name: 'Fly.io',
    files: {
      'fly.toml': `app = "aocs"
primary_region = "lhr"

[build]

[env]
  PORT = "8080"
  NODE_ENV = "production"

[[services]]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[services.ports]]
  port = 80
  handlers = ["http"]

[[services.ports]]
  port = 443
  handlers = ["tls", "http"]
`,
      '.dockerignore': `node_modules
.git
.env
*.md
`
    },
    instructions: `
1. Install Fly CLI: curl -L https://fly.io/install.sh | sh
2. Run: fly auth login
3. Run: fly launch
4. Run: fly secrets set OPENROUTER_API_KEY=your-key
5. Run: fly deploy
6. Open: fly open
`
  }
};

export function deploy(platform, dir = '.') {
  const config = DEPLOYMENTS[platform];
  if (!config) {
    const available = Object.keys(DEPLOYMENTS).join(', ');
    throw new Error(`Unknown platform: ${platform}\nAvailable: ${available}`);
  }

  // Write config files
  for (const [filename, content] of Object.entries(config.files)) {
    const filepath = `${dir}/${filename}`;
    if (existsSync(filepath)) {
      console.log(`Skipping ${filename} (already exists)`);
      continue;
    }
    writeFileSync(filepath, content);
    console.log(`Created: ${filename}`);
  }

  return { platform: config.name, instructions: config.instructions, url: config.url };
}

export function listPlatforms() {
  return Object.entries(DEPLOYMENTS).map(([key, p]) => ({
    key,
    name: p.name,
    description: p.instructions.split('\n')[1]
  }));
}

export { DEPLOYMENTS };
