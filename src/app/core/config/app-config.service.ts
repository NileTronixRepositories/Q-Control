import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AppConfig } from './app-config.model';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private readonly configState = signal<AppConfig>({
    apiBaseUrl: environment.apiBaseUrl,
  });

  readonly config = this.configState.asReadonly();

  get apiBaseUrl(): string {
    return this.configState().apiBaseUrl;
  }

  updateConfig(newConfig: Partial<AppConfig>): void {
    const updated: AppConfig = {
      ...this.configState(),
      ...(newConfig.apiBaseUrl ? { apiBaseUrl: newConfig.apiBaseUrl } : {}),
    };
    this.configState.set(updated);
    (environment as { apiBaseUrl: string }).apiBaseUrl = updated.apiBaseUrl;
  }
}
