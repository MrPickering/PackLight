/**
 * Research Sources — PackLight Life Load Theory
 *
 * ─── Core Principle ──────────────────────────────────────────
 *
 * Everything you carry has weight — good and bad.
 *
 * The Holmes-Rahe Stress Scale (1967) proved this: their 43 life
 * stressors include marriage (#7), pregnancy (#12), outstanding
 * personal achievement (#25), and vacation (#41). Selye's eustress
 * concept (1974) confirmed that positive stress activates the same
 * physiological pathways as distress. McEwen's allostatic load
 * theory (1998) shows cumulative burden doesn't distinguish between
 * good and bad — it's all load on the system.
 *
 * The goal is not an empty pack. It's carrying the right things
 * at the right weight, consciously.
 *
 * ─── Sources ───────────────────────────────────────────────────
 *
 * 1. Holmes–Rahe Social Readjustment Rating Scale (SRRS)
 *    Holmes, T.H. & Rahe, R.H. (1967). Journal of Psychosomatic
 *    Research, 11(2), 213-218.
 *    KEY: Positive events (marriage, achievement, new family member)
 *    are rated as significant stressors alongside negative ones.
 *
 * 2. Selye's Eustress/Distress Model
 *    Selye, H. (1974). "Stress Without Distress."
 *    Both positive and negative stress consume adaptive energy.
 *    The body doesn't distinguish — it just responds to demand.
 *
 * 3. Allostatic Load — Cumulative Burden
 *    McEwen, B.S. (1998). NEJM, 338(3), 171-179.
 *    Cumulative wear-and-tear from ALL sustained demands.
 *    Success, vigilance, and maintaining good things all contribute.
 *
 * 4. Conservation of Resources Theory
 *    Hobfoll, S.E. (1989). American Psychologist, 44(3), 513-524.
 *    People invest resources to protect resources. Gain spirals
 *    exist but so does the stress of protecting what you've gained.
 *
 * 5. Lazarus Daily Hassles Scale
 *    Kanner et al. (1981). Journal of Behavioral Medicine, 4(1), 1-39.
 *    Daily hassles predict health better than major life events.
 *    Includes mundane maintenance of positive life structures.
 *
 * 6. APA Stress in America Survey (2007-2023)
 *    Top stressors: money, work, economy, family, health.
 *    Note: "family" includes the weight of loving and caring.
 *
 * ─── How These Map to Categories ──────────────────────────────
 *
 * Emotions (internal key: stones):
 *   All emotional states consume energy. Grief and anxiety obviously,
 *   but also love, excitement, hope, pride. Holmes-Rahe rates
 *   "outstanding personal achievement" at 28 stress points.
 *
 * Responsibilities (internal key: chains):
 *   Both chosen and unchosen obligations. Parenting scores 39 on
 *   Holmes-Rahe. Leadership, caregiving, being dependable — these
 *   are often meaningful AND heavy simultaneously.
 *
 * Abilities (internal key: tools):
 *   Skills reduce load but carry their own weight — pressure to
 *   perform, maintain competence, live up to potential. High
 *   capability creates high expectations (Karasek demand-control).
 *
 * Resources (internal key: provisions):
 *   Having resources is protective (McEwen) but Hobfoll's COR theory
 *   shows that protecting what you have is itself a stressor.
 *   Wealth, health, stability all require maintenance energy.
 *
 * Goals (internal key: maps):
 *   Direction is protective but ambitious goals create pressure.
 *   The "arrival fallacy" — reaching a goal rarely feels as light
 *   as expected because new weight immediately replaces it.
 *
 * Identity (internal key: souvenirs):
 *   Roles and values define us but constrain us. "Being the strong
 *   one" means you can't be weak. Social identity theory (Tajfel)
 *   shows identity maintenance is active, effortful work.
 */

import type { Compartment } from './index';

export interface ExampleItem {
  name: string;
  compartment: Compartment;
  weight: number;
  utility: number;
  description: string;
}

/**
 * Common examples drawn from the research above.
 * Used during onboarding so users see realistic, relatable items
 * and can select ones that apply or write their own.
 */
