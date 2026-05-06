import { ALARM, ensureMaintenanceAlarms, rescheduleTickAlarms, scheduleSnooze } from '../lib/alarms';
import { detectMeetings, classifyUrl } from '../lib/meeting-detect';
import { loadState, patchState } from '../lib/storage';
import { isWithinWorkHours, todayKey, uid } from '../lib/time';
import { targetMl, mlToDisplay, movementTargetCount } from '../lib/hydration';
import {
  AppState,
  DailyProgress,
  LogEntry,
  LogKind,
  RuntimeMessage,
} from '../lib/types';

const NOTIFICATION_PREFIX = 'hydrate-and-move:reminder:';
const NOTIFICATION_BTN_DONE = 0;
const NOTIFICATION_BTN_SNOOZE = 1;
const DEFER_MINUTES = 10;
const MISSED_TIMEOUT_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(async () => {
  const state = await loadState();
  await rescheduleTickAlarms(state.reminders);
  ensureMaintenanceAlarms();
  await runMeetingScan();
});

chrome.runtime.onStartup.addListener(async () => {
  const state = await loadState();
  await rescheduleTickAlarms(state.reminders);
  ensureMaintenanceAlarms();
  await runMeetingScan();
});

// ---------------------------------------------------------------------------
// Alarms
// ---------------------------------------------------------------------------

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM.hydrationTick) {
    await tryFireReminder('hydration');
    return;
  }
  if (alarm.name === ALARM.movementTick) {
    await tryFireReminder('movement');
    return;
  }
  if (alarm.name === ALARM.dailyReset) {
    await rolloverDay();
    return;
  }
  if (alarm.name === ALARM.meetingScan) {
    await runMeetingScan();
    return;
  }
  if (alarm.name === ALARM.manualDndExpire) {
    await patchState((s) => ({ ...s, dnd: { ...s.dnd, manual: false, manualUntil: undefined } }));
    return;
  }
  if (alarm.name.startsWith(ALARM.snoozePrefix)) {
    const notificationId = alarm.name.slice(ALARM.snoozePrefix.length);
    await replaySnoozedReminder(notificationId);
    return;
  }
});

// ---------------------------------------------------------------------------
// Reminder firing
// ---------------------------------------------------------------------------

async function tryFireReminder(kind: LogKind): Promise<void> {
  const state = await loadState();

  // Skip if disabled
  if (kind === 'hydration' && !state.reminders.hydrationEnabled) return;
  if (kind === 'movement' && !state.reminders.movementEnabled) return;

  if (!isWithinWorkHours(state.reminders)) {
    await appendLog(state, {
      id: uid(),
      kind,
      firedAt: Date.now(),
      resolved: 'missed',
    });
    return;
  }

  if (isDndActive(state)) {
    await appendLog(state, {
      id: uid(),
      kind,
      firedAt: Date.now(),
      resolved: 'deferred',
    });
    // Re-fire in DEFER_MINUTES so we still nudge once DND ends
    chrome.alarms.create(`${ALARM.snoozePrefix}defer-${kind}-${Date.now()}`, {
      delayInMinutes: DEFER_MINUTES,
    });
    return;
  }

  await fireReminder(kind);
}

async function fireReminder(kind: LogKind): Promise<void> {
  const id = uid();
  const notificationId = `${NOTIFICATION_PREFIX}${kind}:${id}`;
  await patchState((s) => ({
    ...s,
    pendingNotifications: {
      ...s.pendingNotifications,
      [notificationId]: { kind, firedAt: Date.now() },
    },
  }));

  const { title, message, contextMessage } = buildNotificationCopy(kind);
  await chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title,
    message,
    contextMessage,
    priority: 2,
    requireInteraction: true,
    buttons: [{ title: 'Done' }, { title: 'Snooze 10 min' }],
  });

  // Auto-mark as missed after timeout if user never reacts
  setTimeout(() => markMissedIfPending(notificationId), MISSED_TIMEOUT_MS);
}

function buildNotificationCopy(kind: LogKind): {
  title: string;
  message: string;
  contextMessage: string;
} {
  if (kind === 'hydration') {
    return {
      title: 'Time to hydrate',
      message: 'Take a sip of water — your body will thank you.',
      contextMessage: 'Hydrate & Move',
    };
  }
  return {
    title: 'Time to move',
    message: 'Stand up, stretch, or walk for 2 minutes.',
    contextMessage: 'Hydrate & Move',
  };
}

