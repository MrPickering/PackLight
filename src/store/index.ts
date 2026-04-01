import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PackItem, AgentNote, JournalEntry, UserProfile, Compartment, TerrainType } from '../types';
import { calculatePaceScore } from '../utils/paceScore';
import { runWeightDecay } from '../utils/weightDecay';

interface PackStore {
  items: PackItem[];
  agentNotes: AgentNote[];
  journal: JournalEntry[];
  profile: UserProfile;
  onboardingComplete: boolean;
  lastDecayRun: string | null;

  // Item actions
  addItem: (item: Omit<PackItem, 'id' | 'createdAt' | 'updatedAt' | 'agentNotes' | 'weightHistory' | 'utilityHistory'>) => void;
  updateItem: (id: string, updates: Partial<Pick<PackItem, 'name' | 'description' | 'weight' | 'utility' | 'compartment' | 'tags'>>) => void;
  dropItem: (id: string) => void;
  restoreItem: (id: string) => void;

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

  // Computed
  getPaceScore: () => number;
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

      dropItem: (id) => {
        const now = new Date().toISOString();
        set(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, droppedAt: now, updatedAt: now } : item,
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

      getPaceScore: () => {
        const { items, profile } = get();
        return calculatePaceScore(items, profile.currentTerrain);
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
    },
  ),
);
