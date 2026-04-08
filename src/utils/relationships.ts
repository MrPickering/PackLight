import type { PackItem, WeightDimensions } from '../types';

export interface ItemRelationship {
  sourceId: string;
  targetId: string;
  type: 'tag' | 'context' | 'cross-compartment' | 'hierarchy' | 'dimension-similarity';
  strength: number; // 0-1
  label: string;
}

function dimensionSimilarity(a: WeightDimensions, b: WeightDimensions): number {
  const keys: (keyof WeightDimensions)[] = ['stress', 'worry', 'cognitive', 'urgency', 'emotional'];
  const sumSqDiff = keys.reduce((sum, k) => sum + (a[k] - b[k]) ** 2, 0);
  // Max possible distance is sqrt(5 * 16) = ~8.94; normalize to 0-1 where 1 = identical
  return 1 - Math.sqrt(sumSqDiff) / 8.94;
}

export function computeRelationships(items: PackItem[]): ItemRelationship[] {
  const active = items.filter(i => !i.droppedAt);
  const relationships: ItemRelationship[] = [];
  const seen = new Set<string>();

  const key = (a: string, b: string, type: string) => [a, b].sort().join(':') + ':' + type;

  for (let i = 0; i < active.length; i++) {
    const a = active[i];
    for (let j = i + 1; j < active.length; j++) {
      const b = active[j];

      // Skip parent-child (handled separately)
      if (a.parentId === b.id || b.parentId === a.id) {
        const k = key(a.id, b.id, 'hierarchy');
        if (!seen.has(k)) {
          seen.add(k);
          relationships.push({
            sourceId: a.parentId === b.id ? b.id : a.id,
            targetId: a.parentId === b.id ? a.id : b.id,
            type: 'hierarchy',
            strength: 1,
            label: 'Contains',
          });
        }
        continue;
      }

      // Tag overlap
      const sharedTags = a.tags.filter(t => b.tags.includes(t));
      if (sharedTags.length > 0) {
        const k = key(a.id, b.id, 'tag');
        if (!seen.has(k)) {
          seen.add(k);
          const strength = Math.min(1, sharedTags.length / 3);
          relationships.push({
            sourceId: a.id,
            targetId: b.id,
            type: 'tag',
            strength,
            label: `Shared: ${sharedTags.slice(0, 3).join(', ')}`,
          });
        }
      }

      // Context overlap
      const sharedContexts = a.contexts.filter(c => b.contexts.includes(c));
      if (sharedContexts.length > 0 && a.compartment !== b.compartment) {
        const k = key(a.id, b.id, 'context');
        if (!seen.has(k)) {
          seen.add(k);
          relationships.push({
            sourceId: a.id,
            targetId: b.id,
            type: 'context',
            strength: Math.min(1, sharedContexts.length / 2),
            label: `Same context: ${sharedContexts.join(', ')}`,
          });
        }
      }

      // Cross-compartment text matching (goals ↔ tools/provisions/emotions)
      if (a.compartment !== b.compartment) {
        const aWords = new Set([a.name, ...a.tags, ...a.description.toLowerCase().split(/\s+/)].map(w => w.toLowerCase()));
        const bWords = new Set([b.name, ...b.tags, ...b.description.toLowerCase().split(/\s+/)].map(w => w.toLowerCase()));
        const nameMatchA = bWords.has(a.name.toLowerCase());
        const nameMatchB = aWords.has(b.name.toLowerCase());
        if (nameMatchA || nameMatchB) {
          const k = key(a.id, b.id, 'cross-compartment');
          if (!seen.has(k)) {
            seen.add(k);
            relationships.push({
              sourceId: a.id,
              targetId: b.id,
              type: 'cross-compartment',
              strength: 0.7,
              label: `Cross-reference between ${a.compartment} and ${b.compartment}`,
            });
          }
        }
      }

      // Weight dimension similarity
      if (a.weightDimensions && b.weightDimensions) {
        const sim = dimensionSimilarity(a.weightDimensions, b.weightDimensions);
        if (sim >= 0.85) {
          const k = key(a.id, b.id, 'dimension-similarity');
          if (!seen.has(k)) {
            seen.add(k);
            relationships.push({
              sourceId: a.id,
              targetId: b.id,
              type: 'dimension-similarity',
              strength: sim,
              label: 'Similar weight pattern',
            });
          }
        }
      }
    }
  }

  return relationships.sort((a, b) => b.strength - a.strength);
}

export interface ItemWithConnections {
  item: PackItem;
  connections: { relatedItem: PackItem; relationship: ItemRelationship }[];
}

export function getItemConnections(items: PackItem[]): ItemWithConnections[] {
  const relationships = computeRelationships(items);
  const active = items.filter(i => !i.droppedAt);
  const itemMap = new Map(active.map(i => [i.id, i]));

  const connectionMap = new Map<string, { relatedItem: PackItem; relationship: ItemRelationship }[]>();

  for (const rel of relationships) {
    const source = itemMap.get(rel.sourceId);
    const target = itemMap.get(rel.targetId);
    if (!source || !target) continue;

    if (!connectionMap.has(rel.sourceId)) connectionMap.set(rel.sourceId, []);
    if (!connectionMap.has(rel.targetId)) connectionMap.set(rel.targetId, []);

    connectionMap.get(rel.sourceId)!.push({ relatedItem: target, relationship: rel });
    connectionMap.get(rel.targetId)!.push({ relatedItem: source, relationship: rel });
  }

  return active
    .filter(i => connectionMap.has(i.id) && connectionMap.get(i.id)!.length > 0)
    .map(item => ({
      item,
      connections: connectionMap.get(item.id)!,
    }))
    .sort((a, b) => b.connections.length - a.connections.length);
}
