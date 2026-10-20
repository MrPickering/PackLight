import { z } from 'zod';
import { DEFAULT_CONTEXTS } from '../types';

const text = z.string().max(100000);
const id = z.string().min(1).max(200);
const date = z.string().max(40).refine(v => Number.isFinite(Date.parse(v)), 'Invalid date');
const rating = z.number().min(0).max(10);
const strings = z.array(text).max(1000);
const history = z.array(z.object({ date, value: z.number().finite() })).max(50000);
export const compartmentSchema = z.enum(['stones', 'chains', 'tools', 'provisions', 'maps', 'souvenirs']);
export const detectedItemSchema = z.object({
  name: z.string().trim().min(1).max(500), compartment: compartmentSchema,
  suggestedWeight: rating, suggestedUtility: rating, approved: z.boolean().default(false),
});
const noteSchema = z.object({
  id, agentId: z.enum(['geologist', 'locksmith', 'blacksmith', 'quartermaster', 'navigator', 'archivist']),
  content: text, createdAt: date,
  actionType: z.enum(['observation', 'recommendation', 'alert', 'celebration']),
  status: z.enum(['pending', 'accepted', 'snoozed', 'dismissed']), relatedItemIds: strings,
});
const notes = z.array(noteSchema).max(10000);
const dimensions = z.object({ stress: z.number().min(0).max(5), worry: z.number().min(0).max(5), cognitive: z.number().min(0).max(5), urgency: z.number().min(0).max(5), emotional: z.number().min(0).max(5) });
const itemSchema = z.object({
  id, name: z.string().trim().min(1).max(500), compartment: compartmentSchema,
  weight: rating, utility: rating, description: text.default(''), createdAt: date, updatedAt: date,
  droppedAt: date.optional(), releaseNote: text.optional(), tags: strings.default([]),
  agentNotes: notes.default([]), weightHistory: history.default([]), utilityHistory: history.default([]),
  lighteningApproach: text.optional(), nextStep: z.object({ text, createdAt: date, completedAt: date.optional() }).optional(),
  completedSteps: z.array(z.object({ text, completedAt: date })).max(10000).default([]),
  parentId: id.nullable().default(null), isContainer: z.boolean().default(false),
  originalWeight: rating.optional(), originalUtility: rating.optional(), weightDimensions: dimensions.optional(),
  contexts: strings.default([]), classification: z.object({ what: text, how: text, why: text, classifiedAt: date }).optional(),
  isAtomic: z.boolean().default(false), metadata: z.record(z.string(), z.unknown()).optional(), sourceRef: text.optional(),
}).transform(item => ({ ...item, originalWeight: item.originalWeight ?? item.weight, originalUtility: item.originalUtility ?? item.utility }));
const recoveryRating = z.number().min(1).max(5);
export const profileSchema = z.object({
  name: text, currentTerrain: z.enum(['uphill', 'downhill', 'swamp', 'ridge', 'camp', 'summit']), terrainSetAt: date,
  paceScoreHistory: history.default([]), loadBalanceHistory: history.default([]),
  recoveryHistory: z.array(z.object({ id, date, sleep: recoveryRating, activity: recoveryRating, social: recoveryRating, downtime: recoveryRating, mindfulness: recoveryRating })).max(50000).default([]),
  displayMode: z.enum(['default', 'focused', 'structured', 'low-energy', 'gentle']).default('default'),
  contexts: z.array(z.object({ id, name: text, emoji: text, color: text })).max(100).default(DEFAULT_CONTEXTS),
  activeContext: id.nullable().default(null), firstStepsComplete: z.boolean().default(true),
  firstStepsStep: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).default(5),
  onboardingCompletedAt: z.union([date, z.literal('')]).default(''), dismissedPrompts: strings.default([]),
});
export const packDataSchema = z.object({
  profile: profileSchema, items: z.array(itemSchema).max(10000),
  journal: z.array(z.object({ id, content: text, createdAt: date, detectedItems: z.array(detectedItemSchema).max(100), mood: recoveryRating })).max(10000).default([]),
  agentNotes: notes.default([]), onboardingComplete: z.boolean().default(true), lastDecayRun: date.nullable().default(null),
}).superRefine((data, ctx) => {
  const byId = new Map(data.items.map(item => [item.id, item]));
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (byId.size !== data.items.length) fail('Duplicate item IDs');
  for (const item of data.items) {
    const seen = new Set([item.id]);
    let parentId = item.parentId;
    while (parentId) {
      if (seen.has(parentId) || seen.size > 50) { fail('Circular or excessively deep item hierarchy'); break; }
      seen.add(parentId);
      const parent = byId.get(parentId);
      if (!parent) { fail('Missing parent item'); break; }
      if (!item.droppedAt && parent.droppedAt) { fail('An active item has a released ancestor'); break; }
      parentId = parent.parentId;
    }
  }
  for (const list of [data.journal, data.agentNotes, data.profile.contexts, data.profile.recoveryHistory]) {
    if (new Set(list.map(entry => entry.id)).size !== list.length) fail('Duplicate entry IDs');
  }
  if (data.profile.activeContext && !data.profile.contexts.some(c => c.id === data.profile.activeContext)) fail('Unknown active context');
});

export const BACKUP_VERSION = 4;
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
export type PackData = z.infer<typeof packDataSchema>;

export function parseBackup(raw: string): PackData {
  if (new Blob([raw]).size > MAX_BACKUP_BYTES) throw new Error('Choose a backup smaller than 10 MB.');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON.'); }
  const envelope = z.object({ version: z.number().int().min(1).max(BACKUP_VERSION) }).safeParse(value);
  if (!envelope.success) throw new Error('This backup version is not supported.');
  const parsed = packDataSchema.safeParse(value);
  if (!parsed.success) throw new Error('This backup contains invalid or incomplete data. Your current pack has not changed.');
  return parsed.data;
}

export function createBackup(data: unknown): string {
  return JSON.stringify({ ...packDataSchema.parse(data), version: BACKUP_VERSION, exportedAt: new Date().toISOString() }, null, 2);
}
