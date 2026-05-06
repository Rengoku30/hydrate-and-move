import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Hydrate & Move',
  version: '0.1.0',
  description:
    'Friendly wellness reminders to hydrate and move. Auto-pauses during meetings, with a profile-driven dashboard.',
  icons: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Hydrate & Move',
    default_icon: {
      16: 'icons/icon16.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
  },
  options_page: 'src/dashboard/index.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  permissions: ['alarms', 'notifications', 'storage', 'tabs', 'idle'],
  web_accessible_resources: [
    {
      resources: ['src/reminder/index.html', 'icons/*'],
      matches: ['<all_urls>'],
    },
  ],
});
