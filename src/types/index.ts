export type Compartment = 'stones' | 'chains' | 'tools' | 'provisions' | 'maps' | 'souvenirs';

export type TerrainType = 'uphill' | 'downhill' | 'swamp' | 'ridge' | 'camp' | 'summit';

export type AgentId = 'geologist' | 'locksmith' | 'blacksmith' | 'quartermaster' | 'navigator' | 'archivist';

export interface NextStep {
  text: string;
  createdAt: string;
  completedAt?: string;
}

export interface CompletedStep {
  text: string;
  completedAt: string;
}

export interface PackItem {
  id: string;
  name: string;
  compartment: Compartment;
  weight: number;
  utility: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  droppedAt?: string;
  releaseNote?: string;
  tags: string[];
  agentNotes: AgentNote[];
  weightHistory: { date: string; value: number }[];
  utilityHistory: { date: string; value: number }[];
  lighteningApproach?: string;
  nextStep?: NextStep;
  completedSteps: CompletedStep[];
}

export interface AgentNote {
  id: string;
  agentId: AgentId;
  content: string;
  createdAt: string;
  actionType: 'observation' | 'recommendation' | 'alert' | 'celebration';
  status: 'pending' | 'accepted' | 'snoozed' | 'dismissed';
  relatedItemIds: string[];
}

export interface Agent {
  id: AgentId;
  name: string;
  title: string;
  emoji: string;
  description: string;
  systemPrompt: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  createdAt: string;
  detectedItems: DetectedItem[];
  mood: number;
}

export interface DetectedItem {
  name: string;
  compartment: Compartment;
  suggestedWeight: number;
  suggestedUtility: number;
  approved: boolean;
}

export interface UserProfile {
  name: string;
  currentTerrain: TerrainType;
  terrainSetAt: string;
  paceScoreHistory: { date: string; value: number }[];
}

export const COMPARTMENT_META: Record<Compartment, { label: string; emoji: string; color: string }> = {
  stones: { label: 'Stones', emoji: '🪨', color: 'rose' },
  chains: { label: 'Chains', emoji: '⛓️', color: 'rose' },
  tools: { label: 'Tools', emoji: '🔧', color: 'emerald' },
  provisions: { label: 'Provisions', emoji: '📦', color: 'amber' },
  maps: { label: 'Maps', emoji: '🗺️', color: 'violet' },
  souvenirs: { label: 'Souvenirs', emoji: '🏺', color: 'amber' },
};

export const TERRAIN_META: Record<TerrainType, { label: string; emoji: string; description: string }> = {
  summit: { label: 'Summit', emoji: '🏔️', description: 'On top of the world. Everything clicking.' },
  downhill: { label: 'Downhill', emoji: '⛷️', description: 'Momentum is carrying you. Enjoy the glide.' },
  camp: { label: 'Camp', emoji: '⛺', description: 'Resting, regrouping. Steady ground.' },
  uphill: { label: 'Uphill', emoji: '🥾', description: 'Grinding toward something. Every step costs more.' },
  ridge: { label: 'Ridge', emoji: '🏞️', description: 'Narrow path, high stakes. Focus required.' },
  swamp: { label: 'Swamp', emoji: '🌿', description: 'Stuck, foggy, heavy. Hard to see the way out.' },
};

export const AGENTS: Record<AgentId, Agent> = {
  geologist: {
    id: 'geologist',
    name: 'The Geologist',
    title: 'Emotional Weight Analyst',
    emoji: '🪨',
    description: 'Analyzes emotional and psychological patterns in your pack.',
    systemPrompt: 'You are The Geologist, an emotional weight analyst for PackLight. You analyze emotional and psychological patterns in the user\'s journal entries and Stone items. You notice recurring themes, weight increases, and avoidance patterns. You never diagnose — you illuminate. You ask questions that help the user see what they\'re carrying. You celebrate when Stones get lighter or dropped. Speak warmly, like a wise therapist friend. Keep responses concise — 2-3 paragraphs max.',
  },
  locksmith: {
    id: 'locksmith',
    name: 'The Locksmith',
    title: 'Obligation Auditor',
    emoji: '🔓',
    description: 'Audits obligations and commitments that drain energy.',
    systemPrompt: 'You are The Locksmith, an obligation auditor for PackLight. You audit obligations, subscriptions, commitments, and relationships that drain energy without returning value. You calculate the weight-to-utility ratio ruthlessly but present options diplomatically. You identify Chains that can be renegotiated rather than just broken. You love finding the one Chain whose removal creates cascading relief. Be pragmatic and slightly irreverent. Keep responses concise.',
  },
  blacksmith: {
    id: 'blacksmith',
    name: 'The Blacksmith',
    title: 'Skill Strategist',
    emoji: '⚒️',
    description: 'Assesses skills, identifies gaps, and recommends growth paths.',
    systemPrompt: 'You are The Blacksmith, a skill strategist for PackLight. You assess the user\'s skill inventory, identify gaps relative to their Maps (goals), and recommend specific upskilling paths. You track skill rust on unused Tools and alert when skills become stale. You connect Tool development to Map progress. Be encouraging and strategic. Keep responses concise.',
  },
  quartermaster: {
    id: 'quartermaster',
    name: 'The Quartermaster',
    title: 'Resource Monitor',
    emoji: '📦',
    description: 'Monitors resources, safety nets, and contingency plans.',
    systemPrompt: 'You are The Quartermaster, a resource monitor for PackLight. You monitor financial health, emergency preparedness, support network strength, and resource allocation. You identify resource gaps before they become crises. You calculate runway, buffer zones, and safety margins. Present numbers clearly and always pair a gap with a realistic plan. Be steady and detail-oriented. Keep responses concise.',
  },
  navigator: {
    id: 'navigator',
    name: 'The Navigator',
    title: 'Goal Portfolio Manager',
    emoji: '🧭',
    description: 'Tracks goals, recalculates timelines, and celebrates progress.',
    systemPrompt: 'You are The Navigator, a goal portfolio manager for PackLight. You maintain the user\'s goal portfolio — tracking progress, recalculating timelines when pack weight changes, and identifying when goals conflict. You surface when a Map is stale or when terrain changes require route adjustment. You celebrate summit moments. Be visionary but grounded. Keep responses concise.',
  },
  archivist: {
    id: 'archivist',
    name: 'The Archivist',
    title: 'Identity Guardian',
    emoji: '📜',
    description: 'Guards the items that define identity and meaning.',
    systemPrompt: 'You are The Archivist, an identity guardian for PackLight. You guard the items that define identity — passions, values, traditions, creative pursuits, relationships that nourish. You notice when Souvenirs are neglected and gently remind the user what feeds their soul. You help distinguish between Souvenirs worth carrying forever and nostalgia that has become a Stone. Be reverent and philosophical. Keep responses concise.',
  },
};

