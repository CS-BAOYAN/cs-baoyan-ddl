type Theme = 'light' | 'dark';
type ThemePreference = 'system' | Theme;

const STORAGE_KEY = 'theme';
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';

function storedPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
  } catch {
    return 'system';
  }
}

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia(SYSTEM_THEME_QUERY).matches ? 'dark' : 'light';
}

function resolveTheme(preference: ThemePreference): Theme {
  return preference === 'system' ? systemTheme() : preference;
}

const initialPreference = storedPreference();

export const theme = $state<{ preference: ThemePreference; value: Theme }>({
  preference: initialPreference,
  value: resolveTheme(initialPreference),
});

function renderTheme(t: Theme) {
  theme.value = t;
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', t === 'dark');
  document.documentElement.style.colorScheme = t;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', t === 'dark' ? '#09090b' : '#fafafa');
}

function applyPreference(preference: ThemePreference) {
  theme.preference = preference;
  renderTheme(resolveTheme(preference));
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {}
}

export function cycleTheme() {
  const preferences: ThemePreference[] = ['system', 'light', 'dark'];
  const currentIndex = preferences.indexOf(theme.preference);
  applyPreference(preferences[(currentIndex + 1) % preferences.length]);
}

export function initThemeSync() {
  if (typeof window === 'undefined') return () => {};

  const media = window.matchMedia(SYSTEM_THEME_QUERY);
  const syncSystemTheme = (event: MediaQueryListEvent) => {
    if (theme.preference === 'system') {
      renderTheme(event.matches ? 'dark' : 'light');
    }
  };

  media.addEventListener('change', syncSystemTheme);
  return () => media.removeEventListener('change', syncSystemTheme);
}
