import { useEffect, useMemo, useState } from 'react';
import { Check, Coffee, Footprints, Moon, X } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { sendReminderAction } from '../lib/messages';

function getNotificationId(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('nid');
}

export function Reminder() {
  const { state, loading } = useAppState();
  const [resolved, setResolved] = useState<null | 'done' | 'snoozed' | 'skipped'>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const nid = getNotificationId();

  const pending = useMemo(() => {
    if (!nid) return null;
    return state.pendingNotifications[nid] ?? null;
  }, [nid, state.pendingNotifications]);

  // If state is loaded and there's no pending entry, the reminder was already resolved
  // elsewhere (e.g. notification button) — auto-close after a moment.
  useEffect(() => {
    if (loading) return;
    if (!nid) return;
    if (!pending && resolved === null) {
      const t = setTimeout(() => window.close(), 800);
      return () => clearTimeout(t);
    }
  }, [loading, nid, pending, resolved]);

  if (!nid) {
    return (
      <FullBleed>
        <div className="text-center text-cream/90">
          <h1 className="text-3xl font-display mb-2">No reminder selected</h1>
          <p className="opacity-80">Open the popup to log your progress.</p>
        </div>
      </FullBleed>
    );
  }

  const kind = pending?.kind ?? 'hydration';
  const isHydration = kind === 'hydration';

  const handle = async (action: 'done' | 'skip') => {
    setResolved(action === 'done' ? 'done' : 'skipped');
    await sendReminderAction(nid, action);
    setTimeout(() => window.close(), 700);
  };

  const handleSnooze = async (minutes: number) => {
    setResolved('snoozed');
    await sendReminderAction(nid, 'snooze', minutes);
    setTimeout(() => window.close(), 700);
  };

  return (
    <FullBleed>
      <div className="w-full max-w-md mx-auto text-center text-cream">
        {resolved ? (
          <ResolvedView action={resolved} />
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cream/15 backdrop-blur mb-5 ring-1 ring-cream/30">
              {isHydration ? <Coffee size={36} /> : <Footprints size={36} />}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl mb-2">
              {isHydration ? 'Time to hydrate' : 'Time to move'}
            </h1>
            <p className="text-cream/80 mb-1 text-base sm:text-lg">
              {isHydration
                ? 'Take a few sips of water now.'
                : 'Stand up and stretch for 1–2 minutes.'}
            </p>
            <p className="text-cream/60 text-sm mb-8">Did you do it?</p>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
              <button
                onClick={() => handle('done')}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-cream text-wine font-semibold py-3 text-base shadow-soft hover:bg-cream/90 active:scale-[0.98] transition"
              >
                <Check size={20} /> Yes, done
              </button>
              <button
                onClick={() => setPickerOpen((v) => !v)}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-sand text-walnut font-semibold py-3 text-base hover:bg-sand/90 active:scale-[0.98] transition"
              >
                <Moon size={20} /> Snooze
              </button>
            </div>

            {pickerOpen && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[5, 10, 15, 30].map((m) => (
                  <button
                    key={m}
                    onClick={() => handleSnooze(m)}
                    className="min-h-[44px] rounded-lg bg-cream/15 hover:bg-cream/25 backdrop-blur text-cream font-semibold transition"
                  >
                    {m}m
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => handle('skip')}
              className="mt-5 min-h-[44px] inline-flex items-center gap-2 text-cream/70 hover:text-cream text-sm underline-offset-4 hover:underline mx-auto"
            >
              <X size={16} /> Skip this one
            </button>
          </>
        )}
      </div>
    </FullBleed>
  );
}

function ResolvedView({ action }: { action: 'done' | 'snoozed' | 'skipped' }) {
  const messages = {
    done: { title: 'Nice work', sub: 'Logged. Keep it up.' },
    snoozed: { title: "We'll nudge you again", sub: 'Reminder rescheduled.' },
    skipped: { title: 'Skipped', sub: 'No worries — see you next round.' },
  } as const;
  return (
    <div className="text-center text-cream animate-pulseSoft">
      <div className="w-20 h-20 mx-auto rounded-full bg-cream/20 backdrop-blur flex items-center justify-center mb-4">
        <Check size={40} />
      </div>
      <h2 className="font-display text-3xl">{messages[action].title}</h2>
      <p className="text-cream/80 mt-1">{messages[action].sub}</p>
    </div>
  );
}

function FullBleed({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="min-h-screen w-full flex items-center justify-center px-6 py-8"
      style={{
        background:
          'linear-gradient(135deg, #2A9D8F 0%, #264653 70%, #2A9D8F 130%)',
      }}
    >
      {children}
    </main>
  );
}
