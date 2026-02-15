import { config } from './config.js';

class LLM {
  constructor() {
    this.provider = config.get('llm.provider') || 'openrouter';
    this.apiKey = config.get('llm.apiKey');
    this.model = config.get('llm.model') || 'anthropic/claude-3-haiku:free';
  }

  async complete(prompt, tools = []) {
    const body = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      ...(tools.length && { tools: this._formatTools(tools) })
    };

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aocs.dev',
        'X-Title': 'AOCS'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`LLM error: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return data.choices[0].message;
  }

  async *stream(prompt, tools = []) {
    const body = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      ...(tools.length && { tools: this._formatTools(tools) })
    };

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aocs.dev',
        'X-Title': 'AOCS'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`LLM error: ${res.status} - ${err}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        if (trimmed === 'data: [DONE]') return;

        try {
          const chunk = JSON.parse(trimmed.slice(6));
          const content = chunk.choices[0]?.delta?.content;
          if (content) yield content;
        } catch {}
      }
    }
  }

  _formatTools(tools) {
    return tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description || '',
        parameters: t.parameters || { type: 'object', properties: {} }
      }
    }));
  }
}

export const llm = new LLM();
