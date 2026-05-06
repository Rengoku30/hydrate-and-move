import { ReminderConfig } from './types';
import { parseHHMM } from './hydration';

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isWithinWorkHours(cfg: ReminderConfig, now: Date = new Date()): boolean {
  if (cfg.weekdaysOnly) {
    const day = now.getDay();
    if (day === 0 || day === 6) return false;
  }
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = parseHHMM(cfg.workStart);
  const end = parseHHMM(cfg.workEnd);
  if (start <= end) return minutes >= start && minutes <= end;
  // wraps midnight (rare)
  return minutes >= start || minutes <= end;
}

export function nextWorkStart(cfg: ReminderConfig, from: Date = new Date()): Date {
  const start = parseHHMM(cfg.workStart);
  const next = new Date(from);
  next.setSeconds(0, 0);
  for (let i = 0; i < 8; i++) {
    next.setHours(0, 0, 0, 0);
    next.setMinutes(start);
    if (next > from) {
      const day = next.getDay();
      const isWeekend = day === 0 || day === 6;
      if (!cfg.weekdaysOnly || !isWeekend) return next;
    }
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
