import type { AgentId, PackItem, AGENTS } from '../types';

export async function callAgent(
  agent: (typeof AGENTS)[AgentId],
  userMessage: string,
  context: PackItem[],
): Promise<string> {
  const apiKey = localStorage.getItem('packlight-api-key');
  if (!apiKey) throw new Error('API key not configured');

  const contextSummary = context
    .filter(i => !i.droppedAt)
    .map(
      item =>
        `[${item.compartment}] ${item.name} — Weight: ${item.weight}, Utility: ${item.utility}. ${item.description}`,
    )
    .join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `${agent.systemPrompt}\n\nThe user's current pack inventory:\n${contextSummary}`,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  const data = await response.json();
  return data.content?.[0]?.text || 'Agent unavailable.';
}

export async function analyzeJournal(
  content: string,
  mood: number,
): Promise<{ name: string; compartment: string; suggestedWeight: number; suggestedUtility: number }[]> {
  const apiKey = localStorage.getItem('packlight-api-key');
  if (!apiKey) throw new Error('API key not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are an analyst for PackLight, a life load management app. The user wrote a journal entry with mood ${mood}/5. Extract potential pack items from their entry. Categorize each into one of these compartments:
- stones: emotional/psychological weight
- chains: obligations/commitments
- tools: skills/capabilities
- provisions: resources/safety nets
- maps: goals/plans
- souvenirs: identity/meaning items

Respond ONLY with a JSON array of objects with keys: name, compartment, suggestedWeight (1-10), suggestedUtility (1-10). No other text.`,
      messages: [{ role: 'user', content }],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || '[]';
  try {
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}