export const COMPARTMENT_AGENT: Record<Compartment, AgentId> = {
  stones: 'geologist',
  chains: 'locksmith',
  tools: 'blacksmith',
  provisions: 'quartermaster',
  maps: 'navigator',
  souvenirs: 'archivist',
};

export const WEIGHT_LABELS: Record<number, string> = {
  1: 'Featherlight', 2: 'Light', 3: 'Mild', 4: 'Moderate', 5: 'Noticeable',
  6: 'Heavy', 7: 'Burdensome', 8: 'Oppressive', 9: 'Overwhelming', 10: 'Crushing',
};

export const UTILITY_LABELS: Record<number, string> = {
  1: 'Dead weight', 2: 'Marginal', 3: 'Minor', 4: 'Somewhat useful', 5: 'Useful',
  6: 'Valuable', 7: 'Important', 8: 'Very important', 9: 'Critical', 10: 'Essential',
};

export interface LighteningStrategy {
  key: string;
  label: string;
  description: string;
}

export const LIGHTENING_STRATEGIES: Record<Compartment, LighteningStrategy[]> = {
  stones: [
    { key: 'process', label: 'Process', description: 'Work through it over time — journaling, therapy, conversation' },
    { key: 'reframe', label: 'Reframe', description: 'Change your relationship to it — perspective shift, cognitive reappraisal' },
    { key: 'accept', label: 'Accept', description: 'Carry it intentionally — acknowledge without fighting it' },
    { key: 'express', label: 'Express', description: 'Get it out — talk to someone, write it down, create something' },
    { key: 'seek-help', label: 'Seek Help', description: 'This may need professional support — therapy, counseling, support group' },
  ],
  chains: [
    { key: 'renegotiate', label: 'Renegotiate', description: 'Change the terms — reduce scope, adjust expectations, talk it out' },
    { key: 'delegate', label: 'Delegate', description: 'Get someone else to carry part of it — ask for help, hire, trade' },
    { key: 'automate', label: 'Automate', description: 'Remove the manual burden — systems, tools, routines' },
    { key: 'set-boundary', label: 'Set Boundary', description: 'Draw a line — say no, limit time, protect your energy' },
    { key: 'exit', label: 'Exit Plan', description: 'Create a path out — timeline, steps, transition plan' },
  ],
  tools: [
    { key: 'practice', label: 'Practice', description: 'Use it or lose it — regular, deliberate practice' },
    { key: 'learn', label: 'Learn', description: 'Fill the gap — course, book, tutorial, experimentation' },
    { key: 'find-mentor', label: 'Find Mentor', description: 'Learn from someone ahead of you — mentor, peer, community' },
    { key: 'retire', label: 'Retire', description: 'Let this skill go — it served you but is no longer needed' },
  ],
  provisions: [
    { key: 'build-buffer', label: 'Build Buffer', description: 'Create margin — save more, stockpile, create reserves' },
    { key: 'insure', label: 'Insure', description: 'Protect against loss — insurance, backup plans, redundancy' },
    { key: 'expand-network', label: 'Expand Network', description: 'Strengthen your safety net — relationships, community, allies' },
    { key: 'reduce-burn', label: 'Reduce Burn', description: 'Slow the drain — cut spending, reduce consumption, simplify' },
  ],
  maps: [
    { key: 'decompose', label: 'Decompose', description: 'Break it into smaller steps — milestones, sub-goals, phases' },
    { key: 'remove-blocker', label: 'Remove Blocker', description: 'Identify what\'s in the way and address it directly' },
    { key: 'adjust-timeline', label: 'Adjust Timeline', description: 'Give yourself more time — realistic deadlines reduce weight' },
    { key: 'pivot', label: 'Pivot', description: 'The goal needs updating — same direction, different path' },
  ],
  souvenirs: [
    { key: 'protect-time', label: 'Protect Time', description: 'Schedule it — block time for what matters to you' },
    { key: 'reconnect', label: 'Reconnect', description: 'You\'ve drifted — take one small step back toward it' },
    { key: 'share', label: 'Share', description: 'Involve others — teach, invite, celebrate together' },
    { key: 'release-nostalgia', label: 'Release', description: 'This was meaningful once but has become weight — honor it and let go' },
  ],
};
