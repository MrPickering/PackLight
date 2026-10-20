import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as NativeApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { localDay } from './utils/dates';
import { StorageNotice } from './components/shared/AppRecovery';
import { usePackStore } from './store';
import Layout from './components/layout/Layout';
import PackView from './components/pack/PackView';
import JournalPage from './components/journal/JournalPage';
import AgentFeed from './components/agents/AgentFeed';
import RepackMode from './components/repack/RepackMode';
import DecomposeFlow from './components/decompose/DecomposeFlow';
import SettingsPage from './components/settings/SettingsPage';
import Onboarding from './components/onboarding/Onboarding';
import FirstSteps from './components/onboarding/FirstSteps';
import DisplayModeProvider from './components/shared/DisplayModeProvider';
import PrivacyPage from './components/settings/PrivacyPage';

const CompartmentDetail = lazy(() => import('./components/pack/CompartmentDetail'));
const TrailMap = lazy(() => import('./components/trail/TrailMap'));

function HomeRoute() {
  const firstStepsComplete = usePackStore(s => s.profile.firstStepsComplete);
  return firstStepsComplete ? <PackView /> : <FirstSteps />;
}

export default function App() {
  const onboardingComplete = usePackStore(s => s.onboardingComplete);
  const checkAndRunDecay = usePackStore(s => s.checkAndRunDecay);
  const getLoadBalance = usePackStore(s => s.getLoadBalance);
  const profile = usePackStore(s => s.profile);
  const setProfile = usePackStore(s => s.setProfile);
  const items = usePackStore(s => s.items);

  // Run weight decay check on app open
  useEffect(() => {
    checkAndRunDecay();
  }, [checkAndRunDecay]);

  // Record load balance periodically
  useEffect(() => {
    if (!onboardingComplete) return;
    const { score } = getLoadBalance();
    const history = usePackStore.getState().profile.loadBalanceHistory;
    const today = localDay();
    setProfile({ loadBalanceHistory: [...history.filter(entry => localDay(entry.date) !== today), { date: new Date().toISOString(), value: score }] });
  }, [getLoadBalance, items, profile.currentTerrain, profile.recoveryHistory, onboardingComplete, setProfile]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = NativeApp.addListener('backButton', () => {
      if (document.querySelector('[aria-modal="true"]')) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      } else if (window.location.hash && window.location.hash !== '#/') window.history.back();
      else void NativeApp.minimizeApp();
    });
    return () => { void listener.then(handle => handle.remove()); };
  }, []);

  return (
    <DisplayModeProvider>
      <StorageNotice />
      <HashRouter>
        <Suspense fallback={<p role="status" className="p-6">Opening your pack…</p>}>
        <Routes>
          <Route path="/privacy" element={<PrivacyPage />} />
          {!onboardingComplete ? <Route path="*" element={<Onboarding />} /> : <Route element={<Layout />}>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/pack/:compartment" element={<CompartmentDetail />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/agents" element={<AgentFeed />} />
            <Route path="/trail" element={<TrailMap />} />
            <Route path="/repack" element={<RepackMode />} />
            <Route path="/decompose" element={<DecomposeFlow />} />
            <Route path="/decompose/:itemId" element={<DecomposeFlow />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>}
        </Routes>
        </Suspense>
      </HashRouter>
    </DisplayModeProvider>
  );
}