async function replaySnoozedReminder(notificationId: string): Promise<void> {
  const state = await loadState();
  const pending = state.pendingNotifications[notificationId];
  if (!pending) return;
  const newId = `${NOTIFICATION_PREFIX}${pending.kind}:${uid()}`;
  await patchState((s) => {
    const { [notificationId]: _removed, ...rest } = s.pendingNotifications;
    void _removed;
    return {
      ...s,
      pendingNotifications: { ...rest, [newId]: { ...pending, firedAt: Date.now() } },
    };
  });
  const { title, message, contextMessage } = buildNotificationCopy(pending.kind);
  await chrome.notifications.create(newId, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title: `${title} (reminder)`,
    message,
    contextMessage,
    priority: 2,
    requireInteraction: true,
    buttons: [{ title: 'Done' }, { title: 'Snooze 10 min' }],
  });
  setTimeout(() => markMissedIfPending(newId), MISSED_TIMEOUT_MS);
}

async function markMissedIfPending(notificationId: string): Promise<void> {
  const state = await loadState();
  const pending = state.pendingNotifications[notificationId];
  if (!pending) return;
  await chrome.notifications.clear(notificationId);
  await resolvePending(notificationId, 'missed');
}

// ---------------------------------------------------------------------------
// Notification button handling
// ---------------------------------------------------------------------------

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (!notificationId.startsWith(NOTIFICATION_PREFIX)) return;
  if (buttonIndex === NOTIFICATION_BTN_DONE) {
    await resolvePending(notificationId, 'done');
  } else if (buttonIndex === NOTIFICATION_BTN_SNOOZE) {
    await snoozePending(notificationId, 10);
  }
  await chrome.notifications.clear(notificationId);
});

chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (!notificationId.startsWith(NOTIFICATION_PREFIX)) return;
  await openReminderWindow(notificationId);
  await chrome.notifications.clear(notificationId);
});

chrome.notifications.onClosed.addListener(async (notificationId, byUser) => {
  if (!notificationId.startsWith(NOTIFICATION_PREFIX)) return;
  if (byUser) {
    await resolvePending(notificationId, 'skipped');
  }
});

async function openReminderWindow(notificationId: string): Promise<void> {
  const url = chrome.runtime.getURL(
    `src/reminder/index.html?nid=${encodeURIComponent(notificationId)}`,
  );
  await chrome.windows.create({
    url,
    type: 'popup',
    width: 460,
    height: 540,
    focused: true,
  });
}

// ---------------------------------------------------------------------------
// Resolution helpers
// ---------------------------------------------------------------------------

async function resolvePending(
  notificationId: string,
  resolution: LogEntry['resolved'],
  snoozeFor?: number,
): Promise<void> {
  await patchState((s) => {
    const pending = s.pendingNotifications[notificationId];
    if (!pending) return s;
    const { [notificationId]: _removed, ...rest } = s.pendingNotifications;
    void _removed;

    const entry: LogEntry = {
      id: notificationId,
      kind: pending.kind,
      firedAt: pending.firedAt,
      resolved: resolution,
      snoozeFor,
      resolvedAt: Date.now(),
    };

    let next = { ...s, pendingNotifications: rest };
    next = appendLogToState(next, entry);

    if (resolution === 'done') {
      next = applyDoneToProgress(next, pending.kind);
    }

    return next;
  });
}

async function snoozePending(notificationId: string, minutes: number): Promise<void> {
  const state = await loadState();
  const pending = state.pendingNotifications[notificationId];
  if (!pending) return;
  await patchState((s) => {
    const entry: LogEntry = {
      id: `snooze-${uid()}`,
      kind: pending.kind,
      firedAt: pending.firedAt,
      resolved: 'snoozed',
      snoozeFor: minutes,
      resolvedAt: Date.now(),
    };
    return appendLogToState(s, entry);
  });
  scheduleSnooze(notificationId, minutes);
}

function appendLog(state: AppState, entry: LogEntry): Promise<AppState> {
  return patchState(() => appendLogToState(state, entry));
}

function appendLogToState(state: AppState, entry: LogEntry): AppState {
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const logs = [...state.logs, entry].filter((l) => l.firedAt >= cutoff);
  return { ...state, logs };
}

