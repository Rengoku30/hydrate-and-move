export type Units = 'metric' | 'imperial';
export type Sex = 'male' | 'female' | 'other';
export type ActivityLevel = 'low' | 'moderate' | 'high';

export interface Profile {
  weight: number; // kg if metric, lb if imperial
  height: number; // cm if metric, in if imperial
  age: number;
  sex: Sex;
  activity: ActivityLevel;
  units: Units;
  servingMl: number; // size of one cup of water in ml (default 250)
}

export interface ReminderConfig {
  hydrationMinutes: number; // default 45
  movementMinutes: number; // default 60
  workStart: string; // 'HH:mm' 24h
  workEnd: string; // 'HH:mm'
  weekdaysOnly: boolean;
  snoozeOptions: number[]; // [5, 10, 15, 30] minutes
  hydrationEnabled: boolean;
  movementEnabled: boolean;
  autoMeetingDnd: boolean;
}

export interface DndState {
  manual: boolean;
  autoMeeting: boolean;
  manualUntil?: number; // epoch ms when manual DND auto-clears
  detectedTabs: string[]; // hostnames of detected meeting tabs
}

export type LogKind = 'hydration' | 'movement';
export type LogResolution = 'done' | 'skipped' | 'snoozed' | 'missed' | 'deferred';

export interface LogEntry {
  id: string;
  kind: LogKind;
  firedAt: number;
  resolved: LogResolution;
  snoozeFor?: number; // minutes
  resolvedAt?: number;
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  hydrationMl: number;
  hydrationDone: number;
  movementDone: number;
  hydrationTargetMl: number;
  movementTarget: number;
}

export interface AppState {
  profile: Profile;
  reminders: ReminderConfig;
  dnd: DndState;
  logs: LogEntry[]; // capped to last 90 days
  dailyHistory: DailyProgress[]; // last 60 days
  streak: { current: number; best: number; lastDay: string | null };
  pendingNotifications: Record<string, { kind: LogKind; firedAt: number }>;
  onboarded: boolean;
  schemaVersion: number;
}

export interface ReminderActionMessage {
  type: 'reminder-action';
  notificationId: string;
  action: 'done' | 'snooze' | 'skip';
  snoozeMinutes?: number;
}

export interface QuickLogMessage {
  type: 'quick-log';
  kind: LogKind;
  amountMl?: number; // for hydration
}

export interface ToggleDndMessage {
  type: 'toggle-dnd';
  manual: boolean;
  durationMinutes?: number;
}

export interface RescanMeetingsMessage {
  type: 'rescan-meetings';
}

export type RuntimeMessage =
  | ReminderActionMessage
  | QuickLogMessage
  | ToggleDndMessage
  | RescanMeetingsMessage;

export const DEFAULT_PROFILE: Profile = {
  weight: 70,
  height: 170,
  age: 30,
  sex: 'other',
  activity: 'moderate',
  units: 'metric',
  servingMl: 250,
};

export const DEFAULT_REMINDERS: ReminderConfig = {
  hydrationMinutes: 45,
  movementMinutes: 60,
  workStart: '09:00',
  workEnd: '18:00',
  weekdaysOnly: true,
  snoozeOptions: [5, 10, 15, 30],
  hydrationEnabled: true,
  movementEnabled: true,
  autoMeetingDnd: true,
};

export const DEFAULT_DND: DndState = {
  manual: false,
  autoMeeting: false,
  detectedTabs: [],
};

export const DEFAULT_STATE: AppState = {
  profile: DEFAULT_PROFILE,
  reminders: DEFAULT_REMINDERS,
  dnd: DEFAULT_DND,
  logs: [],
  dailyHistory: [],
  streak: { current: 0, best: 0, lastDay: null },
  pendingNotifications: {},
  onboarded: false,
  schemaVersion: 1,
};
