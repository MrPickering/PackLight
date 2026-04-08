import type { PackItem, UserProfile, GuidedPrompt } from '../types';
import { COMPARTMENT_META } from '../types';

function daysSince(dateStr: string): number {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

interface GuidedPromptsInput {
  items: PackItem[];
  profile: UserProfile;
  loadBalanceScore: number;
  framingStyle?: 'neutral' | 'progress' | 'minimal';
}

export function generateGuidedPrompts(input: GuidedPromptsInput): GuidedPrompt[] {
  const { items, profile, loadBalanceScore, framingStyle } = input;

  if (framingStyle === 'minimal') return [];

  const active = items.filter(i => !i.droppedAt);
  const roots = active.filter(i => !i.parentId);
  const gentle = framingStyle === 'progress';
  const prompts: GuidedPrompt[] = [];

  // ── Milestone rules (priority 0-9) ──

  // 7-day recovery streak
  if (profile.recoveryHistory.length >= 7) {
    const sorted = [...profile.recoveryHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const days = new Set(sorted.slice(0, 7).map(c => c.date.split('T')[0]));
    if (days.size >= 7) {
      prompts.push({
        id: 'milestone-7day-streak', type: 'milestone', priority: 0,
        message: 'A week of check-ins. Consistency matters more than perfection.',
        dismissKey: 'milestone-7day-streak',
      });
    }
  }

  // First unpack
  const firstContainer = active.find(i => i.isContainer && active.some(c => c.parentId === i.id));
  if (firstContainer) {
    prompts.push({
      id: 'milestone-first-unpack', type: 'milestone', priority: 1,
      message: `Nice — you unpacked '${firstContainer.name}'. That's how you find the real weight.`,
      dismissKey: 'milestone-first-unpack',
    });
  }

  // First drop
  const firstDrop = items.find(i => i.droppedAt);
  if (firstDrop) {
    prompts.push({
      id: 'milestone-first-drop', type: 'milestone', priority: 1,
      message: `You released '${firstDrop.name}'. That weight is gone now.`,
      dismissKey: 'milestone-first-drop',
    });
  }

  // 5 items
  if (active.length === 5) {
    prompts.push({
      id: 'milestone-5-items', type: 'milestone', priority: 2,
      message: "You've named 5 things. You're starting to see the real picture.",
      dismissKey: 'milestone-5-items',
    });
  }

  // ── Pattern rules (priority 10-19) ──

  // All items in one compartment
  if (roots.length >= 3) {
    const compartments = new Set(roots.map(i => i.compartment));
    if (compartments.size === 1) {
      const comp = roots[0].compartment;
      prompts.push({
        id: 'single-compartment', type: 'pattern', priority: 10,
        message: `All your items are in ${COMPARTMENT_META[comp].label}. Life usually weighs in more than one area — anything missing?`,
        dismissKey: 'single-compartment',
      });
    }
  }

  // Score dropping
  const history = profile.loadBalanceHistory;
  if (history.length >= 2) {
    const recent = history[history.length - 1];
    const prev = history[history.length - 2];
    if (prev.value - recent.value >= 10) {
      const weekKey = new Date().toISOString().split('T')[0].slice(0, 7);
      prompts.push({
        id: `score-dropping-${weekKey}`, type: 'pattern', priority: 11,
        message: gentle
          ? `Your balance shifted from ${prev.value} to ${recent.value}. Worth checking in with yourself.`
          : `Your Load Balance dropped from ${prev.value} to ${recent.value} recently. Anything changed?`,
        dismissKey: `score-dropping-${weekKey}`,
      });
    }
  }

  // Weight > utility for most items
  const leaves = active.filter(i => !active.some(c => c.parentId === i.id));
  if (leaves.length >= 3) {
    const overloaded = leaves.filter(i => i.weight > i.utility);
    if (overloaded.length / leaves.length > 0.6) {
      prompts.push({
        id: 'weight-exceeds-utility', type: 'pattern', priority: 12,
        message: gentle
          ? "There might be things worth lightening. Most of what you carry weighs more than it gives back."
          : "Most of what you carry weighs more than it gives back. That's unsustainable — anything you could lighten?",
        dismissKey: 'weight-exceeds-utility',
      });
    }
  }

  // No recovery check-in in 3+ days
  const latestRecovery = profile.recoveryHistory[profile.recoveryHistory.length - 1];
  if (!latestRecovery || daysSince(latestRecovery.date) >= 3) {
    prompts.push({
      id: 'recovery-overdue', type: 'pattern', priority: 14,
      message: "Haven't checked in on recovery lately. How are you sleeping, moving, connecting?",
      action: { label: 'Check in', actionType: 'recoveryCheckIn' },
      dismissKey: 'recovery-overdue',
    });
  }

  // ── Item rules (priority 20-29) ──

  for (const item of roots) {
    // Heavy item not unpacked
    if (!item.isContainer && item.weight >= 6) {
      prompts.push({
        id: `heavy-unpacked-${item.id}`, type: 'item', priority: 20,
        message: `'${item.name}' is weight ${item.weight}. Most things we carry aren't one thing. Want to unpack it?`,
        action: { label: 'Unpack', route: `/pack/${item.compartment}`, itemId: item.id, actionType: 'navigate' },
        dismissKey: `heavy-unpacked-${item.id}`,
      });
    }

    // High stress dimension
    if (item.weightDimensions?.stress && item.weightDimensions.stress >= 4 && !item.lighteningApproach) {
      prompts.push({
        id: `high-stress-${item.id}`, type: 'item', priority: 22,
        message: `'${item.name}' scores ${item.weightDimensions.stress}/5 on stress. Have you tried any lightening strategies?`,
        action: { label: 'View', route: `/pack/${item.compartment}`, itemId: item.id, actionType: 'navigate' },
        dismissKey: `high-stress-${item.id}`,
      });
    }

    // Stale item
    if (daysSince(item.updatedAt) >= 14) {
      prompts.push({
        id: `stale-${item.id}`, type: 'item', priority: 25,
        message: `'${item.name}' has been sitting unchanged for ${daysSince(item.updatedAt)} days. Is it still accurate?`,
        action: { label: 'Review', route: `/pack/${item.compartment}`, itemId: item.id, actionType: 'navigate' },
        dismissKey: `stale-${item.id}`,
      });
    }

    // Item with no context (only if user has used contexts)
    const itemsWithContexts = active.filter(i => i.contexts.length > 0);
    if (item.contexts.length === 0 && itemsWithContexts.length >= 2) {
      prompts.push({
        id: `no-context-${item.id}`, type: 'item', priority: 28,
        message: `'${item.name}' has no context. When does it weigh on you most?`,
        dismissKey: `no-context-${item.id}`,
      });
    }
  }

  // Filter dismissed and sort by priority
  return prompts
    .filter(p => !profile.dismissedPrompts.includes(p.dismissKey))
    .sort((a, b) => a.priority - b.priority);
}
