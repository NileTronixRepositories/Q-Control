import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

async function loadRuntimeConfig(): Promise<void> {
  try {
    const configUrl = new URL('app-config.json', document.baseURI).toString();
    const response = await fetch(configUrl, { cache: 'no-cache' });
    if (response.ok) {
      const config = await response.json();
      if (config && typeof config.apiBaseUrl === 'string' && config.apiBaseUrl.trim().length > 0) {
        (environment as { apiBaseUrl: string }).apiBaseUrl = normalizeBaseUrl(config.apiBaseUrl.trim());
      }
    }
  } catch (error) {
    console.warn('[AppConfig] Could not load app-config.json, falling back to environment defaults:', error);
  }
}

loadRuntimeConfig().finally(() => {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
});
