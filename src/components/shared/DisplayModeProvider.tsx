import { createContext, useContext } from 'react';
import type { DisplayMode } from '../../types';
import { usePackStore } from '../../store';

interface DisplayModeConfig {
  mode: DisplayMode;
  showFullTree: boolean;
  showDimensions: boolean;
  showTotals: boolean;
  showStrainWarnings: boolean;
  maxVisibleItems: number | null;
  framingStyle: 'neutral' | 'progress' | 'minimal';
}

const MODE_CONFIGS: Record<DisplayMode, Omit<DisplayModeConfig, 'mode'>> = {
  default: {
    showFullTree: true,
    showDimensions: true,
    showTotals: true,
    showStrainWarnings: true,
    maxVisibleItems: null,
    framingStyle: 'neutral',
  },
  focused: {
    showFullTree: false,
    showDimensions: false,
    showTotals: false,
    showStrainWarnings: false,
    maxVisibleItems: 3,
    framingStyle: 'minimal',
  },
  structured: {
    showFullTree: true,
    showDimensions: true,
    showTotals: true,
    showStrainWarnings: true,
    maxVisibleItems: null,
    framingStyle: 'neutral',
  },
  'low-energy': {
    showFullTree: false,
    showDimensions: false,
    showTotals: true,
    showStrainWarnings: false,
    maxVisibleItems: 5,
    framingStyle: 'minimal',
  },
  gentle: {
    showFullTree: true,
    showDimensions: true,
    showTotals: false,
    showStrainWarnings: false,
    maxVisibleItems: null,
    framingStyle: 'progress',
  },
};

const DisplayModeContext = createContext<DisplayModeConfig>({
  mode: 'default',
  ...MODE_CONFIGS.default,
});

export function useDisplayMode() {
  return useContext(DisplayModeContext);
}

export default function DisplayModeProvider({ children }: { children: React.ReactNode }) {
  const displayMode = usePackStore(s => s.profile.displayMode) ?? 'default';
  const config: DisplayModeConfig = { mode: displayMode, ...MODE_CONFIGS[displayMode] };

  return (
    <DisplayModeContext.Provider value={config}>
      {children}
    </DisplayModeContext.Provider>
  );
}
