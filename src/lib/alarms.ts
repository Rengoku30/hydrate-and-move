import { ReminderConfig } from './types';

export const ALARM = {
  hydrationTick: 'hydrate-and-move:hydration-tick',
  movementTick: 'hydrate-and-move:movement-tick',
  dailyReset: 'hydrate-and-move:daily-reset',
  meetingScan: 'hydrate-and-move:meeting-scan',
  manualDndExpire: 'hydrate-and-move:manual-dnd-expire',
  snoozePrefix: 'hydrate-and-move:snooze:',
} as const;

export async function clearAllAppAlarms(): Promise<void> {
  const all = await chrome.alarms.getAll();
  await Promise.all(
    all
      .filter((a) => a.name.startsWith('hydrate-and-move:'))
      .map((a) => chrome.alarms.clear(a.name)),
  );
}

export async function rescheduleTickAlarms(cfg: ReminderConfig): Promise<void> {
  // Clear tick alarms only (preserve snoozes / scans)
  await chrome.alarms.clear(ALARM.hydrationTick);
  await chrome.alarms.clear(ALARM.movementTick);

  if (cfg.hydrationEnabled) {
    chrome.alarms.create(ALARM.hydrationTick, {
      delayInMinutes: cfg.hydrationMinutes,
      periodInMinutes: cfg.hydrationMinutes,
    });
  }
  if (cfg.movementEnabled) {
    chrome.alarms.create(ALARM.movementTick, {
      delayInMinutes: cfg.movementMinutes,
      periodInMinutes: cfg.movementMinutes,
    });
  }
}

export function ensureMaintenanceAlarms(): void {
  // Daily reset at next local midnight
  const next = new Date();
  next.setHours(24, 0, 5, 0);
  chrome.alarms.create(ALARM.dailyReset, {
    when: next.getTime(),
    periodInMinutes: 24 * 60,
  });

  // Periodic meeting scan every minute as a safety net
  chrome.alarms.create(ALARM.meetingScan, {
    delayInMinutes: 1,
    periodInMinutes: 1,
  });
}

export function scheduleSnooze(notificationId: string, minutes: number): string {
  const name = `${ALARM.snoozePrefix}${notificationId}`;
  chrome.alarms.create(name, { delayInMinutes: minutes });
  return name;
}
