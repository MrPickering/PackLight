import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { StateStorage } from 'zustand/middleware';

let storageError = '';
let hydrationError: unknown;
const listeners = new Set<() => void>();
function reportError(message: string) {
  storageError = message;
  listeners.forEach(listener => listener());
}
export const subscribeStorage = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const getStorageError = () => storageError;
export const setHydrationError = (error: unknown) => { hydrationError = error; };
export const getHydrationError = () => hydrationError;

// Serialize native writes so older state can never finish saving after newer state.
let writes = Promise.resolve();
export const packStorage: StateStorage = {
  async getItem(key) {
    if (!Capacitor.isNativePlatform()) return localStorage.getItem(key);
    const { value } = await Preferences.get({ key });
    if (value !== null) return value;
    const legacy = localStorage.getItem(key);
    if (legacy !== null) {
      await Preferences.set({ key, value: legacy });
      localStorage.removeItem(key);
    }
    return legacy;
  },
  setItem(key, value) {
    writes = writes.then(async () => {
      try {
        if (Capacitor.isNativePlatform()) await Preferences.set({ key, value });
        else localStorage.setItem(key, value);
        reportError('');
      } catch {
        reportError('Your latest changes could not be saved on this device. Export a backup before closing PackLight.');
      }
    });
    return writes;
  },
  async removeItem(key) {
    await writes;
    if (Capacitor.isNativePlatform()) await Preferences.remove({ key });
    localStorage.removeItem(key);
  },
};
export async function flushStorage() { await writes; if (storageError) throw new Error(storageError); }
