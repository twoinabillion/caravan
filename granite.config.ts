import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'caravan',
  brand: {
    displayName: '서울까지 400km',
    primaryColor: '#b94a2f',
    icon: '',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  webViewProps: {
    type: 'game',
    allowsInlineMediaPlayback: true,
    mediaPlaybackRequiresUserAction: false,
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: 'never',
    allowsBackForwardNavigationGestures: false,
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: false,
    withTitle: false,
    transparentBackground: true,
  },
  permissions: [],
  outdir: 'dist',
});
