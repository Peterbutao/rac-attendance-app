import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.rotaract.lilongwe',
  appName: 'Rotaract Club of Lilongwe',
  webDir: 'build'
};

// The portal depends on SvelteKit server loads and actions. Release builds
// therefore use the deployed SvelteKit origin unless a local bundle is
// explicitly requested for shell-only testing.
const useLocalBundle = process.env.CAPACITOR_LOCAL_BUILD === 'true';
const serverUrl = (process.env.CAPACITOR_SERVER_URL?.trim() || 'https://rotaractlilongwe.com').trim();
if (!useLocalBundle && serverUrl) {
  config.server = {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://')
  };
}

export default config;
