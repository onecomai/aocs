import { tool } from '@openrouter/sdk';
import { z } from 'zod/v4';

const outline = tool({
  name: 'outline',
  description: 'Create a structured content outline',
  inputSchema: z.object({
    topic: z.string().describe('Content topic'),
    type: z.enum(['blog', 'newsletter', 'landing_page', 'social', 'docs', 'email_sequence']).describe('Content type'),
    audience: z.string().describe('Target audience'),
    sections: z.array(z.object({
      title: z.string(),
      points: z.array(z.string())
    })).describe('Outline sections')
  }),
  execute: async (data) => {
    return JSON.stringify({ ...data, outlined: true });
  }
});

const writeDraft = tool({
  name: 'write_draft',
  description: 'Write a content draft for a section',
  inputSchema: z.object({
    section: z.string().describe('Section title'),
    content: z.string().describe('Draft content'),
    word_count: z.number().describe('Word count'),
    tone: z.enum(['professional', 'casual', 'technical', 'persuasive', 'educational']).describe('Writing tone')
  }),
  execute: async (data) => {
    return JSON.stringify({ ...data, drafted: true });
  }
});

const seoOptimize = tool({
  name: 'seo_optimize',
  description: 'Optimize content for SEO',
  inputSchema: z.object({
    title: z.string().describe('Optimized title tag (50-60 chars)'),
    meta_description: z.string().describe('Meta description (150-160 chars)'),
    keywords: z.array(z.string()).describe('Target keywords'),
    headings: z.array(z.string()).describe('Optimized H2/H3 headings'),
    slug: z.string().describe('URL slug')
  }),
  execute: async (data) => {
    return JSON.stringify({ ...data, optimized: true });
  }
});

const publishDraft = tool({
  name: 'publish_draft',
  description: 'Save the final draft to a file',
  inputSchema: z.object({
    filename: z.string().describe('Output filename'),
    content: z.string().describe('Final content in markdown'),
    metadata: z.string().describe('JSON frontmatter (title, date, tags, etc.)')
  }),
  execute: async ({ filename, content, metadata }) => {
    const { writeFileSync } = await import('fs');
    try {
      const output = `---\n${metadata}\n---\n\n${content}`;
      writeFileSync(filename, output, 'utf-8');
      return JSON.stringify({ published: filename, bytes: output.length });
    } catch (e) {
      return `Error: ${e.message}`;
    }
  }
});

export const writer = {
  title: 'Content Writer Agent',
  description: 'AI content writer with outlining, drafting, SEO optimization, and publishing',
  price: '$49/mo',
  model: 'anthropic/claude-sonnet-4',
  systemPrompt: `You are a professional content writer. Your job is to produce high-quality, engaging content.

Process:
1. Create a structured outline based on topic, type, and audience
2. Write each section as a draft with the right tone
3. Optimize for SEO (title, meta, keywords, headings)
4. Compile and publish the final draft

Rules:
- Match tone to audience
- Use short paragraphs and clear headings
- Include actionable takeaways
- Avoid fluff and filler
- Every piece needs a hook, body, and CTA
- Blog posts: 800-1500 words
- Social: platform-appropriate lengths
- Email sequences: 3-5 emails, increasing urgency`,

  tools: [outline, writeDraft, seoOptimize, publishDraft],
  maxIterations: 15
};
