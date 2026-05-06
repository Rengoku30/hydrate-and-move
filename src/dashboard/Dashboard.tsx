import { useState } from 'react';
import {
  BarChart3,
  Bell,
  Coffee,
  Droplets,
  Footprints,
  Moon,
  Palette,
  Sparkles,
  User,
} from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { Section } from '../components/Section';
import { ProfileForm } from '../components/ProfileForm';
import { ReminderSettings } from '../components/ReminderSettings';
import { DndPanel } from '../components/DndPanel';
import { HistoryChart } from '../components/HistoryChart';
import { TodayCards } from '../components/TodayCards';
import { palette } from '../lib/theme';
import { LogEntry } from '../lib/types';

export function Dashboard() {
  const { state, loading } = useAppState();
  const [range, setRange] = useState<7 | 14 | 30>(7);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-walnut/60">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6">
        <TodayCards state={state} />

        <Section
          title="Recent activity"
          description="Your hydration and movement progress over the past days, as a percentage of daily targets."
          icon={<BarChart3 size={20} />}
          actions={
            <div className="flex gap-1 bg-bronze/10 p-1 rounded-lg">
              {([7, 14, 30] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition ${
                    range === r ? 'bg-wine text-cream shadow-soft' : 'text-walnut hover:bg-bronze/15'
                  }`}
                >
                  {r}d
                </button>
              ))}
            </div>
          }
        >
          <HistoryChart history={state.dailyHistory} range={range} />
        </Section>

        <div className="grid lg:grid-cols-2 gap-6">
          <Section
            title="Your profile"
            description="We tailor your daily water target based on weight and activity (~35 ml/kg)."
            icon={<User size={20} />}
          >
            <ProfileForm profile={state.profile} />
          </Section>

          <Section
            title="Reminder schedule"
            description="Tune intervals and active hours to match your day."
            icon={<Bell size={20} />}
          >
            <ReminderSettings reminders={state.reminders} />
          </Section>
        </div>

        <Section
          title="Do Not Disturb"
          description="Reminders auto-pause when you're in a meeting, or you can pause manually."
          icon={<Moon size={20} />}
        >
          <DndPanel state={state} />
        </Section>

        <Section
          title="Recent reminders"
          description="The last twelve reminders we sent you and how you resolved them."
          icon={<Sparkles size={20} />}
        >
          <RecentLogs logs={state.logs} />
        </Section>

        <Section
          title="Theme palette"
          description="Hydrate &amp; Move uses these five colors throughout the experience."
          icon={<Palette size={20} />}
        >
          <ThemePreview />
        </Section>
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 text-center text-xs text-walnut/50">
        Hydrate &amp; Move runs locally in your browser. Your data never leaves this device.
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-cream/85 border-b border-bronze/15 mb-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-wine text-cream flex items-center justify-center font-display text-xl font-bold shrink-0">
            H
          </div>
          <div className="min-w-0">
            <div className="font-display text-xl sm:text-2xl text-bronze leading-tight">
              Hydrate &amp; Move
            </div>
            <div className="text-xs text-walnut/60">Wellness reminders, your way.</div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-walnut/60">
          <Droplets size={14} className="text-wine" /> Hydration
          <span className="opacity-30">·</span>
          <Footprints size={14} className="text-bronze" /> Movement
          <span className="opacity-30">·</span>
          <Coffee size={14} className="text-walnut" /> Streaks
        </div>
      </div>
    </header>
  );
}

function RecentLogs({ logs }: { logs: LogEntry[] }) {
  const recent = [...logs].sort((a, b) => b.firedAt - a.firedAt).slice(0, 12);
  if (recent.length === 0) {
    return (
      <div className="text-sm text-walnut/60 text-center py-6">
        No reminders yet — once they start firing they'll show up here.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-bronze/10">
      {recent.map((log) => (
        <li key={log.id} className="py-3 flex items-center gap-3 flex-wrap">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              log.kind === 'hydration' ? 'bg-wine/10 text-wine' : 'bg-bronze/15 text-bronze'
            }`}
          >
            {log.kind === 'hydration' ? <Droplets size={16} /> : <Footprints size={16} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-walnut text-sm capitalize">{log.kind}</div>
            <div className="text-xs text-walnut/60">
              {new Date(log.firedAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          <ResolvedPill resolution={log.resolved} snoozeFor={log.snoozeFor} />
        </li>
      ))}
    </ul>
  );
}

function ResolvedPill({
  resolution,
  snoozeFor,
}: {
  resolution: LogEntry['resolved'];
  snoozeFor?: number;
}) {
  const map: Record<LogEntry['resolved'], { label: string; cls: string }> = {
    done: { label: 'Done', cls: 'bg-wine text-cream' },
    skipped: { label: 'Skipped', cls: 'bg-bronze/20 text-bronze' },
    snoozed: { label: `Snoozed ${snoozeFor ?? ''}m`, cls: 'bg-sand text-walnut' },
    missed: { label: 'Missed', cls: 'bg-walnut/15 text-walnut' },
    deferred: { label: 'Deferred (DND)', cls: 'bg-walnut/10 text-walnut' },
  };
  const v = map[resolution];
  return <span className={`pill ${v.cls}`}>{v.label}</span>;
}

function ThemePreview() {
  const swatches: { name: string; hex: string; usage: string }[] = [
    { name: 'Wine', hex: palette.wine, usage: 'Primary actions, streak accents' },
    { name: 'Cream', hex: palette.cream, usage: 'Canvas background' },
    { name: 'Bronze', hex: palette.bronze, usage: 'Headings, borders' },
    { name: 'Walnut', hex: palette.walnut, usage: 'Body text' },
    { name: 'Sand', hex: palette.sand, usage: 'Secondary buttons, accents' },
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {swatches.map((s) => (
        <div
          key={s.hex}
          className="rounded-xl overflow-hidden border border-bronze/15 shadow-soft"
        >
          <div className="h-16" style={{ background: s.hex }} />
          <div className="p-3 bg-white/70">
            <div className="font-display text-bronze">{s.name}</div>
            <div className="text-xs text-walnut/70 font-mono">{s.hex}</div>
            <div className="text-xs text-walnut/60 mt-1">{s.usage}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
