# One-Click Deploy

Deploy AOCS to the cloud in 2 minutes. No terminal needed after initial setup.

## Option 1: Railway (Recommended)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/aocs)

1. Click the button above
2. Add your `OPENROUTER_API_KEY` in Railway dashboard
3. Done. Your agents are live.

## Option 2: Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yourusername/aocs)

1. Click the button
2. Add your `OPENROUTER_API_KEY` in Render dashboard
3. Done.

## Option 3: Docker

```bash
docker build -t aocs .
docker run -p 3000:3000 -e OPENROUTER_API_KEY=your-key aocs
```

## Option 4: Fly.io

```bash
fly launch
fly secrets set OPENROUTER_API_KEY=your-key
fly deploy
```

## After Deploy

Your dashboard is at: `https://your-app-url/`

Your widget code is at: `https://your-app-url/widget`

Your API is at: `https://your-app-url/api`

## What You Get

- 33 AI agents running 24/7
- Web dashboard to monitor and chat
- Embeddable widget for your website
- Activity log and stats
- All for ~$5-10/month hosting + API costs

## Business Presets

After deploy, run business-specific setup:

```bash
# SSH into your deployed app or run locally
aocs init dental
git add . && git commit -m "Add dental agents"
git push
```

Or configure via environment variables:

```
AOCS_BUSINESS_TYPE=dental
AOCS_AGENTS=receptionist,scheduler,intake,reminder,checker
```
