import { AppState, DEFAULT_STATE } from './types';

const KEY = 'hydrate-and-move:state';

export async function loadState(): Promise<AppState> {
  const raw = await chrome.storage.local.get(KEY);
  const stored = raw[KEY] as Partial<AppState> | undefined;
  if (!stored) return structuredClone(DEFAULT_STATE);
  return mergeWithDefaults(stored);
}

export async function saveState(state: AppState): Promise<void> {
  await chrome.storage.local.set({ [KEY]: state });
}

export async function patchState(
  patch: (s: AppState) => AppState | Promise<AppState>,
): Promise<AppState> {
  const current = await loadState();
  const next = await patch(current);
  await saveState(next);
  return next;
}

export function subscribe(cb: (state: AppState) => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: chrome.storage.AreaName,
  ) => {
    if (area !== 'local') return;
    const change = changes[KEY];
    if (!change) return;
    const next = change.newValue as AppState | undefined;
    if (next) cb(mergeWithDefaults(next));
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

function mergeWithDefaults(stored: Partial<AppState>): AppState {
  return {
    ...DEFAULT_STATE,
    ...stored,
    profile: { ...DEFAULT_STATE.profile, ...(stored.profile ?? {}) },
    reminders: { ...DEFAULT_STATE.reminders, ...(stored.reminders ?? {}) },
    dnd: { ...DEFAULT_STATE.dnd, ...(stored.dnd ?? {}) },
    streak: { ...DEFAULT_STATE.streak, ...(stored.streak ?? {}) },
    pendingNotifications: { ...(stored.pendingNotifications ?? {}) },
    logs: stored.logs ?? [],
    dailyHistory: stored.dailyHistory ?? [],
    schemaVersion: stored.schemaVersion ?? DEFAULT_STATE.schemaVersion,
  };
}
