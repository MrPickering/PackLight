import { beforeEach, expect, it, vi } from 'vitest';
import { analyzeJournal, callAgent, configureAI, getApiKey } from '../../src/utils/api';
import { AGENTS } from '../../src/types';

beforeEach(() => {
  vi.stubGlobal('localStorage', { removeItem: vi.fn() });
  configureAI('', false);
});
it('requires explicit consent and stores keys only in memory', () => {
  expect(() => configureAI('test-key', false)).toThrow();
  expect(getApiKey()).toBe('');
  configureAI('test-key', true);
  expect(getApiKey()).toBe('test-key');
  configureAI('', false);
  expect(getApiKey()).toBe('');
});
it('makes no request without a configured session', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  await expect(analyzeJournal('private', 3)).rejects.toThrow('Settings');
  expect(fetch).not.toHaveBeenCalled();
});
it('surfaces HTTP failures instead of accepting empty results', async () => {
  configureAI('test', true);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
  await expect(callAgent(AGENTS.geologist, 'hello', [])).rejects.toThrow('not accepted');
});
it('rejects malformed AI categories before they enter the store', async () => {
  configureAI('test', true);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ content: [{ type: 'text', text: '[{"name":"Test","compartment":"wrong","suggestedWeight":2,"suggestedUtility":2}]' }] })));
  await expect(analyzeJournal('hello', 3)).rejects.toThrow('safely');
});
