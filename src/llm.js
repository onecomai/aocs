import { OpenRouter } from '@openrouter/sdk';
import { config } from './config.js';

let _client = null;

export function getClient() {
  if (!_client) {
    _client = new OpenRouter({
      apiKey: config.get('llm.apiKey')
    });
  }
  return _client;
}

export function resetClient() {
  _client = null;
}
