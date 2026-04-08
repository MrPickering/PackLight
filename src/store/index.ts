import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PackItem, AgentNote, JournalEntry, UserProfile, Compartment, TerrainType, RecoveryCheck } from '../types';
import { calculatePaceScore } from '../utils/paceScore';
import { calculateLoadBalance } from '../utils/loadBalance';
import { runWeightDecay } from '../utils/weightDecay';

function dimensionsToWeight(d: PackItem['weightDimensions']): number {
  if (!d) return 0;
  return Math.round((d.stress + d.worry + d.cognitive + d.urgency + d.emotional) / 2.5);
}

interface PackStore {
  items: PackItem[];
  agentNotes: AgentNote[];
  journal: JournalEntry[];
  profile: UserProfile;
  onboardingComplete: boolean;
  lastDecayRun: string | null;

  // Item actions
  addItem: (item: Omit<PackItem, 'id' | 'createdAt' | 'updatedAt' | 'agentNotes' | 'weightHistory' | 'utilityHistory' | 'completedSteps' | 'parentId' | 'isContainer' | 'originalWeight' | 'originalUtility'> & { parentId?: string | null }) => void;
  updateItem: (id: string, updates: Partial<Pick<PackItem, 'name' | 'description' | 'weight' | 'utility' | 'compartment' | 'tags' | 'weightDimensions'>>) => void;
  dropItem: (id: string, releaseNote?: string, cascade?: boolean) => void;
  restoreItem: (id: string) => void;
  markAsContainer: (id: string) => void;

  // Lightening actions
  setLighteningApproach: (id: string, approach: string) => void;
  setNextStep: (id: string, text: string) => void;
  completeNextStep: (id: string) => void;

  // Agent notes
  addAgentNote: (note: AgentNote) => void;
  updateNoteStatus: (id: string, status: AgentNote['status']) => void;

  // Journal
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  approveDetectedItem: (entryId: string, itemIndex: number) => void;

  // Profile
  setProfile: (updates: Partial<UserProfile>) => void;
  setTerrain: (terrain: TerrainType) => void;
  completeOnboarding: () => void;

  // Recovery
  addRecoveryCheck: (check: Omit<RecoveryCheck, 'id'>) => void;

  // Hierarchy helpers
  getChildItems: (parentId: string) => PackItem[];
  getRootItems: () => PackItem[];
  getEffectiveWeight: (itemId: string) => number;
  getEffectiveUtility: (itemId: string) => number;
  getItemDepth: (itemId: string) => number;
  getItemAncestors: (itemId: string) => PackItem[];
  getDescendants: (itemId: string) => PackItem[];
  getLeafItems: () => PackItem[];

  // Computed
  getPaceScore: () => number;
  getLoadBalance: () => { score: number; recovery: number; strain: number };
  getActiveItems: () => PackItem[];
  getDroppedItems: () => PackItem[];
  getCompartmentItems: (compartment: Compartment) => PackItem[];
  getCompartmentStats: (compartment: Compartment) => { count: number; totalWeight: number; totalUtility: number };

  // Weight decay
  checkAndRunDecay: () => void;
}

