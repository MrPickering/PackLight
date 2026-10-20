import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBackup, packDataSchema, parseBackup } from '../../src/utils/backup';
import { calculateLoadBalance } from '../../src/utils/loadBalance';
import { runWeightDecay } from '../../src/utils/weightDecay';
import { usePackStore } from '../../src/store';
import { flushStorage } from '../../src/utils/storage';

const now = new Date().toISOString();
const fixture = () => packDataSchema.parse({ profile: { name: 'Test', currentTerrain: 'camp', terrainSetAt: now }, items: [{ id: 'one', name: 'Work', compartment: 'chains', weight: 7, utility: 4, createdAt: now, updatedAt: now }] });
beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
  usePackStore.setState({ ...usePackStore.getInitialState(), ...fixture() }, true);
});

describe('backups and persistence', () => {
  it('round trips all persisted data without credentials or actions', () => {
    const data = fixture();
    expect(parseBackup(createBackup({ ...data, apiKey: 'secret', setProfile: () => {} }))).toEqual(data);
    expect(createBackup({ ...data, apiKey: 'secret' })).not.toContain('secret');
  });
  it('fills legacy backup fields needed by the current UI', () => {
    const parsed = parseBackup(JSON.stringify({ version: 1, profile: { name: 'Old', currentTerrain: 'camp', terrainSetAt: now }, items: [] }));
    expect(parsed.profile.firstStepsComplete).toBe(true);
    expect(parsed.profile.dismissedPrompts).toEqual([]);
    expect(parsed.onboardingComplete).toBe(true);
  });
  it.each(['{"version":99}', 'broken', '{"version":3,"profile":{}}'])('rejects invalid backup %s without changing current data', raw => {
    const before = usePackStore.getState().items;
    expect(() => parseBackup(raw)).toThrow();
    expect(usePackStore.getState().items).toBe(before);
  });
  it('rejects cycles, missing parents, duplicate IDs and out-of-range ratings', () => {
    const data = fixture();
    for (const change of [{ parentId: 'one' }, { parentId: 'missing' }, { weight: 999 }, { compartment: 'invalid' }]) {
      expect(() => parseBackup(JSON.stringify({ ...data, version: 4, items: [{ ...data.items[0], ...change }] }))).toThrow();
    }
    expect(() => parseBackup(JSON.stringify({ ...data, version: 4, items: [data.items[0], data.items[0]] }))).toThrow();
  });
  it('persists complete state and rehydrates it', async () => {
    usePackStore.getState().setProfile({ name: 'Restored' });
    await flushStorage();
    await usePackStore.persist.rehydrate();
    expect(usePackStore.getState().profile.name).toBe('Restored');
    expect(typeof usePackStore.getState().addItem).toBe('function');
  });
});

describe('item and recovery behavior', () => {
  it('counts only leaves when calculating load', () => {
    const data = fixture(); const root = data.items[0];
    const child = { ...root, id: 'child', parentId: root.id, weight: 2, utility: 1 };
    expect(calculateLoadBalance([root, child], 'camp', [])).toEqual(calculateLoadBalance([child], 'camp', []));
  });
  it('does not change a self-rating when an item is old', () => {
    const item = { ...fixture().items[0], compartment: 'stones' as const, updatedAt: '2020-01-01T00:00:00.000Z' };
    const result = runWeightDecay([item]);
    expect(result.updatedItems[0]).toEqual(item);
    expect(result.newNotes.length).toBe(1);
  });
  it('releasing the last child does not bring back the original parent weight', () => {
    const store = usePackStore.getState();
    store.addItem({ name: 'Child', compartment: 'chains', weight: 3, utility: 2, description: '', tags: [], parentId: 'one' });
    store.dropItem(usePackStore.getState().items[1].id);
    expect(store.getEffectiveWeight('one')).toBe(0);
    expect(store.getLeafItems()).toHaveLength(0);
    expect(store.getCompartmentStats('chains').totalWeight).toBe(0);
    expect(store.getLoadBalance().score).toBe(50);
  });
  it('a cascade does not change a previously released descendant timestamp', () => {
    const root = fixture().items[0];
    usePackStore.setState({ items: [root, { ...root, id: 'child', parentId: root.id, droppedAt: '2025-01-01T00:00:00Z' }] });
    usePackStore.getState().dropItem(root.id);
    usePackStore.getState().restoreItem(root.id);
    expect(usePackStore.getState().items[1].droppedAt).toBe('2025-01-01T00:00:00Z');
  });
  it('does not penalize improved recovery', () => {
    const make = (days: number, rating: number) => ({ id: String(days), date: new Date(Date.now() - days * 86400000).toISOString(), sleep: rating, activity: rating, social: rating, downtime: rating, mindfulness: rating });
    const history = [make(20, 2), make(16, 2), make(10, 2), make(8, 2), make(1, 5)];
    expect(calculateLoadBalance(fixture().items, 'camp', history).strain).toBe(0);
  });
  it('retains one recovery check per local calendar day', () => {
    const check = { date: now, sleep: 3, activity: 3, social: 3, downtime: 3, mindfulness: 3 };
    usePackStore.getState().addRecoveryCheck(check);
    usePackStore.getState().addRecoveryCheck({ ...check, sleep: 5 });
    expect(usePackStore.getState().profile.recoveryHistory).toHaveLength(1);
    expect(usePackStore.getState().profile.recoveryHistory[0].sleep).toBe(5);
  });
  it('restoring a released child also restores its ancestors', () => {
    const store = usePackStore.getState();
    store.addItem({ name: 'Child', compartment: 'chains', weight: 3, utility: 2, description: '', tags: [], parentId: 'one' });
    const child = usePackStore.getState().items[1];
    store.dropItem('one'); store.restoreItem(child.id);
    expect(usePackStore.getState().items.every(item => !item.droppedAt)).toBe(true);
  });
  it('restoring a parent leaves independently released children released', () => {
    const root = fixture().items[0];
    usePackStore.setState({ items: [{ ...root, droppedAt: '2025-02-01T00:00:00Z' }, { ...root, id: 'child', parentId: root.id, droppedAt: '2025-01-01T00:00:00Z' }] });
    usePackStore.getState().restoreItem(root.id);
    expect(usePackStore.getState().items[1].droppedAt).toBeTruthy();
  });
});