function applyDoneToProgress(state: AppState, kind: LogKind): AppState {
  const today = todayKey();
  const todayProgress: DailyProgress = (() => {
    const existing = state.dailyHistory.find((d) => d.date === today);
    if (existing) return existing;
    return {
      date: today,
      hydrationMl: 0,
      hydrationDone: 0,
      movementDone: 0,
      hydrationTargetMl: targetMl(state.profile),
      movementTarget: movementTargetCount(
        state.reminders.workStart,
        state.reminders.workEnd,
        state.reminders.movementMinutes,
      ),
    };
  })();

  const updated: DailyProgress = { ...todayProgress };
  if (kind === 'hydration') {
    updated.hydrationDone += 1;
    updated.hydrationMl += state.profile.servingMl;
  } else {
    updated.movementDone += 1;
  }

  const history = [
    ...state.dailyHistory.filter((d) => d.date !== today),
    updated,
  ].slice(-60);

  // Streak: a "streak day" = at least 50% of hydration target met
  let streak = state.streak;
  const pctHydration = updated.hydrationMl / Math.max(1, updated.hydrationTargetMl);
  if (pctHydration >= 0.5 && streak.lastDay !== today) {
    const yesterday = yesterdayKey();
    const cont = streak.lastDay === yesterday;
    const current = cont ? streak.current + 1 : 1;
    streak = {
      current,
      best: Math.max(streak.best, current),
      lastDay: today,
    };
  }

  return { ...state, dailyHistory: history, streak };
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

// ---------------------------------------------------------------------------
// Daily rollover
// ---------------------------------------------------------------------------

async function rolloverDay(): Promise<void> {
  await patchState((s) => {
    const today = todayKey();
    const exists = s.dailyHistory.some((d) => d.date === today);
    if (exists) return s;
    const fresh: DailyProgress = {
      date: today,
      hydrationMl: 0,
      hydrationDone: 0,
      movementDone: 0,
      hydrationTargetMl: targetMl(s.profile),
      movementTarget: movementTargetCount(
        s.reminders.workStart,
        s.reminders.workEnd,
        s.reminders.movementMinutes,
      ),
    };
    return { ...s, dailyHistory: [...s.dailyHistory, fresh].slice(-60) };
  });
}

// ---------------------------------------------------------------------------
// Meeting detection
// ---------------------------------------------------------------------------

function isDndActive(state: AppState): boolean {
  if (state.dnd.manual) return true;
  if (state.dnd.autoMeeting && state.reminders.autoMeetingDnd) return true;
  return false;
}

async function runMeetingScan(): Promise<void> {
  try {
    const result = await detectMeetings();
    const state = await loadState();
    const wasInMeeting = state.dnd.autoMeeting;
    const nowInMeeting = result.inMeeting;

    if (wasInMeeting === nowInMeeting) {
      const newTabs = Array.from(new Set(result.matches.map((m) => m.hostname))).sort();
      const oldTabs = [...state.dnd.detectedTabs].sort();
      if (JSON.stringify(newTabs) !== JSON.stringify(oldTabs)) {
        await patchState((s) => ({
          ...s,
          dnd: { ...s.dnd, detectedTabs: newTabs },
        }));
      }
      return;
    }

    await patchState((s) => ({
      ...s,
      dnd: {
        ...s.dnd,
        autoMeeting: nowInMeeting,
        detectedTabs: Array.from(new Set(result.matches.map((m) => m.hostname))).sort(),
      },
    }));
  } catch (err) {
    console.warn('[hydrate-and-move] meeting scan failed', err);
  }
}

chrome.tabs.onUpdated.addListener((_tabId, info) => {
  if (info.url || info.audible !== undefined) runMeetingScan();
});
chrome.tabs.onActivated.addListener(() => runMeetingScan());
chrome.tabs.onRemoved.addListener(() => runMeetingScan());
chrome.windows.onFocusChanged.addListener(() => runMeetingScan());

// ---------------------------------------------------------------------------
// Storage change listener — keep alarms in sync with config
// ---------------------------------------------------------------------------

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local') return;
  const change = changes['hydrate-and-move:state'];
  if (!change?.newValue || !change.oldValue) return;
  const next = change.newValue as AppState;
  const prev = change.oldValue as AppState;
  const r1 = next.reminders;
  const r2 = prev.reminders;
  const tickRelevantChanged =
    r1.hydrationMinutes !== r2.hydrationMinutes ||
    r1.movementMinutes !== r2.movementMinutes ||
    r1.hydrationEnabled !== r2.hydrationEnabled ||
    r1.movementEnabled !== r2.movementEnabled;
  if (tickRelevantChanged) {
    await rescheduleTickAlarms(next.reminders);
  }
});

