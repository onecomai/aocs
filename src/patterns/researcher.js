import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';

const webSearch = tool({
  name: 'web_search',
  description: 'Search the web for information',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
    max_results: z.number().optional().describe('Max results to return')
  }),
  execute: async ({ query, max_results }) => {
    // Hook: override with your search API (Exa, Serper, Tavily)
    return JSON.stringify({
      results: [{ title: `Result for: ${query}`, url: 'https://example.com', snippet: 'Placeholder - wire your search API' }]
    });
  }
});

const fetchPage = tool({
  name: 'fetch_page',
  description: 'Fetch and extract text from a URL',
  inputSchema: z.object({
    url: z.string().describe('URL to fetch')
  }),
  execute: async ({ url }) => {
    try {
      const res = await fetch(url);
      const text = await res.text();
      // Strip HTML tags, keep text
      return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 8000);
    } catch (e) {
      return `Error fetching ${url}: ${e.message}`;
    }
  }
});

const saveFinding = tool({
  name: 'save_finding',
  description: 'Save a research finding',
  inputSchema: z.object({
    topic: z.string().describe('Topic category'),
    finding: z.string().describe('Key finding or fact'),
    source: z.string().describe('Source URL or reference'),
    confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level')
  }),
  execute: async ({ topic, finding, source, confidence }) => {
    return JSON.stringify({ saved: true, topic, finding, source, confidence });
  }
});

const writeReport = tool({
  name: 'write_report',
  description: 'Compile findings into a structured report',
  inputSchema: z.object({
    title: z.string().describe('Report title'),
    sections: z.array(z.object({
      heading: z.string(),
      content: z.string()
    })).describe('Report sections'),
    format: z.enum(['markdown', 'json', 'text']).describe('Output format')
  }),
  execute: async ({ title, sections, format }) => {
    if (format === 'markdown') {
      let md = `# ${title}\n\n`;
      for (const s of sections) md += `## ${s.heading}\n\n${s.content}\n\n`;
      return md;
    }
    return JSON.stringify({ title, sections });
  }
});

export const researcher = {
  title: 'Research & Summarizer Agent',
  description: 'Deep research agent with web search, page extraction, structured findings, and report generation',
  price: '$39/mo',
  model: 'anthropic/claude-sonnet-4',
  systemPrompt: `You are a research analyst. Your job is to thoroughly research topics and produce actionable reports.

Process:
1. Break the research question into sub-queries
2. Search for each sub-query
3. Fetch and read the most relevant pages
4. Save key findings with sources and confidence levels
5. Compile everything into a structured report

Rules:
- Always cite sources
- Distinguish facts from opinions
- Flag low-confidence findings
- Cross-reference multiple sources when possible
- Produce a clear, actionable report at the end`,

  tools: [webSearch, fetchPage, saveFinding, writeReport],
  maxIterations: 20
};
