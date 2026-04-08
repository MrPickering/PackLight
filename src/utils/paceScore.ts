import type { PackItem, TerrainType } from '../types';

const TERRAIN_MULTIPLIER: Record<TerrainType, number> = {
  summit: 1.3,
  downhill: 1.1,
  camp: 1.0,
  uphill: 0.85,
  ridge: 0.7,
  swamp: 0.5,
};

export function calculatePaceScore(items: PackItem[], terrain: TerrainType): number {
  const activeItems = items.filter(i => !i.droppedAt);
  // Use leaf items only to avoid double-counting parents and children
  const activeIds = new Set(activeItems.filter(i => i.parentId).map(i => i.parentId));
  const leafItems = activeItems.filter(i => !activeIds.has(i.id));
  const totalWeight = leafItems.reduce((sum, i) => sum + i.weight, 0);
  const totalUtility = leafItems.reduce((sum, i) => sum + i.utility, 0);

  if (totalWeight === 0) return 1;

  const raw = (totalUtility / totalWeight) * TERRAIN_MULTIPLIER[terrain];
  return Math.round(Math.min(raw, 2) * 100) / 100;
}