// ---------------------------------------------------------------------------
// Runtime messages from popup / dashboard / reminder window
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((rawMsg: RuntimeMessage, _sender, sendResponse) => {
  (async () => {
    try {
      if (rawMsg.type === 'reminder-action') {
        if (rawMsg.action === 'done') {
          await resolvePending(rawMsg.notificationId, 'done');
        } else if (rawMsg.action === 'skip') {
          await resolvePending(rawMsg.notificationId, 'skipped');
        } else if (rawMsg.action === 'snooze') {
          await snoozePending(rawMsg.notificationId, rawMsg.snoozeMinutes ?? 10);
        }
        try {
          await new Promise<void>((resolve) =>
            chrome.notifications.clear(rawMsg.notificationId, () => resolve()),
          );
        } catch {
          // ignore — notification may already be closed
        }
        sendResponse({ ok: true });
        return;
      }

      if (rawMsg.type === 'quick-log') {
        const id = `quick-${uid()}`;
        await patchState((s) => {
          const entry: LogEntry = {
            id,
            kind: rawMsg.kind,
            firedAt: Date.now(),
            resolved: 'done',
            resolvedAt: Date.now(),
          };
          let next = appendLogToState(s, entry);
          // For hydration quick log, allow custom amount
          if (rawMsg.kind === 'hydration' && rawMsg.amountMl) {
            const today = todayKey();
            const existing = next.dailyHistory.find((d) => d.date === today);
            const target = targetMl(next.profile);
            const updated: DailyProgress = existing
              ? {
                  ...existing,
                  hydrationDone: existing.hydrationDone + 1,
                  hydrationMl: existing.hydrationMl + rawMsg.amountMl,
                  hydrationTargetMl: target,
                }
              : {
                  date: today,
                  hydrationDone: 1,
                  hydrationMl: rawMsg.amountMl,
                  movementDone: 0,
                  hydrationTargetMl: target,
                  movementTarget: movementTargetCount(
                    next.reminders.workStart,
                    next.reminders.workEnd,
                    next.reminders.movementMinutes,
                  ),
                };
            next = {
              ...next,
              dailyHistory: [
                ...next.dailyHistory.filter((d) => d.date !== today),
                updated,
              ].slice(-60),
            };
            // Recompute streak
            const pct = updated.hydrationMl / Math.max(1, updated.hydrationTargetMl);
            if (pct >= 0.5 && next.streak.lastDay !== today) {
              const cont = next.streak.lastDay === yesterdayKey();
              const current = cont ? next.streak.current + 1 : 1;
              next = {
                ...next,
                streak: {
                  current,
                  best: Math.max(next.streak.best, current),
                  lastDay: today,
                },
              };
            }
          } else {
            next = applyDoneToProgress(next, rawMsg.kind);
          }
          return next;
        });
        sendResponse({ ok: true });
        return;
      }

      if (rawMsg.type === 'toggle-dnd') {
        const until =
          rawMsg.manual && rawMsg.durationMinutes
            ? Date.now() + rawMsg.durationMinutes * 60 * 1000
            : undefined;
        await patchState((s) => ({
          ...s,
          dnd: { ...s.dnd, manual: rawMsg.manual, manualUntil: until },
        }));
        await chrome.alarms.clear(ALARM.manualDndExpire);
        if (until) {
          chrome.alarms.create(ALARM.manualDndExpire, { when: until });
        }
        sendResponse({ ok: true });
        return;
      }

      if (rawMsg.type === 'rescan-meetings') {
        await runMeetingScan();
        sendResponse({ ok: true });
        return;
      }
    } catch (err) {
      console.error('[hydrate-and-move] message handler error', err);
      sendResponse({ ok: false, error: String(err) });
    }
  })();
  return true; // keep the message channel open for async response
});

// Surface library helpers to satisfy unused checks in some bundlers
export const __debugHelpers = { mlToDisplay, classifyUrl };
