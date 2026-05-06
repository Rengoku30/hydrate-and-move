import { LogKind, RuntimeMessage } from './types';

export function sendQuickLog(kind: LogKind, amountMl?: number) {
  return chrome.runtime.sendMessage({
    type: 'quick-log',
    kind,
    amountMl,
  } satisfies RuntimeMessage);
}

export function sendToggleDnd(manual: boolean, durationMinutes?: number) {
  return chrome.runtime.sendMessage({
    type: 'toggle-dnd',
    manual,
    durationMinutes,
  } satisfies RuntimeMessage);
}

export function sendReminderAction(
  notificationId: string,
  action: 'done' | 'snooze' | 'skip',
  snoozeMinutes?: number,
) {
  return chrome.runtime.sendMessage({
    type: 'reminder-action',
    notificationId,
    action,
    snoozeMinutes,
  } satisfies RuntimeMessage);
}

export function sendRescanMeetings() {
  return chrome.runtime.sendMessage({ type: 'rescan-meetings' } satisfies RuntimeMessage);
}
