/**
 * Research Sources — PackLight Life Load Categories
 *
 * The compartments and example items in PackLight are informed by
 * established psychological and public-health research on stress,
 * life events, and cumulative burden.
 *
 * ─── Sources ───────────────────────────────────────────────────
 *
 * 1. APA Stress in America Survey
 *    American Psychological Association. (2023). "Stress in America
 *    2023: A Nation Recovering from Collective Trauma."
 *    Top stressor categories (consistently since 2007): money, work,
 *    the economy, family responsibilities, and health concerns.
 *
 * 2. Holmes–Rahe Social Readjustment Rating Scale (SRRS)
 *    Holmes, T.H. & Rahe, R.H. (1967). "The Social Readjustment
 *    Rating Scale." Journal of Psychosomatic Research, 11(2), 213-218.
 *    Ranks 43 life events by stress impact (Life Change Units).
 *    Top events: death of spouse, divorce, separation, illness,
 *    job loss, financial change, retirement.
 *
 * 3. Lazarus Daily Hassles Scale
 *    Kanner, A.D., Coyne, J.C., Schaefer, C., & Lazarus, R.S. (1981).
 *    "Comparison of Two Modes of Stress Measurement: Daily Hassles and
 *    Uplifts versus Major Life Events." Journal of Behavioral Medicine,
 *    4(1), 1-39.
 *    Key finding: daily hassles predicted health outcomes better than
 *    major life events. Categories: household maintenance, time pressure,
 *    financial worries, work friction, health concerns, family concerns.
 *
 * 4. WHO World Mental Health Report
 *    World Health Organization. (2022). "World Mental Health Report:
 *    Transforming Mental Health for All."
 *    Structural determinants of chronic stress: poverty, social isolation,
 *    discrimination, violence/abuse, displacement.
 *
 * 5. Allostatic Load — Cumulative Stress Burden
 *    McEwen, B.S. (1998). "Protective and Damaging Effects of Stress
 *    Mediators." New England Journal of Medicine, 338(3), 171-179.
 *    McEwen, B.S. & Stellar, E. (1993). "Stress and the Individual."
 *    Archives of Internal Medicine, 153(18), 2093-2101.
 *    Allostatic load = cumulative wear-and-tear from chronic stress.
 *    Driven by repeated acute stress, failure to recover, prolonged
 *    activation. Predicts cardiovascular disease, cognitive decline.
 *
 * ─── How These Map to Compartments ────────────────────────────
 *
 * Stones (Emotional Weight):
 *   Informed by Holmes–Rahe major life events and APA's health/
 *   relationship stressors. Grief, anxiety, unresolved conflict,
 *   self-doubt, burnout.
 *
 * Chains (Obligations):
 *   Informed by APA's work/financial stressors and Lazarus's daily
 *   hassles around time pressure and commitments. Debt, subscriptions,
 *   caregiving duties, overcommitment.
 *
 * Tools (Skills & Capabilities):
 *   Informed by WHO's emphasis on education/employment as protective
 *   factors. Skills are resources that reduce overall load.
 *
 * Provisions (Resources & Safety Nets):
 *   Informed by APA's financial stress data and McEwen's allostatic
 *   load model — adequate resources buffer against stress accumulation.
 *
 * Maps (Goals & Direction):
 *   Informed by research showing that purpose and direction are
 *   protective against allostatic load (McEwen, 1998).
 *
 * Souvenirs (Identity & Meaning):
 *   Informed by WHO's findings on social connection and meaning
 *   as protective factors for mental health.
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
    { name: 'Grief or loss', compartment: 'stones', weight: 8, utility: 1, description: 'Unprocessed grief from losing someone or something important.' },
    { name: 'Anxiety about the future', compartment: 'stones', weight: 7, utility: 2, description: 'Persistent worry about what comes next — career, health, relationships.' },
    { name: 'Unresolved conflict', compartment: 'stones', weight: 6, utility: 1, description: 'A relationship rupture or argument that hasn\'t been addressed.' },
    { name: 'Self-doubt', compartment: 'stones', weight: 6, utility: 2, description: 'Imposter syndrome, feeling not good enough, comparing yourself to others.' },
    { name: 'Burnout', compartment: 'stones', weight: 8, utility: 1, description: 'Emotional exhaustion from sustained overwork or caregiving.' },
    { name: 'Loneliness', compartment: 'stones', weight: 7, utility: 1, description: 'Feeling disconnected or isolated, even when surrounded by people.' },
    { name: 'Regret', compartment: 'stones', weight: 5, utility: 1, description: 'Ruminating on past decisions or missed opportunities.' },
    { name: 'Health anxiety', compartment: 'stones', weight: 6, utility: 2, description: 'Worry about your own health or a loved one\'s health.' },
  ],
  chains: [
    { name: 'Debt payments', compartment: 'chains', weight: 7, utility: 3, description: 'Student loans, credit cards, or other recurring debt obligations.' },
    { name: 'Overloaded schedule', compartment: 'chains', weight: 7, utility: 4, description: 'Too many commitments — saying yes to everything, no margin left.' },
    { name: 'Draining relationship', compartment: 'chains', weight: 6, utility: 2, description: 'A relationship that takes more energy than it gives back.' },
    { name: 'Job you\'ve outgrown', compartment: 'chains', weight: 6, utility: 4, description: 'Staying in a role that no longer challenges or fulfills you.' },
    { name: 'Caregiving duties', compartment: 'chains', weight: 7, utility: 6, description: 'Caring for aging parents, children, or others who depend on you.' },
    { name: 'Unused subscriptions', compartment: 'chains', weight: 2, utility: 1, description: 'Monthly charges for services you barely use.' },
    { name: 'Toxic work environment', compartment: 'chains', weight: 8, utility: 3, description: 'Conflict, micromanagement, or dysfunction at work.' },
    { name: 'People-pleasing commitments', compartment: 'chains', weight: 5, utility: 2, description: 'Things you agreed to out of guilt, not genuine desire.' },
  ],
  tools: [
    { name: 'Communication skills', compartment: 'tools', weight: 2, utility: 9, description: 'Ability to express yourself clearly and listen actively.' },
    { name: 'Technical expertise', compartment: 'tools', weight: 3, utility: 8, description: 'Your professional skills — coding, design, writing, analysis, etc.' },
    { name: 'Financial literacy', compartment: 'tools', weight: 2, utility: 8, description: 'Understanding budgets, investments, and money management.' },
    { name: 'Emotional regulation', compartment: 'tools', weight: 3, utility: 9, description: 'Ability to manage your emotions under stress.' },
    { name: 'Problem-solving', compartment: 'tools', weight: 2, utility: 8, description: 'Breaking down complex situations into actionable steps.' },
    { name: 'Physical fitness', compartment: 'tools', weight: 3, utility: 8, description: 'Strength, endurance, and physical capability.' },
    { name: 'Creativity', compartment: 'tools', weight: 2, utility: 7, description: 'Ability to think differently and generate new ideas.' },
    { name: 'Leadership', compartment: 'tools', weight: 3, utility: 8, description: 'Guiding teams, making decisions, inspiring others.' },
  ],
  provisions: [
    { name: 'Emergency savings', compartment: 'provisions', weight: 1, utility: 9, description: '3-6 months of expenses set aside for unexpected events.' },
    { name: 'Health insurance', compartment: 'provisions', weight: 2, utility: 8, description: 'Coverage that protects against catastrophic medical costs.' },
    { name: 'Strong support network', compartment: 'provisions', weight: 2, utility: 9, description: 'Friends and family you can call when things get hard.' },
    { name: 'Stable housing', compartment: 'provisions', weight: 2, utility: 9, description: 'A safe, reliable place to live.' },
    { name: 'Reliable transportation', compartment: 'provisions', weight: 2, utility: 7, description: 'A car, transit pass, or other way to get where you need to go.' },
    { name: 'Mental health support', compartment: 'provisions', weight: 2, utility: 9, description: 'Access to therapy, counseling, or psychiatric care.' },
    { name: 'Retirement savings', compartment: 'provisions', weight: 1, utility: 7, description: '401k, IRA, or other long-term financial security.' },
    { name: 'Professional network', compartment: 'provisions', weight: 2, utility: 7, description: 'Colleagues and mentors who can open doors.' },
  ],
  maps: [
    { name: 'Career advancement', compartment: 'maps', weight: 4, utility: 8, description: 'Getting promoted, switching fields, or building your own thing.' },
    { name: 'Get healthier', compartment: 'maps', weight: 3, utility: 8, description: 'Lose weight, exercise regularly, improve diet, sleep better.' },
    { name: 'Financial independence', compartment: 'maps', weight: 4, utility: 9, description: 'Paying off debt, building savings, investing for the future.' },
    { name: 'Deepen relationships', compartment: 'maps', weight: 3, utility: 8, description: 'Spend more quality time with people who matter.' },
    { name: 'Learn something new', compartment: 'maps', weight: 3, utility: 7, description: 'Pick up a new skill, language, or area of knowledge.' },
    { name: 'Move to a new city', compartment: 'maps', weight: 5, utility: 7, description: 'Relocate for opportunity, adventure, or a fresh start.' },
    { name: 'Start a creative project', compartment: 'maps', weight: 3, utility: 7, description: 'Write a book, start a podcast, build something meaningful.' },
    { name: 'Improve mental health', compartment: 'maps', weight: 4, utility: 9, description: 'Start therapy, build better habits, address root causes.' },
  ],
  souvenirs: [
    { name: 'A core passion', compartment: 'souvenirs', weight: 2, utility: 8, description: 'The thing that lights you up — music, cooking, hiking, art.' },
    { name: 'Family traditions', compartment: 'souvenirs', weight: 2, utility: 7, description: 'Holiday rituals, recipes, or gatherings that ground you.' },
    { name: 'A life-changing experience', compartment: 'souvenirs', weight: 2, utility: 7, description: 'Travel, a mentor, a breakthrough moment that shaped who you are.' },
    { name: 'Core values', compartment: 'souvenirs', weight: 1, utility: 9, description: 'Honesty, kindness, courage — the principles you live by.' },
    { name: 'A cherished relationship', compartment: 'souvenirs', weight: 2, utility: 9, description: 'A friendship or bond that defines part of your identity.' },
    { name: 'Cultural identity', compartment: 'souvenirs', weight: 2, utility: 8, description: 'Heritage, language, community that connects you to your roots.' },
    { name: 'Personal achievements', compartment: 'souvenirs', weight: 1, utility: 7, description: 'Degrees, milestones, or things you\'re proud of accomplishing.' },
    { name: 'Spiritual practice', compartment: 'souvenirs', weight: 2, utility: 8, description: 'Faith, meditation, or practices that give you meaning.' },
  ],
};
