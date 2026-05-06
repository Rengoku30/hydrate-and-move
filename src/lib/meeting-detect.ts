export const MEETING_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'Google Meet', re: /^https:\/\/meet\.google\.com\/[a-z0-9-]+/i },
  { name: 'Zoom', re: /^https:\/\/([a-z0-9-]+\.)?zoom\.us\/(j|wc|s|my)\//i },
  {
    name: 'Microsoft Teams',
    re: /^https:\/\/teams\.(microsoft|live)\.com\/.*(meetup-join|\/meet\/)/i,
  },
  { name: 'Webex', re: /^https:\/\/([a-z0-9-]+\.)?webex\.com\/(meet|wbxmjs|webappng)\//i },
  { name: 'Around', re: /^https:\/\/(meet\.)?around\.co\/r\//i },
  { name: 'Whereby', re: /^https:\/\/whereby\.com\//i },
  { name: 'Discord call', re: /^https:\/\/discord\.com\/channels\//i },
  { name: 'Slack huddle', re: /^https:\/\/app\.slack\.com\/huddle/i },
];

export interface MeetingDetectionResult {
  inMeeting: boolean;
  matches: { hostname: string; service: string; tabId?: number; audible: boolean }[];
}

export async function detectMeetings(): Promise<MeetingDetectionResult> {
  const tabs = await chrome.tabs.query({});
  const matches: MeetingDetectionResult['matches'] = [];

  for (const tab of tabs) {
    if (!tab.url) continue;
    for (const { name, re } of MEETING_PATTERNS) {
      if (re.test(tab.url)) {
        try {
          const u = new URL(tab.url);
          matches.push({
            hostname: u.hostname,
            service: name,
            tabId: tab.id,
            audible: !!tab.audible,
          });
        } catch {
          // ignore malformed url
        }
        break;
      }
    }
  }

  return {
    inMeeting: matches.length > 0,
    matches,
  };
}

export function classifyUrl(url: string | undefined): string | null {
  if (!url) return null;
  for (const { name, re } of MEETING_PATTERNS) {
    if (re.test(url)) return name;
  }
  return null;
}
