import { useState } from 'react';
import { Download, Upload, Trash2, Eye, EyeOff } from 'lucide-react';
import { usePackStore } from '../../store';
import { TERRAIN_META, DEFAULT_CONTEXTS } from '../../types';
import type { TerrainType, DisplayMode } from '../../types';

const DISPLAY_MODES: { id: DisplayMode; label: string; description: string }[] = [
  { id: 'default', label: 'Default', description: 'Full interface, all features visible' },
  { id: 'focused', label: 'Focused', description: 'One thing at a time, minimal navigation' },
  { id: 'structured', label: 'Structured', description: 'Full tree view, explicit categories, predictable layout' },
  { id: 'low-energy', label: 'Low Energy', description: 'Top-level only, one-tap interactions, minimal demand' },
  { id: 'gentle', label: 'Gentle', description: 'Progress-oriented framing, no alarming totals' },
];

export default function SettingsPage() {
  const profile = usePackStore(s => s.profile);
  const setProfile = usePackStore(s => s.setProfile);
  const setTerrain = usePackStore(s => s.setTerrain);
  const setDisplayMode = usePackStore(s => s.setDisplayMode);
  const items = usePackStore(s => s.items);
  const journal = usePackStore(s => s.journal);
  const agentNotes = usePackStore(s => s.agentNotes);

  const [apiKey, setApiKey] = useState(localStorage.getItem('packlight-api-key') ?? '');
  const [showKey, setShowKey] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('packlight-api-key', apiKey.trim());
    } else {
      localStorage.removeItem('packlight-api-key');
    }
  };

  const handleExport = () => {
    const data = {
      version: 3,
      exportedAt: new Date().toISOString(),
      profile,
      items,
      journal,
      agentNotes,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `packlight-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.version >= 1 && data.version <= 3) {
          const importedProfile = {
            ...data.profile,
            recoveryHistory: data.profile.recoveryHistory ?? [],
            loadBalanceHistory: data.profile.loadBalanceHistory ?? [],
            displayMode: data.profile.displayMode ?? 'default',
            contexts: data.profile.contexts ?? DEFAULT_CONTEXTS,
            activeContext: data.profile.activeContext ?? null,
          };
          const importedItems = (data.items ?? []).map((item: Record<string, unknown>) => ({
            ...item,
            parentId: item.parentId ?? null,
            isContainer: item.isContainer ?? false,
            originalWeight: item.originalWeight ?? item.weight,
            originalUtility: item.originalUtility ?? item.utility,
            contexts: item.contexts ?? [],
          }));
          usePackStore.setState({
            profile: importedProfile,
            items: importedItems,
            journal: data.journal,
            agentNotes: data.agentNotes,
          });
        }
      } catch {
        // Invalid file
      }
    };
    input.click();
  };

  const handleClear = () => {
    usePackStore.setState({
      items: [],
      agentNotes: [],
      journal: [],
      profile: {
        name: '', currentTerrain: 'camp', terrainSetAt: new Date().toISOString(),
        paceScoreHistory: [], recoveryHistory: [], loadBalanceHistory: [],
        displayMode: 'default', contexts: DEFAULT_CONTEXTS, activeContext: null,
      },
      onboardingComplete: false,
      lastDecayRun: null,
    });
    localStorage.removeItem('packlight-api-key');
    setApiKey('');
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-8 pb-20 md:pb-0 max-w-lg">
      <h1 className="text-xl font-semibold text-white">Settings</h1>

      {/* Profile */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-slate-400">Profile</h2>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Display Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={e => setProfile({ name: e.target.value })}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-2">How does life feel?</label>
          <div className="grid grid-cols-3 gap-2">
            {(['summit', 'downhill', 'camp', 'uphill', 'ridge', 'swamp'] as TerrainType[]).map(t => {
              const meta = TERRAIN_META[t];
              return (
                <button
                  key={t}
                  onClick={() => setTerrain(t)}
                  className={`p-2 rounded-lg text-left text-xs transition-colors ${
                    profile.currentTerrain === t
                      ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {meta.emoji} {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Display Mode */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-slate-400">Display Mode</h2>
        <p className="text-xs text-slate-600">Different brains process load differently. Choose what works for you.</p>
        <div className="space-y-2">
          {DISPLAY_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => setDisplayMode(mode.id)}
              className={`w-full p-3 rounded-xl text-left transition-colors ${
                profile.displayMode === mode.id
                  ? 'bg-amber-500/20 border border-amber-500/30'
                  : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-sm font-medium text-white">{mode.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{mode.description}</div>
            </button>
          ))}
        </div>
      </section>

      {/* API Key */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-slate-400">Anthropic API Key</h2>
        <p className="text-xs text-slate-600">Optional. Enables AI agent conversations and journal analysis. Stored locally in your browser. The app works fully without it.</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-amber-500/50 pr-10"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button
            onClick={handleSaveKey}
            className="px-4 py-2 bg-amber-500 text-slate-950 rounded-lg text-sm font-medium hover:bg-amber-400 transition-colors"
          >
            Save
          </button>
        </div>
      </section>

      {/* Data */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-slate-400">Data</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Download size={14} /> Export Pack
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Upload size={14} /> Import Pack
          </button>
          {showClearConfirm ? (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-400 transition-colors"
            >
              <Trash2 size={14} /> Confirm Clear All
            </button>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-rose-500/30 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 size={14} /> Clear All Data
            </button>
          )}
        </div>
      </section>

      {/* About */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-slate-400">About</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-white font-medium">PackLight v0.1.0</p>
          <p className="text-xs text-slate-500 mt-1">
            Cognitive load management. See, quantify, and manage what you carry.
          </p>
          <p className="text-xs text-slate-600 mt-2">
            {items.length} items | {journal.length} journal entries | {agentNotes.length} agent notes
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Open source under MIT License
          </p>
        </div>
      </section>
    </div>
  );
}
