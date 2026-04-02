import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PackItem, AgentNote, JournalEntry, UserProfile, Compartment, TerrainType, RecoveryCheck } from '../types';
import { calculatePaceScore } from '../utils/paceScore';
import { calculateLoadBalance } from '../utils/loadBalance';
import { runWeightDecay } from '../utils/weightDecay';

interface PackStore {
  items: PackItem[];
  agentNotes: AgentNote[];
  journal: JournalEntry[];
  profile: UserProfile;
  onboardingComplete: boolean;
  lastDecayRun: string | null;

  // Item actions
  addItem: (item: Omit<PackItem, 'id' | 'createdAt' | 'updatedAt' | 'agentNotes' | 'weightHistory' | 'utilityHistory' | 'completedSteps'>) => void;
  updateItem: (id: string, updates: Partial<Pick<PackItem, 'name' | 'description' | 'weight' | 'utility' | 'compartment' | 'tags'>>) => void;
  dropItem: (id: string, releaseNote?: string) => void;
  restoreItem: (id: string) => void;

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
        const item: PackItem = {
          ...itemData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          agentNotes: [],
          completedSteps: [],
          weightHistory: [{ date: now, value: itemData.weight }],
          utilityHistory: [{ date: now, value: itemData.utility }],
        };
        set(state => ({ items: [...state.items, item] }));
      },

      updateItem: (id, updates) => {
        const now = new Date().toISOString();
        set(state => ({
          items: state.items.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, ...updates, updatedAt: now };
            if (updates.weight !== undefined && updates.weight !== item.weight) {
              updated.weightHistory = [...item.weightHistory, { date: now, value: updates.weight }];
            }
            if (updates.utility !== undefined && updates.utility !== item.utility) {
              updated.utilityHistory = [...item.utilityHistory, { date: now, value: updates.utility }];
            }
            return updated;
          }),
        }));
      },

      dropItem: (id, releaseNote) => {
        const now = new Date().toISOString();
        set(state => ({
          items: state.items.map(item =>
            item.id === id
              ? { ...item, droppedAt: now, updatedAt: now, ...(releaseNote ? { releaseNote } : {}) }
              : item,
          ),
        }));
      },

      restoreItem: (id) => {
        const now = new Date().toISOString();
        set(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, droppedAt: undefined, updatedAt: now } : item,
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
        const items = get().items.filter(i => i.compartment === compartment && !i.droppedAt);
        return {
          count: items.length,
          totalWeight: items.reduce((s, i) => s + i.weight, 0),
          totalUtility: items.reduce((s, i) => s + i.utility, 0),
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
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          const profile = state.profile as Record<string, unknown>;
          if (profile) {
            profile.recoveryHistory = profile.recoveryHistory ?? [];
            profile.loadBalanceHistory = profile.loadBalanceHistory ?? [];
          }
        }
        return state;
      },
    },
  ),
);
