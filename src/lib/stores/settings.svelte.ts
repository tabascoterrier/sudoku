export type Theme = 'light' | 'dark' | 'system';

const SETTINGS_KEY = 'sudoku:settings';

interface Settings {
  theme: Theme;
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as Settings;
  } catch {
    // ignore malformed/unavailable storage, fall back to defaults
  }
  return { theme: 'system' };
}

class SettingsStore {
  theme = $state<Theme>(loadSettings().theme);

  setTheme(theme: Theme): void {
    this.theme = theme;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme } satisfies Settings));
    } catch {
      // localStorage unavailable — theme just won't persist across reloads.
    }
  }
}

export const settingsStore = new SettingsStore();