export const usePackStore = create<PackStore>()(
  persist(
    (set, get) => ({
      items: [],
      agentNotes: [],
      journal: [],
      profile: {
        name: '',
        currentTerrain: 'camp' as TerrainType,
        terrainSetAt: new Date().toISOString(),
        paceScoreHistory: [],
        recoveryHistory: [],
        loadBalanceHistory: [],
      },
      onboardingComplete: false,
      lastDecayRun: null,

      addItem: (itemData) => {
        const now = new Date().toISOString();
        const parentId = itemData.parentId ?? null;

        // Enforce depth limit of 3
        if (parentId) {
          const depth = get().getItemDepth(parentId);
          if (depth >= 2) return; // parent is already at max depth
        }

        const weight = itemData.weightDimensions
          ? dimensionsToWeight(itemData.weightDimensions)
          : itemData.weight;

        const item: PackItem = {
          ...itemData,
          parentId,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          agentNotes: [],
          completedSteps: [],
          isContainer: false,
          originalWeight: weight,
          originalUtility: itemData.utility,
          weight,
          weightHistory: [{ date: now, value: weight }],
          utilityHistory: [{ date: now, value: itemData.utility }],
        };

        set(state => {
          let items = [...state.items, item];
          // Mark parent as container
          if (parentId) {
            items = items.map(i =>
              i.id === parentId ? { ...i, isContainer: true, updatedAt: now } : i,
            );
          }
          return { items };
        });
      },

      updateItem: (id, updates) => {
        const now = new Date().toISOString();
        set(state => ({
          items: state.items.map(item => {
            if (item.id !== id) return item;

            let newWeight = updates.weight;
            if (updates.weightDimensions) {
              newWeight = dimensionsToWeight(updates.weightDimensions);
            }

            const updated = {
              ...item,
              ...updates,
              ...(newWeight !== undefined ? { weight: newWeight } : {}),
              updatedAt: now,
            };

            if (newWeight !== undefined && newWeight !== item.weight) {
              updated.weightHistory = [...item.weightHistory, { date: now, value: newWeight }];
            }
            if (updates.utility !== undefined && updates.utility !== item.utility) {
              updated.utilityHistory = [...item.utilityHistory, { date: now, value: updates.utility }];
            }
            return updated;
          }),
        }));

        // Touch parent's updatedAt
        const item = get().items.find(i => i.id === id);
        if (item?.parentId) {
          set(state => ({
            items: state.items.map(i =>
              i.id === item.parentId ? { ...i, updatedAt: now } : i,
            ),
          }));
        }
      },

      dropItem: (id, releaseNote, cascade = true) => {
        const now = new Date().toISOString();
        const descendants = cascade ? get().getDescendants(id) : [];
        const dropIds = new Set([id, ...descendants.map(d => d.id)]);

        set(state => ({
          items: state.items.map(item => {
            if (dropIds.has(item.id)) {
              return { ...item, droppedAt: now, updatedAt: now, ...(item.id === id && releaseNote ? { releaseNote } : {}) };
            }
            // If not cascading, orphan children to root
            if (!cascade && item.parentId === id) {
              return { ...item, parentId: null, updatedAt: now };
            }
            return item;
          }),
        }));
      },

      restoreItem: (id) => {
        const now = new Date().toISOString();
        const descendants = get().getDescendants(id);
        const restoreIds = new Set([id, ...descendants.map(d => d.id)]);

        set(state => ({
          items: state.items.map(item =>
            restoreIds.has(item.id) ? { ...item, droppedAt: undefined, updatedAt: now } : item,
          ),
        }));
      },

      markAsContainer: (id) => {
        set(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, isContainer: true } : item,
          ),
        }));
      },

      setLighteningApproach: (id, approach) => {
        const now = new Date().toISOString();
        set(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, lighteningApproach: approach, updatedAt: now } : item,
          ),
        }));
      },

      setNextStep: (id, text) => {
        const now = new Date().toISOString();
        set(state => ({
          items: state.items.map(item =>
            item.id === id
              ? { ...item, nextStep: { text, createdAt: now }, updatedAt: now }
              : item,
          ),
        }));
      },

      completeNextStep: (id) => {
        const now = new Date().toISOString();
        set(state => ({
          items: state.items.map(item => {
            if (item.id !== id || !item.nextStep) return item;
            return {
              ...item,
              completedSteps: [
                ...(item.completedSteps || []),
                { text: item.nextStep.text, completedAt: now },
              ],
              nextStep: undefined,
              updatedAt: now,
            };
          }),
        }));
      },

      addAgentNote: (note) => {
        set(state => ({
          agentNotes: [note, ...state.agentNotes],
          items: state.items.map(item =>
            note.relatedItemIds.includes(item.id)
              ? { ...item, agentNotes: [note, ...item.agentNotes] }
              : item,
          ),
        }));
      },

      updateNoteStatus: (id, status) => {
        set(state => ({
          agentNotes: state.agentNotes.map(n => (n.id === id ? { ...n, status } : n)),
          items: state.items.map(item => ({
            ...item,
            agentNotes: item.agentNotes.map(n => (n.id === id ? { ...n, status } : n)),
          })),
        }));
      },

      addJournalEntry: (entryData) => {
        const entry: JournalEntry = {
          ...entryData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set(state => ({ journal: [entry, ...state.journal] }));
      },

      approveDetectedItem: (entryId, itemIndex) => {
        const state = get();
        const entry = state.journal.find(e => e.id === entryId);
        if (!entry) return;
        const detected = entry.detectedItems[itemIndex];
        if (!detected || detected.approved) return;

        state.addItem({
          name: detected.name,
          compartment: detected.compartment,
          weight: detected.suggestedWeight,
          utility: detected.suggestedUtility,
          description: `Detected from journal entry on ${new Date(entry.createdAt).toLocaleDateString()}`,
          tags: ['journal-detected'],
        });

        set(state => ({
          journal: state.journal.map(e =>
            e.id === entryId
              ? {
                  ...e,
                  detectedItems: e.detectedItems.map((d, i) =>
                    i === itemIndex ? { ...d, approved: true } : d,
                  ),
                }
              : e,
          ),
        }));
      },

      setProfile: (updates) => {
        set(state => ({ profile: { ...state.profile, ...updates } }));
      },

      setTerrain: (terrain) => {
        set(state => ({
          profile: { ...state.profile, currentTerrain: terrain, terrainSetAt: new Date().toISOString() },
        }));
      },

      completeOnboarding: () => {
        set({ onboardingComplete: true });
      },

      addRecoveryCheck: (check) => {
        const recovery: RecoveryCheck = { ...check, id: crypto.randomUUID() };
        set(state => ({
          profile: {
            ...state.profile,
            recoveryHistory: [...state.profile.recoveryHistory, recovery],
          },
        }));
      },

      // ── Hierarchy helpers ──

      getChildItems: (parentId) =>
        get().items.filter(i => i.parentId === parentId && !i.droppedAt)
          .sort((a, b) => b.weight - a.weight),

      getRootItems: () =>
        get().items.filter(i => i.parentId === null && !i.droppedAt),

      getEffectiveWeight: (itemId) => {
        const state = get();
        const children = state.items.filter(i => i.parentId === itemId && !i.droppedAt);
        if (children.length === 0) {
          const item = state.items.find(i => i.id === itemId);
          return item?.weight ?? 0;
        }
        return children.reduce((sum, child) => sum + state.getEffectiveWeight(child.id), 0);
      },

      getEffectiveUtility: (itemId) => {
        const state = get();
        const children = state.items.filter(i => i.parentId === itemId && !i.droppedAt);
        if (children.length === 0) {
          const item = state.items.find(i => i.id === itemId);
          return item?.utility ?? 0;
        }
        return children.reduce((sum, child) => sum + state.getEffectiveUtility(child.id), 0);
      },

      getItemDepth: (itemId) => {
        const items = get().items;
        let depth = 0;
        let current = items.find(i => i.id === itemId);
        while (current?.parentId) {
          depth++;
          current = items.find(i => i.id === current!.parentId);
        }
        return depth;
      },

      getItemAncestors: (itemId) => {
        const items = get().items;
        const ancestors: PackItem[] = [];
        let current = items.find(i => i.id === itemId);
        while (current?.parentId) {
          const parent = items.find(i => i.id === current!.parentId);
          if (parent) ancestors.push(parent);
          current = parent;
        }
        return ancestors;
      },

      getDescendants: (itemId) => {
        const items = get().items;
        const result: PackItem[] = [];
        const queue = [itemId];
        while (queue.length > 0) {
          const pid = queue.shift()!;
          const children = items.filter(i => i.parentId === pid);
          result.push(...children);
          queue.push(...children.map(c => c.id));
        }
        return result;
      },

      getLeafItems: () => {
        const items = get().items.filter(i => !i.droppedAt);
        const parentIds = new Set(items.map(i => i.parentId).filter(Boolean));
        return items.filter(i => !parentIds.has(i.id));
      },

      // ── Computed ──

      getPaceScore: () => {
        const { items, profile } = get();
        return calculatePaceScore(items, profile.currentTerrain);
      },

      getLoadBalance: () => {
        const { items, profile } = get();
        return calculateLoadBalance(items, profile.currentTerrain, profile.recoveryHistory);
      },

      getActiveItems: () => get().items.filter(i => !i.droppedAt),

      getDroppedItems: () => get().items.filter(i => !!i.droppedAt),

      getCompartmentItems: (compartment) =>
        get().items.filter(i => i.compartment === compartment && !i.droppedAt),

      getCompartmentStats: (compartment) => {
        // Use leaf items only to avoid double-counting
        const allActive = get().items.filter(i => !i.droppedAt);
        const parentIds = new Set(allActive.filter(i => i.parentId).map(i => i.parentId));
        const leafItems = allActive.filter(i => i.compartment === compartment && !parentIds.has(i.id));
        return {
          count: allActive.filter(i => i.compartment === compartment).length,
          totalWeight: leafItems.reduce((s, i) => s + i.weight, 0),
          totalUtility: leafItems.reduce((s, i) => s + i.utility, 0),
        };
      },

      checkAndRunDecay: () => {
        const { lastDecayRun, items } = get();
        if (lastDecayRun) {
          const daysSince = Math.floor((Date.now() - new Date(lastDecayRun).getTime()) / (1000 * 60 * 60 * 24));
          if (daysSince < 7) return;
        }

        const { updatedItems, newNotes } = runWeightDecay(items);
        set(state => ({
          items: updatedItems,
          agentNotes: [...newNotes, ...state.agentNotes],
          lastDecayRun: new Date().toISOString(),
        }));
      },
    }),
    {
      name: 'packlight-store',
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          const profile = state.profile as Record<string, unknown>;
          if (profile) {
            profile.recoveryHistory = profile.recoveryHistory ?? [];
            profile.loadBalanceHistory = profile.loadBalanceHistory ?? [];
          }
        }
        if (version < 3) {
          const items = (state.items ?? []) as Record<string, unknown>[];
          state.items = items.map(item => ({
            ...item,
            parentId: item.parentId ?? null,
            isContainer: item.isContainer ?? false,
            originalWeight: item.originalWeight ?? item.weight,
            originalUtility: item.originalUtility ?? item.utility,
          }));
        }
        return state;
      },
    },
  ),
);
