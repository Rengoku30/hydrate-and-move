import { Profile } from './types';

const KG_PER_LB = 0.45359237;
const ML_PER_OZ = 29.5735;

export function toKg(weight: number, units: Profile['units']): number {
  return units === 'metric' ? weight : weight * KG_PER_LB;
}

export function targetMl(profile: Profile): number {
  const kg = toKg(profile.weight, profile.units);
  let ml = kg * 35;
  if (profile.activity === 'high') ml += 500;
  if (profile.activity === 'low') ml -= 250;
  return Math.max(1500, Math.round(ml / 50) * 50);
}

export function mlToDisplay(ml: number, units: Profile['units']): { value: number; unit: string } {
  if (units === 'imperial') {
    return { value: Math.round((ml / ML_PER_OZ) * 10) / 10, unit: 'fl oz' };
  }
  return { value: Math.round(ml), unit: 'ml' };
}

export function movementTargetCount(workStart: string, workEnd: string, intervalMin: number): number {
  const start = parseHHMM(workStart);
  const end = parseHHMM(workEnd);
  const minutes = Math.max(0, end - start);
  return Math.max(1, Math.floor(minutes / intervalMin));
}

export function parseHHMM(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatHHMM(totalMin: number): string {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
