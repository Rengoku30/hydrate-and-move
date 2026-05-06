import { useState } from 'react';
import { Video, Moon, RefreshCw } from 'lucide-react';
import { AppState } from '../lib/types';
import { patchState } from '../lib/storage';
import { sendRescanMeetings, sendToggleDnd } from '../lib/messages';
import { Toggle } from './Toggle';

interface Props {
  state: AppState;
}

export function DndPanel({ state }: Props) {
  const [busy, setBusy] = useState(false);

  const setAuto = async (v: boolean) => {
    await patchState((s) => ({ ...s, reminders: { ...s.reminders, autoMeetingDnd: v } }));
  };

  const togglePause = async (minutes?: number) => {
    setBusy(true);
    await sendToggleDnd(!state.dnd.manual, minutes);
    setBusy(false);
  };

  const rescan = async () => {
    setBusy(true);
    await sendRescanMeetings();
    setBusy(false);
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-bronze/15 bg-cream/40 p-4">
        <Toggle
          checked={state.reminders.autoMeetingDnd}
          onChange={setAuto}
          label="Auto-pause during meetings"
          description="Detects active Zoom, Google Meet, Teams, Webex, Whereby and Slack huddle tabs."
        />
        <div className="mt-3 flex items-center gap-2 text-xs text-walnut/70">
          <Video size={14} className="shrink-0" />
          {state.dnd.autoMeeting ? (
            <span>
              Currently in meeting:{' '}
              <span className="font-semibold text-walnut">
                {state.dnd.detectedTabs.join(', ') || 'detected'}
              </span>
            </span>
          ) : (
            <span>No meeting detected on any open tab.</span>
          )}
          <button
            onClick={rescan}
            disabled={busy}
            className="ml-auto inline-flex items-center gap-1 text-bronze hover:text-wine"
          >
            <RefreshCw size={12} /> Rescan
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-bronze/15 bg-cream/40 p-4 flex flex-wrap items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${state.dnd.manual ? 'bg-wine text-cream' : 'bg-bronze/10 text-bronze'}`}>
          <Moon size={20} />
        </div>
        <div className="flex-1 min-w-[180px]">
          <div className="font-semibold text-walnut">Manual Do Not Disturb</div>
          <div className="text-xs text-walnut/60">
            {state.dnd.manual
              ? state.dnd.manualUntil
                ? `Resumes at ${new Date(state.dnd.manualUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'On until you turn it off'
              : 'Reminders are active'}
          </div>
        </div>
        {state.dnd.manual ? (
          <button onClick={() => togglePause()} disabled={busy} className="btn-secondary">
            Resume reminders
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {[15, 30, 60, 120].map((m) => (
              <button
                key={m}
                onClick={() => togglePause(m)}
                disabled={busy}
                className="px-3 py-2 min-h-[44px] rounded-lg bg-wine/10 hover:bg-wine/20 text-wine font-semibold text-sm transition"
              >
                Pause {m < 60 ? `${m}m` : `${m / 60}h`}
              </button>
            ))}
          </div>
        )}
      </div>

      <details className="text-sm text-walnut/70">
        <summary className="cursor-pointer hover:text-walnut">
          What domains trigger auto-DND?
        </summary>
        <ul className="mt-2 grid sm:grid-cols-2 gap-1 text-xs list-disc pl-5">
          <li>meet.google.com/abc-defg-hij</li>
          <li>*.zoom.us/j/, /wc/, /s/, /my/</li>
          <li>teams.microsoft.com/*meetup-join*</li>
          <li>teams.live.com/meet/</li>
          <li>*.webex.com/meet, /wbxmjs, /webappng</li>
          <li>around.co/r/</li>
          <li>whereby.com</li>
          <li>app.slack.com/huddle</li>
          <li>discord.com/channels (call rooms)</li>
        </ul>
      </details>
    </div>
  );
}
