import { useEffect, useState } from 'react';
import { ReminderConfig } from '../lib/types';
import { patchState } from '../lib/storage';
import { Toggle } from './Toggle';

interface Props {
  reminders: ReminderConfig;
}

export function ReminderSettings({ reminders }: Props) {
  const [draft, setDraft] = useState<ReminderConfig>(reminders);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(reminders), [reminders]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(reminders);

  const save = async () => {
    await patchState((s) => ({ ...s, reminders: draft }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-bronze/15 bg-cream/40 p-4">
          <Toggle
            checked={draft.hydrationEnabled}
            onChange={(v) => setDraft({ ...draft, hydrationEnabled: v })}
            label="Hydration reminders"
            description={`Every ${draft.hydrationMinutes} min during work hours`}
          />
          <input
            type="range"
            min={15}
            max={120}
            step={5}
            value={draft.hydrationMinutes}
            disabled={!draft.hydrationEnabled}
            onChange={(e) =>
              setDraft({ ...draft, hydrationMinutes: Number(e.target.value) })
            }
            className="w-full accent-wine mt-3"
          />
          <div className="flex justify-between text-xs text-walnut/60">
            <span>15m</span>
            <span>{draft.hydrationMinutes}m</span>
            <span>2h</span>
          </div>
        </div>

        <div className="rounded-xl border border-bronze/15 bg-cream/40 p-4">
          <Toggle
            checked={draft.movementEnabled}
            onChange={(v) => setDraft({ ...draft, movementEnabled: v })}
            label="Movement reminders"
            description={`Every ${draft.movementMinutes} min during work hours`}
          />
          <input
            type="range"
            min={20}
            max={180}
            step={5}
            value={draft.movementMinutes}
            disabled={!draft.movementEnabled}
            onChange={(e) =>
              setDraft({ ...draft, movementMinutes: Number(e.target.value) })
            }
            className="w-full accent-bronze mt-3"
          />
          <div className="flex justify-between text-xs text-walnut/60">
            <span>20m</span>
            <span>{draft.movementMinutes}m</span>
            <span>3h</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Work start">
          <input
            type="time"
            className="input"
            value={draft.workStart}
            onChange={(e) => setDraft({ ...draft, workStart: e.target.value })}
          />
        </Field>
        <Field label="Work end">
          <input
            type="time"
            className="input"
            value={draft.workEnd}
            onChange={(e) => setDraft({ ...draft, workEnd: e.target.value })}
          />
        </Field>
        <div className="self-end pb-1">
          <Toggle
            checked={draft.weekdaysOnly}
            onChange={(v) => setDraft({ ...draft, weekdaysOnly: v })}
            label="Weekdays only"
            description="Pause on Saturday & Sunday"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="pill bg-walnut/10 text-walnut">Saved</span>}
        <button onClick={save} disabled={!dirty} className="btn-primary">
          Save reminders
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
