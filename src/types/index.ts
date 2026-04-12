export type Compartment = 'stones' | 'chains' | 'tools' | 'provisions' | 'maps' | 'souvenirs';

export type TerrainType = 'uphill' | 'downhill' | 'swamp' | 'ridge' | 'camp' | 'summit';

export type AgentId = 'geologist' | 'locksmith' | 'blacksmith' | 'quartermaster' | 'navigator' | 'archivist';

export type DisplayMode = 'default' | 'focused' | 'structured' | 'low-energy' | 'gentle';

export interface LifeContext {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const DEFAULT_CONTEXTS: LifeContext[] = [
  { id: 'work', name: 'Work', emoji: '💼', color: 'blue' },
  { id: 'home', name: 'Home', emoji: '🏠', color: 'amber' },
  { id: 'social', name: 'Social', emoji: '👥', color: 'violet' },
  { id: 'creative', name: 'Creative', emoji: '✨', color: 'emerald' },
  { id: 'health', name: 'Health', emoji: '💪', color: 'rose' },
];

export type GuidedPromptType = 'item' | 'pattern' | 'milestone';
export type FirstStepsStep = 0 | 1 | 2 | 3 | 4 | 5;

export interface GuidedPrompt {
  id: string;
  type: GuidedPromptType;
  priority: number;
  message: string;
  action?: {
    label: string;
    route?: string;
    itemId?: string;
    actionType?: 'navigate' | 'openItem' | 'recoveryCheckIn';
  };
  dismissKey: string;
}

export interface ItemClassification {
  what: string;       // "What is this thing?"
  how: string;        // "How does it affect your daily life?"
  why: string;        // "Why does it weigh on you?"
  // Hidden direction signal captured from the "why" follow-up buttons.
  // 'internal' = "about me" (beliefs, patterns, identity); signals we're close to bedrock.
  // 'external' = "about something in my life" (circumstances, others); candidate for deferral.
  direction?: 'internal' | 'external';
  classifiedAt: string;
}

export interface NextStep {
  text: string;
  createdAt: string;
  completedAt?: string;
}

export interface CompletedStep {
  text: string;
  completedAt: string;
}

export interface WeightDimensions {
  stress: number;       // 1-5: tension, pressure
  worry: number;        // 1-5: anxiety, uncertainty, anticipation
  cognitive: number;    // 1-5: mental load, headspace, complexity
  urgency: number;      // 1-5: time pressure, deadlines
  emotional: number;    // 1-5: emotional charge (positive or negative)
}

export const DIMENSION_LABELS: Record<keyof WeightDimensions, { label: string; description: string }> = {
  stress: { label: 'Stress', description: 'How much tension or pressure?' },
  worry: { label: 'Worry', description: 'How anxious or uncertain?' },
  cognitive: { label: 'Mental load', description: 'How much headspace does it take?' },
  urgency: { label: 'Urgency', description: 'How time-pressured?' },
  emotional: { label: 'Emotional charge', description: 'How strongly do you feel about it?' },
};

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
  parentId: string | null;
  isContainer: boolean;
  originalWeight: number;
  originalUtility: number;
  weightDimensions?: WeightDimensions;
  contexts: string[];
  classification?: ItemClassification;
  isAtomic?: boolean;
  metadata?: Record<string, unknown>;
  sourceRef?: string;
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

export interface RecoveryCheck {
  id: string;
  date: string;
  sleep: number;        // 1-5
  activity: number;     // 1-5
  social: number;       // 1-5
  downtime: number;     // 1-5
  mindfulness: number;  // 1-5
}

export interface UserProfile {
  name: string;
  currentTerrain: TerrainType;
  terrainSetAt: string;
  paceScoreHistory: { date: string; value: number }[];
  recoveryHistory: RecoveryCheck[];
  loadBalanceHistory: { date: string; value: number }[];
  displayMode: DisplayMode;
  contexts: LifeContext[];
  activeContext: string | null;
  firstStepsComplete: boolean;
  firstStepsStep: FirstStepsStep;
  onboardingCompletedAt: string;
  dismissedPrompts: string[];
}

export const COMPARTMENT_META: Record<Compartment, { label: string; emoji: string; color: string }> = {
  stones: { label: 'Emotions', emoji: '💭', color: 'rose' },
  chains: { label: 'Responsibilities', emoji: '📋', color: 'rose' },
  tools: { label: 'Abilities', emoji: '💪', color: 'emerald' },
  provisions: { label: 'Resources', emoji: '🛡️', color: 'amber' },
  maps: { label: 'Goals', emoji: '🎯', color: 'violet' },
  souvenirs: { label: 'Identity', emoji: '🪞', color: 'amber' },
};

export const TERRAIN_META: Record<TerrainType, { label: string; emoji: string; description: string }> = {
  summit: { label: 'Great', emoji: '😊', description: 'Things are clicking. Energy is high.' },
  downhill: { label: 'Good', emoji: '👍', description: 'Coasting a bit. Feels manageable.' },
  camp: { label: 'Steady', emoji: '🤙', description: 'Nothing dramatic. Holding it together.' },
  uphill: { label: 'Tough', emoji: '😤', description: 'Pushing through something. It\'s taking effort.' },
  ridge: { label: 'Tense', emoji: '😬', description: 'High pressure. Not much room for error.' },
  swamp: { label: 'Stuck', emoji: '😶‍🌫️', description: 'Heavy, foggy, hard to move. Can\'t see clearly.' },
};

export const AGENTS: Record<AgentId, Agent> = {
  geologist: {
    id: 'geologist',
    name: 'Emotional Analyst',
    title: 'Emotional Weight Analyst',
    emoji: '💭',
    description: 'Notices patterns in your emotional load — the heavy and the hidden.',
    systemPrompt: 'You are the Emotional Analyst for PackLight. You notice patterns in the user\'s emotional load — recurring feelings, weight increases, and avoidance. Remember: positive emotions weigh too. Love, excitement, pride, and hope all consume energy. A new relationship is both wonderful and demanding. A success brings both joy and pressure to maintain it. You never diagnose — you illuminate. Help the user see what they\'re carrying and whether the weight is conscious or automatic. Speak warmly. Keep responses concise — 2-3 paragraphs max.',
  },
  locksmith: {
    id: 'locksmith',
    name: 'Responsibility Auditor',
    title: 'Responsibility Auditor',
    emoji: '📋',
    description: 'Audits obligations — both the ones you chose and the ones you didn\'t.',
    systemPrompt: 'You are the Responsibility Auditor for PackLight. You audit responsibilities and obligations. Crucially: many heavy responsibilities are also deeply meaningful — parenting, leadership, caregiving. Your job isn\'t to eliminate them but to assess whether the weight is sustainable and whether the person has support. You identify responsibilities that can be renegotiated, shared, or better supported. You also notice when someone is carrying responsibilities they chose out of love versus guilt. Be pragmatic and direct. Keep responses concise.',
  },
  blacksmith: {
    id: 'blacksmith',
    name: 'Ability Assessor',
    title: 'Ability Assessor',
    emoji: '💪',
    description: 'Assesses your skills and the pressure that comes with them.',
    systemPrompt: 'You are the Ability Assessor for PackLight. You assess the user\'s skills and capabilities. Key insight: abilities carry their own weight. Being highly capable means people expect more from you. Technical expertise requires constant maintenance. High standards produce great work and also exhaustion. You help users see which abilities are serving them well and which have become sources of pressure. You also identify skills worth developing to reduce load elsewhere. Be encouraging and honest. Keep responses concise.',
  },
  quartermaster: {
    id: 'quartermaster',
    name: 'Resource Monitor',
    title: 'Resource Monitor',
    emoji: '🛡️',
    description: 'Monitors what you have and what it costs to keep it.',
    systemPrompt: 'You are the Resource Monitor for PackLight. You monitor financial health, physical health, relationships, stability, and support systems. Key insight from Hobfoll\'s Conservation of Resources theory: people invest resources to protect resources, and this protection itself is a stressor. Having savings means worrying about losing them. Good health means maintaining it. A strong network means tending relationships. You help users see both the security their resources provide AND the energy cost of maintaining them. Be steady and realistic. Keep responses concise.',
  },
  navigator: {
    id: 'navigator',
    name: 'Goal Tracker',
    title: 'Goal Tracker',
    emoji: '🎯',
    description: 'Tracks what you\'re working toward and whether the pursuit costs too much.',
    systemPrompt: 'You are the Goal Tracker for PackLight. You track the user\'s goals and ambitions. Key insight: goals are heavy. The gap between where you are and where you want to be creates constant pressure. Ambitious goals especially — they motivate AND they weigh. You help users assess whether their goals are worth their current weight, whether timelines need adjusting, and whether the pursuit is sustainable. You also recognize the "arrival fallacy" — that reaching a goal rarely feels as light as expected. Be honest about trade-offs. Keep responses concise.',
  },
  archivist: {
    id: 'archivist',
    name: 'Identity Analyst',
    title: 'Identity Analyst',
    emoji: '🪞',
    description: 'Examines the roles and values that define you — and what they cost.',
    systemPrompt: 'You are the Identity Analyst for PackLight. You examine the roles, values, and identity the user carries. Key insight: identity is weight. Being "the strong one" means you can\'t show weakness. Being "a good parent" creates relentless standards. Your work ethic defines you AND prevents you from resting. You help users see which aspects of their identity are nourishing versus constraining, which roles they chose versus inherited, and where identity maintenance has become exhausting. You also protect what genuinely matters — not everything should be questioned. Be thoughtful and direct. Keep responses concise.',
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
  1: 'Barely notice it', 2: 'Light', 3: 'Mild', 4: 'Moderate', 5: 'Real effort',
  6: 'Heavy', 7: 'Draining', 8: 'Hard to sustain', 9: 'Overwhelming', 10: 'All-consuming',
};

export const UTILITY_LABELS: Record<number, string> = {
  1: 'No value to me', 2: 'Barely matters', 3: 'Minor', 4: 'Somewhat matters', 5: 'Matters',
  6: 'Valuable', 7: 'Important', 8: 'Very important', 9: 'Critical', 10: 'Core to my life',
};

export interface LighteningStrategy {
  key: string;
  label: string;
  description: string;
}

export const LIGHTENING_STRATEGIES: Record<Compartment, LighteningStrategy[]> = {
  stones: [
    { key: 'process', label: 'Process', description: 'Work through it — journaling, therapy, conversation' },
    { key: 'reframe', label: 'Reframe', description: 'Change your relationship to it — shift perspective' },
    { key: 'accept', label: 'Accept', description: 'Carry it consciously — stop fighting it' },
    { key: 'express', label: 'Express', description: 'Get it out — talk, write, create' },
    { key: 'reduce-pressure', label: 'Ease Up', description: 'Lower the standards you\'re holding yourself to around this' },
    { key: 'seek-help', label: 'Get Support', description: 'Professional or personal — you don\'t have to carry this alone' },
  ],
  chains: [
    { key: 'renegotiate', label: 'Renegotiate', description: 'Change the terms — reduce scope, adjust expectations' },
    { key: 'delegate', label: 'Share the Load', description: 'Get help — delegate, hire, ask someone to carry part of it' },
    { key: 'automate', label: 'Systematize', description: 'Remove the manual burden — routines, systems, tools' },
    { key: 'set-boundary', label: 'Set Boundary', description: 'Protect your energy — say no, limit time, draw a line' },
    { key: 'get-support', label: 'Get Support', description: 'You don\'t have to do this alone — find help for what you\'re carrying' },
    { key: 'exit', label: 'Exit Plan', description: 'Create a path out — timeline, steps, transition' },
  ],
  tools: [
    { key: 'practice', label: 'Sharpen', description: 'Use it deliberately — regular practice builds confidence' },
    { key: 'lower-bar', label: 'Lower the Bar', description: 'Good enough is good enough — perfection adds unnecessary weight' },
    { key: 'learn', label: 'Learn', description: 'Fill the gap — course, book, mentor, experimentation' },
    { key: 'rest', label: 'Rest It', description: 'You don\'t have to be great at everything all the time' },
    { key: 'retire', label: 'Let It Go', description: 'This skill served you but is no longer needed' },
  ],
  provisions: [
    { key: 'build-buffer', label: 'Build Buffer', description: 'Create margin — save more, create reserves' },
    { key: 'simplify', label: 'Simplify', description: 'Reduce what you have to maintain — less stuff, less upkeep' },
    { key: 'share-burden', label: 'Share the Burden', description: 'Let others help protect this — you don\'t have to guard everything' },
    { key: 'accept-risk', label: 'Accept Some Risk', description: 'Not everything needs to be fully protected — tolerate some uncertainty' },
    { key: 'expand-network', label: 'Expand Support', description: 'Strengthen your safety net — relationships, community' },
  ],
  maps: [
    { key: 'break-down', label: 'Break It Down', description: 'Smaller steps — milestones, phases, one thing at a time' },
    { key: 'adjust-timeline', label: 'Adjust Timeline', description: 'Give yourself more time — realistic deadlines reduce pressure' },
    { key: 'lower-stakes', label: 'Lower the Stakes', description: 'Not everything has to be a defining achievement' },
    { key: 'remove-blocker', label: 'Remove Blocker', description: 'Identify what\'s actually in the way and address it' },
    { key: 'pivot', label: 'Redirect', description: 'The destination needs updating — same values, different path' },
  ],
  souvenirs: [
    { key: 'protect-time', label: 'Protect Time', description: 'Make space for it — schedule what matters' },
    { key: 'loosen-grip', label: 'Loosen the Grip', description: 'You can be this without being perfect at it' },
    { key: 'share', label: 'Share It', description: 'Involve others — teach, invite, don\'t carry it alone' },
    { key: 'redefine', label: 'Redefine', description: 'Update what this role or value means to you now' },
    { key: 'release', label: 'Let Go', description: 'This was who you were — honor it and move on' },
  ],
};
