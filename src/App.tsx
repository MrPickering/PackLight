import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { usePackStore } from './store';
import Layout from './components/layout/Layout';
import PackView from './components/pack/PackView';
import CompartmentDetail from './components/pack/CompartmentDetail';
import JournalPage from './components/journal/JournalPage';
import AgentFeed from './components/agents/AgentFeed';
import TrailMap from './components/trail/TrailMap';
import RepackMode from './components/repack/RepackMode';
import SettingsPage from './components/settings/SettingsPage';
import Onboarding from './components/onboarding/Onboarding';

export default function App() {
  const onboardingComplete = usePackStore(s => s.onboardingComplete);
  const checkAndRunDecay = usePackStore(s => s.checkAndRunDecay);
  const getPaceScore = usePackStore(s => s.getPaceScore);
  const profile = usePackStore(s => s.profile);
  const setProfile = usePackStore(s => s.setProfile);

  // Run weight decay check on app open
  useEffect(() => {
    checkAndRunDecay();
  }, [checkAndRunDecay]);

  // Record pace score periodically
  useEffect(() => {
    const score = getPaceScore();
    const last = profile.paceScoreHistory[profile.paceScoreHistory.length - 1];
    const today = new Date().toISOString().split('T')[0];
    if (!last || last.date.split('T')[0] !== today) {
      setProfile({
        paceScoreHistory: [...profile.paceScoreHistory, { date: new Date().toISOString(), value: score }],
      });
    }
  }, [getPaceScore, profile.paceScoreHistory, setProfile]);

  if (!onboardingComplete) {
    return <Onboarding />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<PackView />} />
          <Route path="/pack/:compartment" element={<CompartmentDetail />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/agents" element={<AgentFeed />} />
          <Route path="/trail" element={<TrailMap />} />
          <Route path="/repack" element={<RepackMode />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
