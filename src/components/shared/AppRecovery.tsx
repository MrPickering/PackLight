import { Component, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { getStorageError, packStorage, subscribeStorage } from '../../utils/storage';
import { saveFile } from '../../utils/files';

export function StorageNotice() {
  const error = useSyncExternalStore(subscribeStorage, getStorageError);
  return error ? <div role="alert" className="fixed top-0 inset-x-0 z-[100] bg-rose-950 text-white p-4 text-sm">{error}</div> : null;
}

export function RecoveryScreen() {
  const [status, setStatus] = useState('');
  return <main className="p-6 max-w-lg m-auto space-y-4">
    <h1 className="text-xl font-semibold">Your pack could not be opened</h1>
    <p>Your saved data has not been cleared. Export it before trying recovery. If it came from a newer app version, update PackLight first.</p>
    <button className="block bg-amber-500 text-slate-950 p-3 rounded-lg" onClick={async () => {
      try { const raw = await packStorage.getItem('packlight-store'); await saveFile('packlight-recovery.json', raw ?? '{}'); setStatus('Recovery file handed to your device.'); }
      catch { setStatus('Export failed. Your saved data has been left in place.'); }
    }}>Export saved data</button>
    <button className="block bg-slate-800 p-3 rounded-lg" onClick={() => window.location.reload()}>Try reopening</button>
    <p role="status">{status}</p>
    <a className="text-amber-400 underline" href="https://github.com/MrPickering/PackLight/issues" target="_blank" rel="noreferrer">Get help without sharing private data publicly</a>
  </main>;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <RecoveryScreen /> : this.props.children; }
}