export const EXAMPLE_ITEMS: Record<Compartment, ExampleItem[]> = {
  stones: [
    { name: 'Grief or loss', compartment: 'stones', weight: 8, utility: 2, description: 'Unprocessed grief from losing someone or something important.' },
    { name: 'Anxiety about the future', compartment: 'stones', weight: 7, utility: 2, description: 'Persistent worry about what comes next — career, health, relationships.' },
    { name: 'Excitement about a big change', compartment: 'stones', weight: 5, utility: 7, description: 'A new job, a move, a relationship — thrilling but mentally consuming.' },
    { name: 'Self-doubt', compartment: 'stones', weight: 6, utility: 2, description: 'Imposter syndrome, feeling not good enough, comparing yourself to others.' },
    { name: 'Burnout', compartment: 'stones', weight: 8, utility: 1, description: 'Emotional exhaustion from sustained overwork or caregiving.' },
    { name: 'Love and worry for someone', compartment: 'stones', weight: 5, utility: 8, description: 'Caring deeply about a partner, child, or friend. Worth it, but it takes energy.' },
    { name: 'Loneliness', compartment: 'stones', weight: 7, utility: 1, description: 'Feeling disconnected or isolated, even when surrounded by people.' },
    { name: 'Pride you need to protect', compartment: 'stones', weight: 4, utility: 6, description: 'An achievement or success that now comes with expectations to maintain.' },
    { name: 'Regret', compartment: 'stones', weight: 5, utility: 1, description: 'Ruminating on past decisions or missed opportunities.' },
    { name: 'Unresolved conflict', compartment: 'stones', weight: 6, utility: 1, description: 'A relationship rupture or argument that hasn\'t been addressed.' },
  ],
  chains: [
    { name: 'Debt payments', compartment: 'chains', weight: 7, utility: 3, description: 'Student loans, credit cards, or other recurring debt obligations.' },
    { name: 'Raising kids', compartment: 'chains', weight: 8, utility: 9, description: 'The most meaningful and most demanding thing many people do.' },
    { name: 'Leading a team', compartment: 'chains', weight: 6, utility: 8, description: 'People depend on your decisions. Rewarding but heavy.' },
    { name: 'Overloaded schedule', compartment: 'chains', weight: 7, utility: 4, description: 'Too many commitments — saying yes to everything, no margin left.' },
    { name: 'Maintaining a relationship', compartment: 'chains', weight: 4, utility: 8, description: 'Keeping a partnership healthy takes consistent effort and attention.' },
    { name: 'Caregiving for a parent', compartment: 'chains', weight: 7, utility: 7, description: 'Caring for aging parents. Love and duty intertwined.' },
    { name: 'Being the reliable one', compartment: 'chains', weight: 5, utility: 6, description: 'Everyone counts on you. It\'s a compliment that costs energy.' },
    { name: 'Toxic work environment', compartment: 'chains', weight: 8, utility: 3, description: 'Conflict, micromanagement, or dysfunction at work.' },
    { name: 'People-pleasing commitments', compartment: 'chains', weight: 5, utility: 2, description: 'Things you agreed to out of guilt, not genuine desire.' },
  ],
  tools: [
    { name: 'Communication skills', compartment: 'tools', weight: 2, utility: 9, description: 'Ability to express yourself clearly and listen actively.' },
    { name: 'Technical expertise', compartment: 'tools', weight: 4, utility: 8, description: 'Your professional skills. Valuable but come with pressure to stay current.' },
    { name: 'Emotional regulation', compartment: 'tools', weight: 3, utility: 9, description: 'Ability to manage your emotions under stress.' },
    { name: 'High standards', compartment: 'tools', weight: 5, utility: 7, description: 'Your standards produce great work, but perfectionism has a cost.' },
    { name: 'Physical fitness', compartment: 'tools', weight: 4, utility: 8, description: 'Strength and endurance. Maintaining it is itself a commitment.' },
    { name: 'Empathy', compartment: 'tools', weight: 4, utility: 8, description: 'Feeling what others feel. Powerful for connection, draining without boundaries.' },
    { name: 'Problem-solving', compartment: 'tools', weight: 2, utility: 8, description: 'Breaking down complex situations into actionable steps.' },
    { name: 'Ambition', compartment: 'tools', weight: 5, utility: 7, description: 'Your drive. It got you here, but it doesn\'t let you rest.' },
  ],
  provisions: [
    { name: 'Emergency savings', compartment: 'provisions', weight: 2, utility: 9, description: 'Money set aside. Peace of mind, but you think about protecting it.' },
    { name: 'Good health', compartment: 'provisions', weight: 3, utility: 9, description: 'Your body works. Maintaining it takes daily decisions.' },
    { name: 'Strong support network', compartment: 'provisions', weight: 3, utility: 9, description: 'People you can call. But relationships need maintenance too.' },
    { name: 'Stable housing', compartment: 'provisions', weight: 2, utility: 9, description: 'A safe place to live. Comes with mortgage, rent, upkeep.' },
    { name: 'A good job', compartment: 'provisions', weight: 4, utility: 8, description: 'Steady income and purpose. Also expectations and time commitment.' },
    { name: 'Mental health support', compartment: 'provisions', weight: 2, utility: 9, description: 'Access to therapy or counseling when you need it.' },
    { name: 'Reputation', compartment: 'provisions', weight: 4, utility: 7, description: 'What you\'ve built over time. Valuable but fragile — costs energy to maintain.' },
    { name: 'Professional network', compartment: 'provisions', weight: 3, utility: 7, description: 'Colleagues and mentors. Relationships that need tending.' },
  ],
  maps: [
    { name: 'Career advancement', compartment: 'maps', weight: 5, utility: 8, description: 'Getting promoted, switching fields, or building your own thing.' },
    { name: 'Get healthier', compartment: 'maps', weight: 4, utility: 8, description: 'Exercise, diet, sleep — the gap between knowing and doing.' },
    { name: 'Financial independence', compartment: 'maps', weight: 5, utility: 9, description: 'Paying off debt, building savings. The goal weighs until you get there.' },
    { name: 'Be a better parent/partner', compartment: 'maps', weight: 5, utility: 9, description: 'The most important goals are often the heaviest to carry.' },
    { name: 'Start something new', compartment: 'maps', weight: 4, utility: 7, description: 'A business, a project, a creative pursuit. Exciting and uncertain.' },
    { name: 'Achieve something big', compartment: 'maps', weight: 6, utility: 8, description: 'A major milestone. The pressure of "I should be further along by now."' },
    { name: 'Find more balance', compartment: 'maps', weight: 3, utility: 8, description: 'Work less, live more. Sounds simple, costs real trade-offs.' },
    { name: 'Improve mental health', compartment: 'maps', weight: 4, utility: 9, description: 'Start therapy, build better habits, address root causes.' },
  ],
  souvenirs: [
    { name: 'Being a good parent', compartment: 'souvenirs', weight: 5, utility: 9, description: 'Central to who you are. Meaningful and demanding every day.' },
    { name: 'Your work ethic', compartment: 'souvenirs', weight: 4, utility: 7, description: 'You\'re proud of how hard you work. It also makes it hard to stop.' },
    { name: 'A core passion', compartment: 'souvenirs', weight: 3, utility: 8, description: 'The thing that lights you up. Neglecting it costs you; pursuing it takes time.' },
    { name: 'Being the strong one', compartment: 'souvenirs', weight: 5, utility: 5, description: 'Everyone leans on you. It\'s who you are, but it means you can\'t be weak.' },
    { name: 'Core values', compartment: 'souvenirs', weight: 2, utility: 9, description: 'Honesty, kindness, courage. Living by principles requires constant choices.' },
    { name: 'Cultural identity', compartment: 'souvenirs', weight: 3, utility: 8, description: 'Heritage and community. Rich but sometimes comes with obligations or conflict.' },
    { name: 'Past achievements', compartment: 'souvenirs', weight: 3, utility: 6, description: 'What you\'ve done. Pride, but also the pressure to keep matching it.' },
    { name: 'A defining relationship', compartment: 'souvenirs', weight: 3, utility: 8, description: 'A bond that shaped who you are. Carrying it means tending it.' },
  ],
};
