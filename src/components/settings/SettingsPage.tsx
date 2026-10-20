import { useRef, useState } from 'react';
import { usePackStore } from '../../store';
import { TERRAIN_META, DEFAULT_CONTEXTS } from '../../types';
import type { TerrainType, DisplayMode } from '../../types';
import { createBackup, parseBackup, MAX_BACKUP_BYTES } from '../../utils/backup';
import type { PackData } from '../../utils/backup';
import { saveFile } from '../../utils/files';
import { configureAI, getApiKey } from '../../utils/api';
import { flushStorage } from '../../utils/storage';

const modes: { id: DisplayMode; label: string; description: string }[] = [
  { id: 'default', label: 'Default', description: 'Full interface with all features' },
  { id: 'focused', label: 'Focused', description: 'Fewer items and prompts at once' },
  { id: 'structured', label: 'Structured', description: 'Explicit categories and a full tree' },
  { id: 'low-energy', label: 'Low Energy', description: 'A smaller overview with fewer demands' },
  { id: 'gentle', label: 'Gentle', description: 'Progress framing without numeric totals' },
];
const button = 'px-4 py-3 rounded-lg bg-slate-800 text-sm text-white hover:bg-slate-700 disabled:opacity-40';

export default function SettingsPage() {
  const profile = usePackStore(s => s.profile);
  const setProfile = usePackStore(s => s.setProfile);
  const setTerrain = usePackStore(s => s.setTerrain);
  const setDisplayMode = usePackStore(s => s.setDisplayMode);
  const [apiKey, setApiKey] = useState(getApiKey);
  const [consent, setConsent] = useState(!!getApiKey());
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<PackData | null>(null);
  const [clearing, setClearing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const report = (cause: unknown) => setError(cause instanceof Error ? cause.message : 'The operation could not be completed.');

  async function exportPack() {
    setError(''); setStatus('');
    try {
      await saveFile(`packlight-export-${new Date().toISOString().slice(0, 10)}.json`, createBackup(usePackStore.getState()));
      setStatus('Backup handed to your device. Keep it somewhere private.');
    } catch (cause) { report(cause); }
  }
  async function importPack() {
    if (!pending) return;
    setError('');
    usePackStore.setState(pending);
    setPending(null);
    try { await flushStorage(); setStatus('Pack imported and saved.'); } catch (cause) { report(cause); }
  }
  async function clearPack() {
    configureAI('', false);
    usePackStore.setState({
      items: [], journal: [], agentNotes: [], onboardingComplete: false, lastDecayRun: null,
      profile: { name: '', currentTerrain: 'camp', terrainSetAt: new Date().toISOString(), paceScoreHistory: [], recoveryHistory: [], loadBalanceHistory: [], displayMode: 'default', contexts: DEFAULT_CONTEXTS, activeContext: null, firstStepsComplete: false, firstStepsStep: 0, onboardingCompletedAt: '', dismissedPrompts: [] },
    });
    try { await flushStorage(); } catch (cause) { report(cause); }
  }

  return <div className="space-y-8 pb-20 max-w-lg">
    <h1 className="text-xl font-semibold text-white">Settings</h1>
    {status && <p role="status" className="text-sm text-emerald-400">{status}</p>}
    {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
    <section className="space-y-3">
      <h2 className="text-lg text-white">Profile</h2>
      <label className="block text-sm">Display Name
        <input className="block w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg p-3" value={profile.name} maxLength={100} onChange={e => setProfile({ name: e.target.value })} />
      </label>
      <p className="text-sm">Current terrain</p>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(TERRAIN_META) as TerrainType[]).map(t => <button key={t} aria-pressed={profile.currentTerrain === t} onClick={() => setTerrain(t)} className={`${button} ${profile.currentTerrain === t ? 'ring-2 ring-amber-400' : ''}`}>{TERRAIN_META[t].emoji} {TERRAIN_META[t].label}</button>)}
      </div>
    </section>
    <section className="space-y-3">
      <h2 className="text-lg text-white">Display Mode</h2>
      {modes.map(mode => <button key={mode.id} onClick={() => setDisplayMode(mode.id)} aria-pressed={profile.displayMode === mode.id} className={`${button} block w-full text-left ${profile.displayMode === mode.id ? 'ring-2 ring-amber-400' : ''}`}><span className="block font-medium">{mode.label}</span><span className="text-slate-400">{mode.description}</span></button>)}
    </section>
    <section className="space-y-3">
      <h2 className="text-lg text-white">Optional AI</h2>
      <p className="text-sm">Core features work without AI. When you choose Analyze or send an agent message, your journal text and mood, or your message and the displayed item context, go directly to Anthropic. Their API terms and charges apply. AI may be wrong and is not medical advice.</p>
      <p className="text-sm">Your key is kept in memory for this session only. Previously saved keys are no longer used. PackLight has no server proxy; use this only on a device you trust.</p>
      <a className="text-amber-400 underline" href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noreferrer">Anthropic privacy policy</a>
      <label className="flex gap-3 items-start text-sm"><input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); if (!e.target.checked) { configureAI('', false); setStatus('AI disabled.'); } }} className="mt-1" />I understand and allow these AI requests when I choose to send them.</label>
      <label className="block text-sm">Anthropic API key
        <input type="password" autoComplete="off" spellCheck={false} className="block w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg p-3" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-..." />
      </label>
      <div className="flex gap-2">
        <button className={button} disabled={!apiKey.trim() || !consent} onClick={() => { try { configureAI(apiKey, consent); setError(''); setStatus('AI enabled for this session.'); } catch (cause) { report(cause); } }}>Enable for this session</button>
        <button className={button} onClick={() => { configureAI('', false); setApiKey(''); setConsent(false); setStatus('AI disabled.'); }}>Disable AI</button>
      </div>
    </section>
    <section className="space-y-3">
      <h2 className="text-lg text-white">Your Data</h2>
      <p className="text-sm">Your pack is saved on this device. There is no account or cloud sync. Uninstalling the app or clearing browser data can erase it. Export backups regularly; backup files contain unencrypted personal information.</p>
      <div className="flex flex-wrap gap-2">
        <button className={button} onClick={exportPack}>Export Pack</button>
        <button className={button} onClick={() => fileInput.current?.click()}>Import Pack</button>
        <button className={button} onClick={() => setClearing(true)}>Clear All Data</button>
      </div>
      <input ref={fileInput} aria-label="Choose PackLight backup" className="hidden" type="file" accept=".json,application/json" onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = ''; setPending(null); setError(''); setStatus('');
        if (!file) return;
        try { if (file.size > MAX_BACKUP_BYTES) throw new Error('Choose a backup smaller than 10 MB.'); setPending(parseBackup(await file.text())); } catch (cause) { report(cause); }
      }} />
      {pending && <div className="p-4 border border-amber-400 rounded-lg space-y-3" role="region" aria-label="Confirm import">
        <p>This backup has {pending.items.length} items and {pending.journal.length} journal entries. Importing replaces your current pack. Export it first if you want to keep it.</p>
        <button className={button} onClick={importPack}>Replace with backup</button>{' '}<button className={button} onClick={() => setPending(null)}>Cancel import</button>
      </div>}
      {clearing && <div className="p-4 border border-rose-400 rounded-lg space-y-3">
        <p>Delete this device’s items, journals, history, and AI key? This cannot be undone. Export a backup first if you want to keep them.</p>
        <button className={button} onClick={clearPack}>Confirm Clear All</button>{' '}<button className={button} onClick={() => setClearing(false)}>Cancel</button>
      </div>}
    </section>
    <section className="space-y-3 text-sm">
      <h2 className="text-lg text-white">PackLight 1.0.0</h2>
      <p>A personal reflection tool for seeing and organizing what you carry. Scores are subjective prompts, not validated health measurements, diagnoses, or treatment.</p>
      <p>If you need urgent help, contact local emergency services or a qualified professional. PackLight does not monitor entries.</p>
      <div className="flex gap-4"><a className="text-amber-400 underline" href="#/privacy">Privacy</a><a className="text-amber-400 underline" href="https://github.com/MrPickering/PackLight/issues" target="_blank" rel="noreferrer">Support</a></div>
    </section>
  </div>;
}
