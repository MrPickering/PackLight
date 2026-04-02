import type { PackItem, TerrainType, RecoveryCheck } from '../types';

const CAPACITY_MODIFIER: Record<TerrainType, number> = {
  summit: 1.2,
  downhill: 1.1,
  camp: 1.0,
  uphill: 0.9,
  ridge: 0.8,
  swamp: 0.7,
};

function recoveryScore(checks: RecoveryCheck[]): number {
  if (checks.length === 0) return 5; // neutral default
  const latest = checks[checks.length - 1];
  const raw = latest.sleep + latest.activity + latest.social + latest.downtime + latest.mindfulness;
  return (raw - 5) / 2; // maps 5-25 to 0-10
}

function calculateStrain(checks: RecoveryCheck[]): number {
  if (checks.length < 4) return 0; // not enough data

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const monthMs = 28 * 24 * 60 * 60 * 1000;

  const recentChecks = checks.filter(c => now - new Date(c.date).getTime() <= weekMs);
  const longerChecks = checks.filter(c => now - new Date(c.date).getTime() <= monthMs);

  if (recentChecks.length === 0 || longerChecks.length === 0) return 0;

  const avg = (arr: RecoveryCheck[]) =>
    arr.reduce((s, c) => s + c.sleep + c.activity + c.social + c.downtime + c.mindfulness, 0) / (arr.length * 5);

  const acute = avg(recentChecks);
  const chronic = avg(longerChecks);
  if (chronic === 0) return 0;

  const acwr = acute / chronic;

  // Gabbett's zones: 0.8-1.3 is safe. Outside that = strain
  if (acwr > 1.5) return 3;  // high strain
  if (acwr > 1.3) return 1.5; // moderate strain
  if (acwr < 0.8) return 2;  // underrecovery strain
  return 0;
}

export function calculateLoadBalance(
  items: PackItem[],
  terrain: TerrainType,
  recoveryHistory: RecoveryCheck[],
): { score: number; recovery: number; strain: number } {
  const activeItems = items.filter(i => !i.droppedAt);
  const totalWeight = activeItems.reduce((sum, i) => sum + i.weight, 0);
  const totalUtility = activeItems.reduce((sum, i) => sum + i.utility, 0);

  const recovery = recoveryScore(recoveryHistory);
  const strain = calculateStrain(recoveryHistory);
  const capacity = CAPACITY_MODIFIER[terrain];

  if (totalWeight === 0 && totalUtility === 0) {
    return { score: 50, recovery, strain };
  }

  const demands = Math.max(totalWeight, 1);
  const resources = totalUtility + recovery;
  const raw = (resources * capacity) / (demands + strain);

  // Normalize to 0-100 scale
  const score = Math.round(Math.min(100, Math.max(0, raw * 50)));

  return { score, recovery, strain };
}
