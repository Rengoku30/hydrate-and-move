import { useEffect, useState } from 'react';
import { ActivityLevel, Profile, Sex, Units } from '../lib/types';
import { patchState } from '../lib/storage';
import { mlToDisplay, targetMl } from '../lib/hydration';

interface Props {
  profile: Profile;
}

export function ProfileForm({ profile }: Props) {
  const [draft, setDraft] = useState<Profile>(profile);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(profile), [profile]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);

  const save = async () => {
    await patchState((s) => ({ ...s, profile: draft, onboarded: true }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const target = targetMl(draft);
  const display = mlToDisplay(target, draft.units);

  return (
    <div className="grid gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={`Weight (${draft.units === 'metric' ? 'kg' : 'lb'})`}>
          <input
            type="number"
            min={20}
            max={400}
            step={0.5}
            className="input"
            value={draft.weight}
            onChange={(e) => setDraft({ ...draft, weight: Number(e.target.value) })}
          />
        </Field>
        <Field label={`Height (${draft.units === 'metric' ? 'cm' : 'in'})`}>
          <input
            type="number"
            min={80}
            max={250}
            className="input"
            value={draft.height}
            onChange={(e) => setDraft({ ...draft, height: Number(e.target.value) })}
          />
        </Field>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Age">
          <input
            type="number"
            min={10}
            max={120}
            className="input"
            value={draft.age}
            onChange={(e) => setDraft({ ...draft, age: Number(e.target.value) })}
          />
        </Field>
        <Field label="Sex">
          <select
            className="input"
            value={draft.sex}
            onChange={(e) => setDraft({ ...draft, sex: e.target.value as Sex })}
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other / prefer not to say</option>
          </select>
        </Field>
        <Field label="Units">
          <select
            className="input"
            value={draft.units}
            onChange={(e) => setDraft({ ...draft, units: e.target.value as Units })}
          >
            <option value="metric">Metric (kg, ml)</option>
            <option value="imperial">Imperial (lb, fl oz)</option>
          </select>
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Activity level">
          <select
            className="input"
            value={draft.activity}
            onChange={(e) => setDraft({ ...draft, activity: e.target.value as ActivityLevel })}
          >
            <option value="low">Low — desk-bound most of the day</option>
            <option value="moderate">Moderate — some walking / light exercise</option>
            <option value="high">High — active job or daily workouts</option>
          </select>
        </Field>
        <Field label={`Cup size (${draft.units === 'metric' ? 'ml' : 'fl oz approx'})`}>
          <input
            type="number"
            min={50}
            max={1000}
            step={10}
            className="input"
            value={draft.servingMl}
            onChange={(e) =>
              setDraft({ ...draft, servingMl: Math.max(50, Number(e.target.value)) })
            }
          />
        </Field>
      </div>

      <div className="rounded-xl bg-sand/30 border border-sand/60 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-bronze font-semibold">
            Daily water target
          </div>
          <div className="font-display text-2xl text-walnut">
            {display.value} {display.unit}
          </div>
          <div className="text-xs text-walnut/60">Calculated from weight &amp; activity (~35 ml/kg)</div>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="pill bg-walnut/10 text-walnut">Saved</span>}
          <button onClick={save} disabled={!dirty} className="btn-primary">
            Save profile
          </button>
        </div>
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
