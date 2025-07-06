/**
 * Settings module for KnockoutJS Scanner
 */

// Define the settings interface
export interface Settings {
  // UI Theme
  theme: 'light' | 'dark' | 'system';

  // Data display format
  dataFormat: 'compact' | 'pretty';

  // Show types
  showTypes: boolean;

  // Auto-refresh
  autoRefresh: boolean;

  // Real-time monitoring of observable changes
  realTimeMonitoring: boolean;

  // Locale
  locale: string;
}

// Default settings
export const defaultSettings: Settings = {
  theme: 'system',
  dataFormat: 'pretty',
  showTypes: true,
  autoRefresh: true,
  realTimeMonitoring: true,
  locale: 'en'
};

// Storage key
const STORAGE_KEY = 'ko-scanner-settings';

/**
 * Load settings from localStorage
 * @returns The user settings, or default settings if none are saved
 */
export function loadSettings(): Settings {
  const savedSettings = localStorage.getItem(STORAGE_KEY);
  if (savedSettings) {
    try {
      return { ...defaultSettings, ...JSON.parse(savedSettings) };
    } catch (e) {
      console.error('Error parsing settings:', e);
      return { ...defaultSettings };
    }
  }
  return { ...defaultSettings };
}

/**
 * Save settings to localStorage
 * @param settings The settings to save
 */
export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Update a single setting
 * @param key The setting key to update
 * @param value The new value
 */
export function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]): Settings {
  const settings = loadSettings();
  settings[key] = value;
  saveSettings(settings);
  return settings;
}

/**
 * Apply theme based on settings
 * @param theme The theme to apply
 */
export function applyTheme(theme: Settings['theme']): void {
  // Remove any existing theme classes
  document.body.classList.remove('theme-light', 'theme-dark');

  let themeToApply = theme;

  // If system theme, detect from browser
  if (theme === 'system') {
    themeToApply = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Apply the theme class
  document.body.classList.add(`theme-${themeToApply}`);

  // Set CSS variables based on theme
  if (themeToApply === 'dark') {
    document.documentElement.style.setProperty('--background-color', '#1e1e1e');
    document.documentElement.style.setProperty('--text-color', '#f0f0f0');
    document.documentElement.style.setProperty('--border-color', '#444');
    document.documentElement.style.setProperty('--code-bg-color', '#2d2d2d');
    document.documentElement.style.setProperty('--hover-color', '#333');
    document.documentElement.style.setProperty('--header-bg-color', '#1a1a1a');
    document.documentElement.style.setProperty('--header-text-color', '#f0f0f0');
  } else {
    document.documentElement.style.setProperty('--background-color', '#f9f9f9');
    document.documentElement.style.setProperty('--text-color', '#333');
    document.documentElement.style.setProperty('--border-color', '#ddd');
    document.documentElement.style.setProperty('--code-bg-color', '#f1f1f1');
    document.documentElement.style.setProperty('--hover-color', '#f5f5f5');
    document.documentElement.style.setProperty('--header-bg-color', '#2c3e50');
    document.documentElement.style.setProperty('--header-text-color', 'white');
  }
}

/**
 * Format data based on settings
 * @param data The data to format
 * @param format The format to use
 * @returns Formatted data string
 */
export function formatData(data: any, format: Settings['dataFormat']): string {
  if (format === 'pretty') {
    return JSON.stringify(data, null, 2);
  } else {
    return JSON.stringify(data);
  }
}
