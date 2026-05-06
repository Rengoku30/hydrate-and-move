import { useMemo, useState } from 'react';
import {
  Coffee,
  Footprints,
  Settings,
  Flame,
  Moon,
  Video,
  Plus,
} from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { sendQuickLog, sendToggleDnd } from '../lib/messages';
import { ProgressRing } from '../components/ProgressRing';
import { mlToDisplay, targetMl, movementTargetCount } from '../lib/hydration';
import { todayKey } from '../lib/time';

export function Popup() {
  const { state, loading } = useAppState();

  const today = useMemo(() => {
    const key = todayKey();
    const found = state.dailyHistory.find((d) => d.date === key);
    return (
      found ?? {
        date: key,
        hydrationMl: 0,
        hydrationDone: 0,
        movementDone: 0,
        hydrationTargetMl: targetMl(state.profile),
        movementTarget: movementTargetCount(
          state.reminders.workStart,
          state.reminders.workEnd,
          state.reminders.movementMinutes,
        ),
      }
    );
  }, [state]);

  const dndOn = state.dnd.manual || (state.dnd.autoMeeting && state.reminders.autoMeetingDnd);

  const hydPct = today.hydrationMl / Math.max(1, today.hydrationTargetMl);
  const movPct = today.movementDone / Math.max(1, today.movementTarget);

  const hydDisplay = mlToDisplay(today.hydrationMl, state.profile.units);
  const targetDisplay = mlToDisplay(today.hydrationTargetMl, state.profile.units);

  if (loading) {
    return (
      <div className="p-6 min-h-[480px] flex items-center justify-center text-walnut/60">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-[480px] p-4 flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-wine text-cream flex items-center justify-center font-display font-bold">
            H
          </div>
          <div>
            <div className="font-display text-lg leading-tight text-bronze">Hydrate &amp; Move</div>
            <div className="text-[11px] text-walnut/60 uppercase tracking-wider">
              {state.streak.current > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Flame size={12} className="text-wine" /> {state.streak.current} day streak
                </span>
              ) : (
                'Stay consistent'
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="w-9 h-9 rounded-lg bg-cream hover:bg-sand/40 flex items-center justify-center text-walnut transition border border-bronze/15"
          aria-label="Open dashboard"
        >
          <Settings size={18} />
        </button>
      </header>

      {dndOn && <DndBanner state={state} />}

      <div className="grid grid-cols-2 gap-2">
        <div className="card !p-3 flex flex-col items-center">
          <ProgressRing
            value={hydPct}
            size={108}
            stroke={10}
            fillColor="#6E0D25"
            label={`${Math.round(hydPct * 100)}%`}
            sublabel="Water"
          />
          <div className="text-xs text-walnut/70 mt-2 text-center">
            <span className="font-semibold text-walnut">
              {hydDisplay.value} {hydDisplay.unit}
            </span>{' '}
            / {targetDisplay.value} {targetDisplay.unit}
          </div>
        </div>
        <div className="card !p-3 flex flex-col items-center">
          <ProgressRing
            value={movPct}
            size={108}
            stroke={10}
            fillColor="#774E24"
            label={`${today.movementDone}`}
            sublabel="Breaks"
          />
          <div className="text-xs text-walnut/70 mt-2 text-center">
            <span className="font-semibold text-walnut">{today.movementDone}</span> /{' '}
            {today.movementTarget} target
          </div>
        </div>
      </div>

      <QuickLogRow servingMl={state.profile.servingMl} />

      <DndToggleRow on={dndOn} manual={state.dnd.manual} />
    </div>
  );
}

function QuickLogRow({ servingMl }: { servingMl: number }) {
  const [pulseHyd, setPulseHyd] = useState(false);
  const [pulseMov, setPulseMov] = useState(false);

  const logHydration = async () => {
    setPulseHyd(true);
    await sendQuickLog('hydration', servingMl);
    setTimeout(() => setPulseHyd(false), 400);
  };
  const logMovement = async () => {
    setPulseMov(true);
    await sendQuickLog('movement');
    setTimeout(() => setPulseMov(false), 400);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={logHydration}
        className={`btn-primary !min-h-[52px] !rounded-xl gap-2 ${pulseHyd ? 'animate-pulseSoft' : ''}`}
      >
        <Coffee size={18} />
        <span className="text-sm">Drank water</span>
        <Plus size={14} className="opacity-70" />
      </button>
      <button
        onClick={logMovement}
        className={`btn-secondary !min-h-[52px] !rounded-xl gap-2 ${pulseMov ? 'animate-pulseSoft' : ''}`}
      >
        <Footprints size={18} />
        <span className="text-sm">Stretched</span>
        <Plus size={14} className="opacity-70" />
      </button>
    </div>
  );
}

function DndToggleRow({ on, manual }: { on: boolean; manual: boolean }) {
  const [busy, setBusy] = useState(false);
  const [duration, setDuration] = useState(60);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    await sendToggleDnd(!manual, !manual ? duration : undefined);
    setBusy(false);
  };

  return (
    <div className="card !p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${on ? 'bg-wine text-cream' : 'bg-bronze/10 text-bronze'}`}>
            <Moon size={18} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-walnut leading-tight">Do Not Disturb</div>
            <div className="text-xs text-walnut/60">
              {on
                ? manual
                  ? 'Manual DND on'
                  : 'Meeting detected'
                : 'Reminders are active'}
            </div>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          className={`pill ${manual ? 'bg-wine text-cream' : 'bg-sand/60 text-walnut hover:bg-sand'}`}
        >
          {manual ? 'Turn off' : 'Pause'}
        </button>
      </div>
      {!manual && (
        <div className="flex items-center gap-2 text-xs text-walnut/70">
          <span>Pause for</span>
          {[15, 30, 60, 120].map((m) => (
            <button
              key={m}
              onClick={() => setDuration(m)}
              className={`px-2 py-1 rounded-md border ${duration === m ? 'border-wine bg-wine/10 text-wine' : 'border-bronze/20 hover:border-bronze/40'}`}
            >
              {m < 60 ? `${m}m` : `${m / 60}h`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DndBanner({ state }: { state: ReturnType<typeof useAppState>['state'] }) {
  const auto = state.dnd.autoMeeting && state.reminders.autoMeetingDnd && !state.dnd.manual;
  return (
    <div className="rounded-lg bg-wine/10 border border-wine/30 px-3 py-2 text-xs text-wine flex items-center gap-2">
      <Video size={14} />
      <span>
        {auto
          ? `Meeting detected on ${state.dnd.detectedTabs.slice(0, 2).join(', ') || 'a tab'} — reminders paused.`
          : 'Manual DND active — reminders paused.'}
      </span>
    </div>
  );
}
