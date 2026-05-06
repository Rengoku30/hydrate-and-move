import { Coffee, Flame, Footprints } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { sendQuickLog } from '../lib/messages';
import { mlToDisplay, targetMl, movementTargetCount } from '../lib/hydration';
import { todayKey } from '../lib/time';
import { AppState } from '../lib/types';

interface Props {
  state: AppState;
}

export function TodayCards({ state }: Props) {
  const key = todayKey();
  const today =
    state.dailyHistory.find((d) => d.date === key) ?? {
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
    };

  const hydPct = today.hydrationMl / Math.max(1, today.hydrationTargetMl);
  const movPct = today.movementDone / Math.max(1, today.movementTarget);
  const hyd = mlToDisplay(today.hydrationMl, state.profile.units);
  const tgt = mlToDisplay(today.hydrationTargetMl, state.profile.units);

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="card flex items-center gap-4">
        <ProgressRing
          value={hydPct}
          size={120}
          stroke={12}
          fillColor="#6E0D25"
          label={`${Math.round(hydPct * 100)}%`}
          sublabel="Water"
        />
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-bronze font-semibold">
            Hydration today
          </div>
          <div className="font-display text-2xl text-walnut">
            {hyd.value} <span className="text-base text-walnut/60">{hyd.unit}</span>
          </div>
          <div className="text-sm text-walnut/70">
            of {tgt.value} {tgt.unit} ({today.hydrationDone} cups)
          </div>
          <button
            onClick={() => sendQuickLog('hydration', state.profile.servingMl)}
            className="btn-primary !min-h-[40px] !py-2 mt-3 text-sm"
          >
            <Coffee size={16} /> +1 cup
          </button>
        </div>
      </div>

      <div className="card flex items-center gap-4">
        <ProgressRing
          value={movPct}
          size={120}
          stroke={12}
          fillColor="#774E24"
          label={`${today.movementDone}`}
          sublabel="Breaks"
        />
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-bronze font-semibold">
            Movement today
          </div>
          <div className="font-display text-2xl text-walnut">
            {today.movementDone} <span className="text-base text-walnut/60">/ {today.movementTarget}</span>
          </div>
          <div className="text-sm text-walnut/70">stretch breaks taken</div>
          <button
            onClick={() => sendQuickLog('movement')}
            className="btn-secondary !min-h-[40px] !py-2 mt-3 text-sm"
          >
            <Footprints size={16} /> Log a break
          </button>
        </div>
      </div>

      <div className="card flex items-center gap-4">
        <div className="w-[120px] h-[120px] rounded-full bg-wine/10 text-wine flex flex-col items-center justify-center">
          <Flame size={36} />
          <div className="font-display text-3xl mt-1">{state.streak.current}</div>
        </div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-bronze font-semibold">
            Current streak
          </div>
          <div className="font-display text-2xl text-walnut">
            {state.streak.current} day{state.streak.current === 1 ? '' : 's'}
          </div>
          <div className="text-sm text-walnut/70">Best: {state.streak.best}</div>
          <div className="text-xs text-walnut/60 mt-2">
            Hit 50% of your hydration target to keep the streak going.
          </div>
        </div>
      </div>
    </div>
  );
}
