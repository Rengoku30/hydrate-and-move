# Hydrate & Move

A wellness Chrome extension that gently nudges you to **drink water** and
**move your body** throughout the workday — with a profile-driven dashboard,
streak tracking, and smart Do-Not-Disturb that auto-pauses while you're in a
video call.

Built with **React 18 + TypeScript + Vite + Tailwind CSS** on Chrome
**Manifest V3**.

---

## Features

- **Reminders that respect your day.** Configurable hydration interval
(default 45 min) and movement interval (default 60 min), gated to your work
hours and (optionally) weekdays only.
- **Smart Do Not Disturb.** Auto-detects active meetings on Zoom, Google
Meet, Microsoft Teams, Webex, Whereby, Around, Slack huddles and Discord
call rooms. While you're in a meeting, reminders are deferred — not
dropped.
- **Manual pause.** One-click DND for 15m / 30m / 1h / 2h with auto-resume.
- **Reminder dialogue.** Each reminder asks "did you do it?" with **Done**,
**Snooze (5/10/15/30 min)** and **Skip** actions, both as a native
notification and as a fuller in-window prompt.
- **Profile-driven hydration target.** Enter weight, height, age, sex,
activity level and units (metric / imperial). Daily target is calculated
at ~35 ml per kg of body weight, with a small bump for high-activity
days.
- **Dashboard.** Today's progress rings, current streak, 7/14/30-day
history bar chart (Recharts), profile editor, reminder schedule,
DND settings, recent reminder log and theme palette.
- **Quick log.** Popup buttons to log a cup of water or a stretch break in
one tap.
- **Local-first.** All data stays in `chrome.storage.local`; nothing is
sent off-device.
- **Mobile-responsive dashboard.** The dashboard scales cleanly down to
~320 px wide and uses 44 px touch targets.

---

## Color theme

The five-color palette used throughout the UI:


| Token  | Hex       | Usage                               |
| ------ | --------- | ----------------------------------- |
| wine   | `#6E0D25` | Primary actions, streak accents     |
| cream  | `#FFFFB3` | Canvas background                   |
| bronze | `#774E24` | Headings, borders, secondary accent |
| walnut | `#6A381F` | Body text, deep accents             |
| sand   | `#DCAB6B` | Secondary buttons, progress fill    |


These are exposed as Tailwind tokens in
`[tailwind.config.ts](tailwind.config.ts)` and as constants in
`[src/lib/theme.ts](src/lib/theme.ts)`.

---

## Install (development)

Requirements: **Node 20+** and a Chromium browser (Chrome, Edge, Brave, Arc).

```bash
npm install
npm run icons      # generates public/icons/icon{16,48,128}.png from SVG
npm run build      # bundles to ./dist
```

Then in your browser:

1. Open `chrome://extensions`
2. Toggle **Developer mode** on
3. Click **Load unpacked** and select the project's `dist/` folder

For live development with HMR:

```bash
npm run dev
```

…and load the `dist/` folder the same way. The `@crxjs/vite-plugin` will
hot-reload the popup, dashboard and reminder pages while you edit.

---

## Permissions, explained


| Permission      | Why we need it                                                |
| --------------- | ------------------------------------------------------------- |
| `alarms`        | Periodic hydration / movement reminders + daily reset.        |
| `notifications` | The reminder itself (with Done / Snooze buttons).             |
| `storage`       | Persist your profile, schedule, history and streak locally.   |
| `tabs`          | Read tab URLs to detect when you're in a meeting (auto-DND).  |
| `idle`          | Used to confirm you're at the device before firing reminders. |


We deliberately **do not request** `<all_urls>` host permissions. Tab URL
matching for meeting detection works through the standard `tabs` permission.

---

## How reminders work

```text
chrome.alarms tick
  → inside work hours? ──no──→ log "missed" + reschedule
  ↓ yes
  DND active? (manual OR meeting detected)
  ↓ yes ─→ log "deferred" + retry in 10 min
  ↓ no
  fire chrome.notifications  (Done | Snooze 10 min)
       ↓
  click body  ─→ open richer reminder window (Done | Snooze 5/10/15/30 | Skip)
       ↓
  unresolved after 5 min  ─→ log "missed"
```

Snoozes create one-shot alarms named
`hydrate-and-move:snooze:<notificationId>` so they survive the service
worker shutting down. The state machine is implemented in
`[src/background/index.ts](src/background/index.ts)`.

---

## Project layout

```
.
├── manifest.config.ts         # MV3 manifest definition (used by crxjs)
├── vite.config.ts
├── tailwind.config.ts         # palette tokens
├── scripts/generate-icons.mjs # SVG → PNG icon generator
├── public/icons/              # generated icons checked in for convenience
└── src/
    ├── background/index.ts    # service worker (alarms, DND, notifications)
    ├── popup/                 # browser action popup
    ├── dashboard/             # full options page (chrome.runtime.openOptionsPage)
    ├── reminder/              # popup window shown on notification click
    ├── components/            # ProfileForm, ReminderSettings, DndPanel,
    │                          # HistoryChart, TodayCards, ProgressRing,
    │                          # Toggle, Section
    ├── hooks/useAppState.ts
    ├── lib/                   # storage, alarms, meeting-detect, hydration,
    │                          # types, theme, time, messages
    └── styles/globals.css
```

---

## Out of scope (for now)

- Google Calendar integration for richer "in a meeting" signal — would add
the `identity` permission and a Google OAuth flow.
- Cross-device sync — switching `chrome.storage.local` to
`chrome.storage.sync` is straightforward but constrained by sync quotas.
- Wearable / phone integration.

---

## License

MIT — do whatever you want, but please don't use this to harass people
into hydrating.