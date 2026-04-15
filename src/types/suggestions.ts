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
      { name: 'Minor annoyance',    dimensions: { stress: 2, worry: 0, cognitive: 1, urgency: 0, emotional: 0 }, utility: 2 }, // W1
      { name: 'Commute',            dimensions: { stress: 1, worry: 1, cognitive: 1, urgency: 1, emotional: 1 }, utility: 3 }, // W2
      { name: 'Email backlog',      dimensions: { stress: 2, worry: 1, cognitive: 2, urgency: 2, emotional: 0 }, utility: 3 }, // W3
      { name: 'Bad meetings',       dimensions: { stress: 2, worry: 2, cognitive: 2, urgency: 2, emotional: 2 }, utility: 2 }, // W4
      { name: 'Difficult coworker', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 2, emotional: 2 }, utility: 3 }, // W5
      { name: 'Workload spike',     dimensions: { stress: 4, worry: 3, cognitive: 3, urgency: 4, emotional: 1 }, utility: 3 }, // W6
      { name: 'Imposter syndrome',  compartment: 'stones', dimensions: { stress: 3, worry: 4, cognitive: 4, urgency: 1, emotional: 5 }, utility: 3 }, // W7
      { name: 'Job insecurity',     compartment: 'stones', dimensions: { stress: 4, worry: 5, cognitive: 4, urgency: 3, emotional: 4 }, utility: 2 }, // W8
      { name: 'Wrong career path',  compartment: 'stones', dimensions: { stress: 4, worry: 5, cognitive: 5, urgency: 4, emotional: 5 }, utility: 2 }, // W9
      { name: 'Burnout',            compartment: 'stones', dimensions: { stress: 5, worry: 5, cognitive: 5, urgency: 5, emotional: 5 }, utility: 1 }, // W10
    ],
  },
  {
    id: 'relationship', label: 'Relationship', emoji: '💕',
    compartment: 'chains', contexts: ['home'], utility: 8,
    subItems: [
      { name: 'Daily friction',             dimensions: { stress: 1, worry: 1, cognitive: 1, urgency: 1, emotional: 1 }, utility: 3 }, // W2
      { name: 'Chores / logistics',         dimensions: { stress: 2, worry: 1, cognitive: 2, urgency: 1, emotional: 1 }, utility: 3 }, // W3
      { name: 'Future planning',            dimensions: { stress: 2, worry: 3, cognitive: 3, urgency: 1, emotional: 1 }, utility: 5 }, // W4
      { name: 'Money disagreements',        dimensions: { stress: 3, worry: 3, cognitive: 2, urgency: 2, emotional: 2 }, utility: 3 }, // W5
      { name: 'In-laws / family dynamics',  dimensions: { stress: 3, worry: 2, cognitive: 2, urgency: 2, emotional: 4 }, utility: 2 }, // W5
      { name: 'Different priorities',       dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 2, emotional: 4 }, utility: 3 }, // W6
      { name: 'Intimacy',                   compartment: 'stones', dimensions: { stress: 3, worry: 4, cognitive: 3, urgency: 2, emotional: 5 }, utility: 4 }, // W7
      { name: 'Unequal effort',             compartment: 'stones', dimensions: { stress: 4, worry: 4, cognitive: 3, urgency: 3, emotional: 5 }, utility: 3 }, // W8
      { name: 'Trust issues',               compartment: 'stones', dimensions: { stress: 4, worry: 5, cognitive: 4, urgency: 4, emotional: 5 }, utility: 2 }, // W9
      { name: 'Growing apart',              compartment: 'stones', dimensions: { stress: 5, worry: 5, cognitive: 4, urgency: 5, emotional: 5 }, utility: 2 }, // W10
    ],
  },
  {
    id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦',
    compartment: 'chains', contexts: ['home'], utility: 8,
    subItems: [
      { name: 'Family group chat',    dimensions: { stress: 1, worry: 1, cognitive: 1, urgency: 1, emotional: 1 }, utility: 2 }, // W2
      { name: 'Distance',             compartment: 'stones', dimensions: { stress: 1, worry: 2, cognitive: 1, urgency: 0, emotional: 3 }, utility: 3 }, // W3
      { name: 'Comparison',           compartment: 'stones', dimensions: { stress: 2, worry: 2, cognitive: 2, urgency: 1, emotional: 3 }, utility: 1 }, // W4
      { name: 'Family events',        dimensions: { stress: 3, worry: 2, cognitive: 2, urgency: 3, emotional: 3 }, utility: 4 }, // W5
      { name: 'Sibling conflict',     compartment: 'stones', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 2, emotional: 4 }, utility: 2 }, // W6
      { name: 'Expectations',         compartment: 'stones', dimensions: { stress: 3, worry: 4, cognitive: 3, urgency: 3, emotional: 4 }, utility: 3 }, // W7
      { name: 'Guilt',                compartment: 'stones', dimensions: { stress: 3, worry: 4, cognitive: 4, urgency: 2, emotional: 5 }, utility: 2 }, // W7
      { name: 'Money / inheritance',  dimensions: { stress: 4, worry: 4, cognitive: 4, urgency: 3, emotional: 5 }, utility: 3 }, // W8
      { name: 'Caregiving',           dimensions: { stress: 5, worry: 4, cognitive: 4, urgency: 4, emotional: 5 }, utility: 5 }, // W9
      { name: 'Aging parents',        compartment: 'stones', dimensions: { stress: 5, worry: 5, cognitive: 4, urgency: 5, emotional: 5 }, utility: 5 }, // W10
    ],
  },
  {
    id: 'money', label: 'Money', emoji: '💰',
    compartment: 'provisions', contexts: ['home'], utility: 7,
    subItems: [
      { name: 'Budgeting',          compartment: 'chains', dimensions: { stress: 1, worry: 1, cognitive: 1, urgency: 1, emotional: 1 }, utility: 4 }, // W2
      { name: 'Tax stress',         compartment: 'chains', dimensions: { stress: 1, worry: 2, cognitive: 2, urgency: 2, emotional: 0 }, utility: 3 }, // W3
      { name: 'Investment decisions', dimensions: { stress: 1, worry: 2, cognitive: 4, urgency: 1, emotional: 2 }, utility: 5 }, // W4
      { name: 'Unexpected expenses',  dimensions: { stress: 3, worry: 3, cognitive: 2, urgency: 3, emotional: 1 }, utility: 2 }, // W5
      { name: 'Cost of living',     dimensions: { stress: 3, worry: 4, cognitive: 3, urgency: 3, emotional: 2 }, utility: 3 }, // W6
      { name: 'Not saving enough',  compartment: 'stones', dimensions: { stress: 3, worry: 4, cognitive: 3, urgency: 3, emotional: 4 }, utility: 3 }, // W7
      { name: 'Supporting others',  compartment: 'chains', dimensions: { stress: 4, worry: 3, cognitive: 3, urgency: 4, emotional: 5 }, utility: 4 }, // W8
      { name: 'Retirement anxiety', compartment: 'stones', dimensions: { stress: 3, worry: 5, cognitive: 4, urgency: 3, emotional: 5 }, utility: 3 }, // W8
      { name: 'Income instability', compartment: 'stones', dimensions: { stress: 4, worry: 5, cognitive: 4, urgency: 4, emotional: 5 }, utility: 2 }, // W9
      { name: 'Debt',               compartment: 'chains', dimensions: { stress: 5, worry: 5, cognitive: 4, urgency: 5, emotional: 5 }, utility: 1 }, // W10
    ],
  },
  {
    id: 'health', label: 'Health', emoji: '🏥',
    compartment: 'provisions', contexts: ['health'], utility: 8,
    subItems: [
      { name: 'Doctor appointments',  compartment: 'chains', dimensions: { stress: 1, worry: 1, cognitive: 0, urgency: 1, emotional: 0 }, utility: 5 }, // W1
      { name: 'Exercise motivation',  dimensions: { stress: 1, worry: 0, cognitive: 1, urgency: 1, emotional: 2 }, utility: 5 }, // W2
      { name: 'Diet / eating habits', dimensions: { stress: 1, worry: 1, cognitive: 2, urgency: 1, emotional: 2 }, utility: 5 }, // W3
      { name: 'Energy levels',        compartment: 'stones', dimensions: { stress: 2, worry: 2, cognitive: 2, urgency: 1, emotional: 3 }, utility: 3 }, // W4
      { name: 'Sleep problems',       compartment: 'stones', dimensions: { stress: 3, worry: 2, cognitive: 3, urgency: 2, emotional: 3 }, utility: 3 }, // W5
      { name: 'Medication management', compartment: 'chains', dimensions: { stress: 2, worry: 3, cognitive: 3, urgency: 4, emotional: 3 }, utility: 5 }, // W6
      { name: 'Aging / body changes', compartment: 'stones', dimensions: { stress: 3, worry: 4, cognitive: 3, urgency: 2, emotional: 5 }, utility: 2 }, // W7
      { name: 'Addiction / habits',   compartment: 'stones', dimensions: { stress: 4, worry: 4, cognitive: 4, urgency: 3, emotional: 5 }, utility: 2 }, // W8
      { name: 'Mental health',        compartment: 'stones', dimensions: { stress: 5, worry: 5, cognitive: 4, urgency: 3, emotional: 5 }, utility: 4 }, // W9
      { name: 'Chronic pain',         compartment: 'stones', dimensions: { stress: 5, worry: 5, cognitive: 5, urgency: 5, emotional: 5 }, utility: 1 }, // W10
    ],
  },
  {
    id: 'social', label: 'Social Life', emoji: '👥',
    compartment: 'stones', contexts: ['social'], utility: 6,
    subItems: [
      { name: 'FOMO',                 dimensions: { stress: 1, worry: 1, cognitive: 0, urgency: 0, emotional: 1 }, utility: 1 }, // W1
      { name: 'Social media pressure', dimensions: { stress: 1, worry: 1, cognitive: 1, urgency: 0, emotional: 2 }, utility: 1 }, // W2
      { name: 'Maintaining friendships', compartment: 'chains', dimensions: { stress: 1, worry: 1, cognitive: 2, urgency: 1, emotional: 2 }, utility: 5 }, // W3
      { name: 'No time for friends',  dimensions: { stress: 2, worry: 2, cognitive: 2, urgency: 1, emotional: 3 }, utility: 3 }, // W4
      { name: 'People-pleasing',      dimensions: { stress: 3, worry: 2, cognitive: 3, urgency: 1, emotional: 3 }, utility: 2 }, // W5
      { name: 'Feeling misunderstood', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 1, emotional: 5 }, utility: 2 }, // W6
      { name: 'New city / no network', dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 3, emotional: 5 }, utility: 2 }, // W7
      { name: 'Social anxiety',       dimensions: { stress: 4, worry: 5, cognitive: 4, urgency: 2, emotional: 5 }, utility: 2 }, // W8
      { name: 'Loneliness',           dimensions: { stress: 4, worry: 4, cognitive: 4, urgency: 5, emotional: 5 }, utility: 2 }, // W9
      { name: 'A toxic friendship',   dimensions: { stress: 5, worry: 4, cognitive: 5, urgency: 5, emotional: 5 }, utility: 2 }, // W10
    ],
  },
  {
    id: 'goal', label: 'A Goal', emoji: '🎯',
    compartment: 'maps', contexts: [], utility: 7,
    subItems: [
      { name: 'No accountability',        dimensions: { stress: 1, worry: 0, cognitive: 1, urgency: 1, emotional: 0 }, utility: 3 }, // W1
      { name: 'Comparison to others',     compartment: 'stones', dimensions: { stress: 1, worry: 1, cognitive: 1, urgency: 0, emotional: 2 }, utility: 1 }, // W2
      { name: 'Losing motivation',        compartment: 'stones', dimensions: { stress: 1, worry: 1, cognitive: 2, urgency: 1, emotional: 2 }, utility: 3 }, // W3
      { name: 'Time constraints',         compartment: 'chains', dimensions: { stress: 2, worry: 2, cognitive: 2, urgency: 3, emotional: 1 }, utility: 3 }, // W4
      { name: 'Changing direction',       dimensions: { stress: 3, worry: 3, cognitive: 4, urgency: 1, emotional: 2 }, utility: 4 }, // W5
      { name: 'Don\'t know where to start', compartment: 'stones', dimensions: { stress: 3, worry: 2, cognitive: 5, urgency: 2, emotional: 3 }, utility: 3 }, // W6
      { name: 'Financial barriers',       compartment: 'provisions', dimensions: { stress: 3, worry: 4, cognitive: 3, urgency: 3, emotional: 4 }, utility: 3 }, // W7
      { name: 'Not making progress',      compartment: 'stones', dimensions: { stress: 4, worry: 4, cognitive: 3, urgency: 4, emotional: 5 }, utility: 3 }, // W8
      { name: 'Sacrificing other things', compartment: 'chains', dimensions: { stress: 4, worry: 5, cognitive: 4, urgency: 4, emotional: 5 }, utility: 4 }, // W9
      { name: 'Self-doubt',               compartment: 'stones', dimensions: { stress: 4, worry: 5, cognitive: 5, urgency: 5, emotional: 5 }, utility: 2 }, // W10
    ],
  },
  {
    id: 'identity', label: 'Identity / Self', emoji: '🪞',
    compartment: 'souvenirs', contexts: [], utility: 7,
    subItems: [
      { name: 'Being independent',            dimensions: { stress: 1, worry: 0, cognitive: 1, urgency: 0, emotional: 1 }, utility: 5 }, // W1
      { name: 'The peacekeeper',              dimensions: { stress: 1, worry: 1, cognitive: 1, urgency: 1, emotional: 1 }, utility: 3 }, // W2
      { name: 'Being "the responsible one"',  dimensions: { stress: 2, worry: 1, cognitive: 2, urgency: 1, emotional: 1 }, utility: 4 }, // W3
      { name: 'The caregiver',                dimensions: { stress: 2, worry: 2, cognitive: 2, urgency: 2, emotional: 2 }, utility: 5 }, // W4
      { name: 'Being "the strong one"',       dimensions: { stress: 3, worry: 2, cognitive: 2, urgency: 1, emotional: 5 }, utility: 4 }, // W5
      { name: 'The provider',                 dimensions: { stress: 3, worry: 3, cognitive: 3, urgency: 3, emotional: 3 }, utility: 5 }, // W6
      { name: 'The achiever',                 dimensions: { stress: 4, worry: 3, cognitive: 3, urgency: 4, emotional: 3 }, utility: 5 }, // W7
      { name: 'Perfectionism',                compartment: 'stones', dimensions: { stress: 4, worry: 4, cognitive: 5, urgency: 3, emotional: 4 }, utility: 3 }, // W8
      { name: 'Outgrowing old identity',      compartment: 'stones', dimensions: { stress: 4, worry: 5, cognitive: 4, urgency: 4, emotional: 5 }, utility: 4 }, // W9
      { name: 'Not knowing who I am',         compartment: 'stones', dimensions: { stress: 5, worry: 5, cognitive: 5, urgency: 5, emotional: 5 }, utility: 2 }, // W10
    ],
  },
];

export function dimensionsToWeight(d: WeightDimensions): number {
  return Math.round((d.stress + d.worry + d.cognitive + d.urgency + d.emotional) / 2.5);
}
