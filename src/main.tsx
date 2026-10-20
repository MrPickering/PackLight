import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { usePackStore } from './store';
import { getHydrationError } from './utils/storage';
import { AppErrorBoundary, RecoveryScreen } from './components/shared/AppRecovery';
import { MotionConfig } from 'framer-motion';

async function start() {
  await usePackStore.persist.rehydrate();
  // Retire the prototype's persistent secret; enabling AI now requires session consent.
  try { localStorage.removeItem('packlight-api-key'); } catch { /* StorageNotice handles unavailable pack storage. */ }
  createRoot(document.getElementById('root')!).render(
    <StrictMode><AppErrorBoundary><MotionConfig reducedMotion="user">
      {getHydrationError() ? <RecoveryScreen /> : <App />}
    </MotionConfig></AppErrorBoundary></StrictMode>,
  );
}
void start();
