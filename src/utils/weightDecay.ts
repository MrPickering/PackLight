import type { PackItem, AgentNote } from '../types';

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function makeNote(agentId: AgentNote['agentId'], content: string, itemId: string): AgentNote {
  return {
    id: crypto.randomUUID(),
    agentId,
    content,
    createdAt: new Date().toISOString(),
    actionType: 'observation',
    status: 'pending',
    relatedItemIds: [itemId],
  };
}

export function runWeightDecay(items: PackItem[]): { updatedItems: PackItem[]; newNotes: AgentNote[] } {
  const now = new Date().toISOString();
  const allNotes: AgentNote[] = [];

  const updatedItems = items.map(item => {
    if (item.droppedAt || item.isContainer) return item;
    const days = daysSince(item.updatedAt);
    const copy = { ...item };

    switch (item.compartment) {
      case 'stones':
        if (days >= 30) {
          copy.weight = Math.min(10, item.weight + 0.5);
          copy.weightHistory = [...item.weightHistory, { date: now, value: copy.weight }];
          allNotes.push(makeNote('geologist', `"${item.name}" hasn't been addressed in ${days} days. Its weight has grown slightly — avoidance has a cost. Consider giving this some attention.`, item.id));
        }
        break;
      case 'tools':
        if (days >= 60) {
          copy.utility = Math.max(1, item.utility - 0.3);
          copy.utilityHistory = [...item.utilityHistory, { date: now, value: copy.utility }];
          allNotes.push(makeNote('blacksmith', `Your "${item.name}" ability hasn't been used in ${days} days. Skills lose sharpness without practice — utility has decreased slightly.`, item.id));
        }
        break;
      case 'maps':
        if (days >= 30) {
          allNotes.push(makeNote('navigator', `"${item.name}" hasn't been updated in ${days} days. Is this goal still active, or has your direction changed?`, item.id));
        }
        break;
      case 'souvenirs':
        if (days >= 45) {
          allNotes.push(makeNote('archivist', `You haven't revisited "${item.name}" in ${days} days. The parts of your identity that matter need regular attention.`, item.id));
        }
        break;
    }

    return copy;
  });

  return { updatedItems, newNotes: allNotes };
}
