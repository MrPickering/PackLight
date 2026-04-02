import type { Compartment } from '../types';

export function autoCategorize(text: string): Compartment {
  const lower = text.toLowerCase();
  if (/anxiet|grief|stress|anger|sad|happy|love|fear|guilt|shame|excit|worr|loneli|depress|burnout|overwhelm/.test(lower)) return 'stones';
  if (/work|job|debt|parent|caregiv|responsib|deadline|commit|boss|manag|household|chore/.test(lower)) return 'chains';
  if (/skill|learn|abilit|talent|expert|certif|degree|train|practic/.test(lower)) return 'tools';
  if (/money|saving|health|insur|support|network|home|friend|family|relationship|partner/.test(lower)) return 'provisions';
  if (/goal|plan|dream|want to|working toward|achiev|promot|career|fitness|weight loss/.test(lower)) return 'maps';
  if (/identity|role|value|who I am|being the|reputation|image|self/.test(lower)) return 'souvenirs';
  return 'stones'; // default: emotional weight is the safest catch-all
}
