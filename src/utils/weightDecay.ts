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
  const allNotes: AgentNote[] = [];

  const updatedItems = items.map(item => {
    if (item.droppedAt || item.isContainer) return item;
    const days = daysSince(item.updatedAt);

    switch (item.compartment) {
      case 'stones':
        if (days >= 30) {
          allNotes.push(makeNote('geologist', `It's been ${days} days since you revisited "${item.name}". If it feels useful, check whether your rating still fits. There's no deadline.`, item.id));
        }
        break;
      case 'tools':
        if (days >= 60) {
          allNotes.push(makeNote('blacksmith', `Would you like to revisit "${item.name}"? Your last rating is unchanged; only you know how useful it feels today.`, item.id));
        }
        break;
      case 'maps':
        if (days >= 30) {
          allNotes.push(makeNote('navigator', `"${item.name}" hasn't been updated in ${days} days. Is this goal still active, or has your direction changed?`, item.id));
        }
        break;
      case 'souvenirs':
        if (days >= 45) {
          allNotes.push(makeNote('archivist', `If you'd like, take a moment to reflect on what "${item.name}" means to you today.`, item.id));
        }
        break;
    }

    return item;
  });

  return { updatedItems, newNotes: allNotes };
}
