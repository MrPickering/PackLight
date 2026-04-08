import type { Compartment, WeightDimensions } from './index';

export interface SubItemSuggestion {
  name: string;
  compartment?: Compartment; // override parent's compartment if different
  dimensions: WeightDimensions;
  utility: number;
}

export interface TopLevelCategory {
  id: string;
  label: string;
  emoji: string;
  compartment: Compartment;
  contexts: string[];
  utility: number;
  subItems: SubItemSuggestion[];
}

// Weight presets for "How heavy?" step
export const WEIGHT_PRESETS = [
  { label: 'Light', value: 3, description: 'It\'s there but manageable' },
  { label: 'Medium', value: 6, description: 'Takes real effort' },
  { label: 'Heavy', value: 9, description: 'Hard to carry' },
] as const;

export const TOP_LEVEL_CATEGORIES: TopLevelCategory[] = [
  {
    id: 'work', label: 'Work / Career', emoji: '💼',
    compartment: 'chains', contexts: ['work'], utility: 7,
    subItems: [
      { name: 'The commute', dimensions: { stress: 3, worry: 1, cognitive: 2, urgency: 3, emotional: 2 }, utility: 2 },
      { name: 'A coworker or boss', dimensions: { stress: 4, worry: 3, cognitive: 3, urgency: 2, emotional: 4 }, utility: 3 },
      { name: 'Deadline pressure', dimensions: { stress: 4, worry: 3, cognitive: 3, urgency: 5, emotional: 2 }, utility: 4 },
      { name: 'Too many meetings', dimensions: { stress: 3, worry: 1, cognitive: 4, urgency: 3, emotional: 2 }, utility: 3 },
      { name: 'Workload', dimensions: { stress: 4, worry: 3, cognitive: 5, urgency: 4, emotional: 2 }, utility: 4 },
      { name: 'Office politics', dimensions: { stress: 3, worry: 3, cognitive: 4, urgency: 2, emotional: 4 }, utility: 2 },
      { name: 'Imposter syndrome', compartment: 'stones', dimensions: { stress: 3, worry: 5, cognitive: 4, urgency: 1, emotional: 4 }, utility: 3 },
      { name: 'Underpaid / undervalued', compartment: 'stones', dimensions: { stress: 3, worry: 4, cognitive: 3, urgency: 2, emotional: 4 }, utility: 2 },
      { name: 'Job insecurity', compartment: 'stones', dimensions: { stress: 4, worry: 5, cognitive: 4, urgency: 3, emotional: 3 }, utility: 2 },
      { name: 'Work-life balance', dimensions: { stress: 4, worry: 3, cognitive: 3, urgency: 3, emotional: 3 }, utility: 3 },
      { name: 'Email / Slack overload', dimensions: { stress: 3, worry: 2, cognitive: 4, urgency: 3, emotional: 1 }, utility: 2 },
      { name: 'Boring / unstimulating', compartment: 'stones', dimensions: { stress: 2, worry: 3, cognitive: 2, urgency: 1, emotional: 3 }, utility: 2 },
    ],
  },
  {
    id: 'relationship', label: 'Relationship', emoji: '💕',
    compartment: 'chains', contexts: ['home'], utility: 8,
    subItems: [
      { name: 'Communication issues', compartment: 'stones', dimensions: { stress: 4, worry: 4, cognitive: 4, urgency: 3, emotional: 4 }, utility: 3 },
      { name: 'Different priorities', dimensions: { stress: 3, worry: 4, cognitive: 4, urgency: 2, emotional: 3 }, utility: 3 },
      { name: 'Intimacy', compartment: 'stones', dimensions: { stress: 3, worry: 3, cognitive: 2, urgency: 2, emotional: 5 }, utility: 4 },
      { name: 'Money disagreements', dimensions: { stress: 4, worry: 4, cognitive: 3, urgency: 3, emotional: 3 }, utility: 3 },
      { name: 'In-laws / family dynamics', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 2, emotional: 4 }, utility: 2 },
      { name: 'Trust issues', compartment: 'stones', dimensions: { stress: 3, worry: 5, cognitive: 4, urgency: 2, emotional: 5 }, utility: 2 },
      { name: 'Unequal effort', compartment: 'stones', dimensions: { stress: 4, worry: 3, cognitive: 3, urgency: 2, emotional: 4 }, utility: 3 },
      { name: 'Growing apart', compartment: 'stones', dimensions: { stress: 3, worry: 4, cognitive: 4, urgency: 2, emotional: 5 }, utility: 3 },
      { name: 'Future planning', dimensions: { stress: 3, worry: 4, cognitive: 4, urgency: 3, emotional: 3 }, utility: 5 },
      { name: 'Jealousy', compartment: 'stones', dimensions: { stress: 3, worry: 4, cognitive: 3, urgency: 1, emotional: 5 }, utility: 1 },
    ],
  },
  {
    id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦',
    compartment: 'chains', contexts: ['home'], utility: 8,
    subItems: [
      { name: 'Aging parents', dimensions: { stress: 4, worry: 5, cognitive: 3, urgency: 3, emotional: 4 }, utility: 5 },
      { name: 'Sibling conflict', compartment: 'stones', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 2, emotional: 4 }, utility: 2 },
      { name: 'Expectations', compartment: 'stones', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 2, emotional: 4 }, utility: 3 },
      { name: 'Guilt', compartment: 'stones', dimensions: { stress: 3, worry: 3, cognitive: 4, urgency: 2, emotional: 5 }, utility: 2 },
      { name: 'Caregiving', dimensions: { stress: 4, worry: 4, cognitive: 3, urgency: 4, emotional: 3 }, utility: 5 },
      { name: 'Boundaries', dimensions: { stress: 4, worry: 3, cognitive: 3, urgency: 2, emotional: 4 }, utility: 4 },
      { name: 'Family events', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 3, emotional: 3 }, utility: 4 },
      { name: 'Money / inheritance', dimensions: { stress: 3, worry: 4, cognitive: 3, urgency: 2, emotional: 4 }, utility: 3 },
      { name: 'Distance', compartment: 'stones', dimensions: { stress: 2, worry: 3, cognitive: 2, urgency: 1, emotional: 4 }, utility: 3 },
      { name: 'Comparison', compartment: 'stones', dimensions: { stress: 2, worry: 3, cognitive: 3, urgency: 1, emotional: 4 }, utility: 1 },
    ],
  },
  {
    id: 'money', label: 'Money', emoji: '💰',
    compartment: 'provisions', contexts: ['home'], utility: 7,
    subItems: [
      { name: 'Debt', compartment: 'chains', dimensions: { stress: 4, worry: 5, cognitive: 3, urgency: 4, emotional: 3 }, utility: 2 },
      { name: 'Not saving enough', compartment: 'stones', dimensions: { stress: 3, worry: 4, cognitive: 3, urgency: 2, emotional: 3 }, utility: 3 },
      { name: 'Cost of living', dimensions: { stress: 4, worry: 4, cognitive: 3, urgency: 4, emotional: 2 }, utility: 3 },
      { name: 'Unexpected expenses', dimensions: { stress: 4, worry: 4, cognitive: 3, urgency: 5, emotional: 3 }, utility: 2 },
      { name: 'Income instability', compartment: 'stones', dimensions: { stress: 4, worry: 5, cognitive: 4, urgency: 3, emotional: 3 }, utility: 2 },
      { name: 'Supporting others', compartment: 'chains', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 3, emotional: 3 }, utility: 4 },
      { name: 'Lifestyle pressure', compartment: 'stones', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 2, emotional: 3 }, utility: 2 },
      { name: 'Retirement anxiety', compartment: 'stones', dimensions: { stress: 3, worry: 5, cognitive: 3, urgency: 2, emotional: 3 }, utility: 3 },
      { name: 'Tax stress', dimensions: { stress: 3, worry: 3, cognitive: 4, urgency: 4, emotional: 2 }, utility: 3 },
      { name: 'Investment decisions', dimensions: { stress: 2, worry: 4, cognitive: 5, urgency: 2, emotional: 2 }, utility: 5 },
    ],
  },
  {
    id: 'health', label: 'Health', emoji: '🏥',
    compartment: 'provisions', contexts: ['health'], utility: 8,
    subItems: [
      { name: 'Sleep problems', compartment: 'stones', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 3, emotional: 2 }, utility: 3 },
      { name: 'Chronic pain', compartment: 'stones', dimensions: { stress: 4, worry: 3, cognitive: 3, urgency: 3, emotional: 4 }, utility: 2 },
      { name: 'Diet / eating habits', dimensions: { stress: 3, worry: 3, cognitive: 4, urgency: 2, emotional: 3 }, utility: 5 },
      { name: 'Exercise motivation', dimensions: { stress: 2, worry: 2, cognitive: 3, urgency: 2, emotional: 3 }, utility: 5 },
      { name: 'Mental health', compartment: 'stones', dimensions: { stress: 4, worry: 4, cognitive: 4, urgency: 3, emotional: 5 }, utility: 4 },
      { name: 'Medication management', compartment: 'chains', dimensions: { stress: 2, worry: 3, cognitive: 3, urgency: 3, emotional: 2 }, utility: 5 },
      { name: 'Energy levels', compartment: 'stones', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 2, emotional: 3 }, utility: 3 },
      { name: 'Aging / body changes', compartment: 'stones', dimensions: { stress: 2, worry: 4, cognitive: 2, urgency: 1, emotional: 4 }, utility: 2 },
      { name: 'Addiction / habits', compartment: 'stones', dimensions: { stress: 4, worry: 4, cognitive: 4, urgency: 3, emotional: 4 }, utility: 2 },
      { name: 'Doctor appointments', compartment: 'chains', dimensions: { stress: 2, worry: 3, cognitive: 2, urgency: 3, emotional: 2 }, utility: 5 },
    ],
  },
  {
    id: 'social', label: 'Social Life', emoji: '👥',
    compartment: 'stones', contexts: ['social'], utility: 6,
    subItems: [
      { name: 'Loneliness', dimensions: { stress: 3, worry: 3, cognitive: 4, urgency: 2, emotional: 5 }, utility: 2 },
      { name: 'Social anxiety', dimensions: { stress: 4, worry: 5, cognitive: 4, urgency: 2, emotional: 4 }, utility: 2 },
      { name: 'Maintaining friendships', compartment: 'chains', dimensions: { stress: 2, worry: 3, cognitive: 3, urgency: 2, emotional: 3 }, utility: 5 },
      { name: 'FOMO', dimensions: { stress: 2, worry: 3, cognitive: 3, urgency: 2, emotional: 4 }, utility: 1 },
      { name: 'People-pleasing', dimensions: { stress: 3, worry: 3, cognitive: 4, urgency: 2, emotional: 4 }, utility: 2 },
      { name: 'A toxic friendship', dimensions: { stress: 4, worry: 3, cognitive: 4, urgency: 2, emotional: 5 }, utility: 2 },
      { name: 'No time for friends', dimensions: { stress: 2, worry: 3, cognitive: 2, urgency: 2, emotional: 4 }, utility: 3 },
      { name: 'Social media pressure', dimensions: { stress: 2, worry: 3, cognitive: 3, urgency: 1, emotional: 4 }, utility: 1 },
      { name: 'Feeling misunderstood', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 1, emotional: 5 }, utility: 2 },
      { name: 'New city / no network', dimensions: { stress: 3, worry: 4, cognitive: 3, urgency: 2, emotional: 4 }, utility: 2 },
    ],
  },
  {
    id: 'goal', label: 'A Goal', emoji: '🎯',
    compartment: 'maps', contexts: [], utility: 7,
    subItems: [
      { name: 'Don\'t know where to start', compartment: 'stones', dimensions: { stress: 3, worry: 3, cognitive: 5, urgency: 2, emotional: 3 }, utility: 3 },
      { name: 'Not making progress', compartment: 'stones', dimensions: { stress: 3, worry: 4, cognitive: 3, urgency: 3, emotional: 4 }, utility: 3 },
      { name: 'Sacrificing other things', compartment: 'chains', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 3, emotional: 3 }, utility: 4 },
      { name: 'Self-doubt', compartment: 'stones', dimensions: { stress: 3, worry: 4, cognitive: 4, urgency: 1, emotional: 5 }, utility: 2 },
      { name: 'Time constraints', compartment: 'chains', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 4, emotional: 2 }, utility: 3 },
      { name: 'Financial barriers', compartment: 'provisions', dimensions: { stress: 3, worry: 4, cognitive: 3, urgency: 3, emotional: 3 }, utility: 3 },
      { name: 'Comparison to others', compartment: 'stones', dimensions: { stress: 2, worry: 3, cognitive: 3, urgency: 1, emotional: 4 }, utility: 1 },
      { name: 'Losing motivation', compartment: 'stones', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 2, emotional: 4 }, utility: 3 },
      { name: 'Changing direction', dimensions: { stress: 3, worry: 4, cognitive: 5, urgency: 2, emotional: 3 }, utility: 4 },
      { name: 'No accountability', dimensions: { stress: 2, worry: 2, cognitive: 3, urgency: 2, emotional: 3 }, utility: 3 },
    ],
  },
  {
    id: 'identity', label: 'Identity / Self', emoji: '🪞',
    compartment: 'souvenirs', contexts: [], utility: 7,
    subItems: [
      { name: 'Being "the strong one"', dimensions: { stress: 3, worry: 2, cognitive: 3, urgency: 1, emotional: 5 }, utility: 4 },
      { name: 'Being "the responsible one"', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 2, emotional: 4 }, utility: 4 },
      { name: 'The achiever', dimensions: { stress: 4, worry: 3, cognitive: 3, urgency: 3, emotional: 3 }, utility: 5 },
      { name: 'The caregiver', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 3, emotional: 4 }, utility: 5 },
      { name: 'The peacekeeper', dimensions: { stress: 3, worry: 3, cognitive: 4, urgency: 2, emotional: 4 }, utility: 3 },
      { name: 'The provider', dimensions: { stress: 4, worry: 4, cognitive: 3, urgency: 3, emotional: 3 }, utility: 5 },
      { name: 'Perfectionism', dimensions: { stress: 4, worry: 4, cognitive: 5, urgency: 3, emotional: 3 }, utility: 3 },
      { name: 'Not knowing who I am', dimensions: { stress: 3, worry: 4, cognitive: 5, urgency: 1, emotional: 5 }, utility: 2 },
      { name: 'Outgrowing old identity', dimensions: { stress: 3, worry: 4, cognitive: 4, urgency: 2, emotional: 4 }, utility: 4 },
      { name: 'Being independent', dimensions: { stress: 2, worry: 2, cognitive: 3, urgency: 1, emotional: 4 }, utility: 5 },
    ],
  },
];

export function dimensionsToWeight(d: WeightDimensions): number {
  return Math.round((d.stress + d.worry + d.cognitive + d.urgency + d.emotional) / 2.5);
}
