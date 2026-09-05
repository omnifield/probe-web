/** Reactive i18n store with lazy locales, RTL, interpolation, pluralization,
 * backend-error translation, and persisted selection. */

import { getPluralCategory } from './i18n-utils.js';

const STORAGE_KEY = 'windshift-locale';
// Reference locale: the only catalog guaranteed complete, used as the
// fallback when a key is missing from the active locale. Keep this 'en'
// even though the UI now defaults to ru — see DEFAULT_UI_LOCALE below.
const DEFAULT_LOCALE = 'en';
// Locale shown to a visitor who hasn't picked one yet (no saved
// preference). Deliberately independent of the browser's language.
const DEFAULT_UI_LOCALE = 'ru';

// Supported locale metadata.
export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', direction: 'ltr' },
  { code: 'de', name: 'Deutsch', direction: 'ltr' },
  { code: 'es', name: 'Español', direction: 'ltr' },
  { code: 'ru', name: 'Русский', direction: 'ltr' },
  { code: 'ar', name: 'العربية', direction: 'rtl' },
  { code: 'pt-BR', name: 'Português (Brasil)', direction: 'ltr' },
  { code: 'zh-CN', name: '简体中文', direction: 'ltr' },
];

// Reactive locale state.
let locale = $state(DEFAULT_LOCALE);
let translations = $state({});
let fallbackTranslations = $state({});
let loading = $state(false);

// Derived direction state.
const direction = $derived(SUPPORTED_LOCALES.find((l) => l.code === locale)?.direction || 'ltr');

const isRTL = $derived(direction === 'rtl');

/** Read a dot-notated value from an object. */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? current[key] : undefined;
  }, obj);
}

/** Interpolate {param} placeholders. */
function interpolate(str, params = {}) {
  if (!str || typeof str !== 'string') return str;

  return str.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

function getTranslationValue(source, key, params = {}) {
  if (params.count !== undefined) {
    const category = getPluralCategory(locale, params.count);
    const pluralKey = `${key}_${category}`;
    const otherKey = `${key}_other`;
    return (
      getNestedValue(source, pluralKey) ??
      getNestedValue(source, otherKey) ??
      getNestedValue(source, key)
    );
  }

  return getNestedValue(source, key);
}

/**
 * Get translation for a key with optional interpolation and pluralization
 * @param {string} key - Translation key (dot notation)
 * @param {object} params - Parameters for interpolation (use 'count' for pluralization)
 * @returns {string}
 */
export function t(key, params = {}) {
  let value = getTranslationValue(translations, key, params);

  if (value === undefined && locale !== DEFAULT_LOCALE) {
    value = getTranslationValue(fallbackTranslations, key, params);
  }

  // Return key if translation not found (helps identify missing translations)
  if (value === undefined) {
    console.warn(`Missing translation: ${key}`);
    return key;
  }

  return interpolate(value, params);
}

/**
 * Translate a backend error object
 * @param {Error|object} error - Error object with optional code and details
 * @returns {string}
 */
export function translateError(error) {
  if (!error) return t('errors.INTERNAL_ERROR');

  // Check if error has a code property
  const code = error.code || error.errorCode;

  if (code) {
    // Look up translation for error code
    const translation =
      getNestedValue(translations, `errors.${code}`) ??
      getNestedValue(fallbackTranslations, `errors.${code}`);
    if (translation) {
      // Interpolate details if available
      return interpolate(translation, error.details || {});
    }
  }

  // Fall back to error message if available
  if (error.message) {
    return error.message;
  }

  // Final fallback
  return t('errors.INTERNAL_ERROR');
}

async function loadFallbackTranslations() {
  if (Object.keys(fallbackTranslations).length > 0) {
    return;
  }

  const module = await import(`../locales/${DEFAULT_LOCALE}/index.js`);
  fallbackTranslations = module.default;
}

/**
 * Load translations for a locale
 * @param {string} localeCode - Locale code to load
 * @param {object} [options]
 * @param {boolean} [options.persist=true] - Save this locale as the user's
 *   preference. Set to `false` for the transient error-fallback below — a
 *   one-off failed chunk fetch (e.g. a dev-server restart racing a dynamic
 *   `import()`) must not silently overwrite a saved 'ru' preference with
 *   'en' for every future visit.
 */
async function loadTranslations(localeCode, { persist = true } = {}) {
  loading = true;

  try {
    if (localeCode !== DEFAULT_LOCALE) {
      await loadFallbackTranslations();
    }

    // Dynamic import for lazy loading
    const module = await import(`../locales/${localeCode}/index.js`);
    translations = module.default;
    if (localeCode === DEFAULT_LOCALE) {
      fallbackTranslations = module.default;
    }
    locale = localeCode;

    // Persist to localStorage — only for a deliberate resolution (saved
    // preference, explicit setLocale), not a transient failure fallback.
    if (persist && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, localeCode);
    }

    // Update document direction
    if (typeof document !== 'undefined') {
      document.documentElement.dir = direction;
      document.documentElement.lang = localeCode;
    }
  } catch (err) {
    console.error(`Failed to load locale: ${localeCode}`, err);

    // Fall back to English IN MEMORY if loading fails — never persisted,
    // so a transient fetch failure can't overwrite the saved preference.
    if (localeCode !== DEFAULT_LOCALE) {
      await loadTranslations(DEFAULT_LOCALE, { persist: false });
    }
  } finally {
    loading = false;
  }
}

/**
 * Initialize i18n with saved or default locale
 */
async function init() {
  let initialLocale = DEFAULT_UI_LOCALE;

  // Check localStorage for saved preference
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LOCALES.some((l) => l.code === saved)) {
      initialLocale = saved;
    }
  }

  await loadTranslations(initialLocale);
}

/**
 * Change the current locale
 * @param {string} localeCode - New locale code
 */
async function setLocale(localeCode) {
  if (!SUPPORTED_LOCALES.some((l) => l.code === localeCode)) {
    console.warn(`Unsupported locale: ${localeCode}`);
    return;
  }

  if (localeCode === locale && Object.keys(translations).length > 0) {
    return; // Already loaded
  }

  await loadTranslations(localeCode);
}

/**
 * Get the current locale code
 */
function getLocale() {
  return locale;
}

/**
 * Check if translations are currently loading
 */
function isLoading() {
  return loading;
}

// Export the i18n store
export const i18n = {
  get locale() {
    return locale;
  },
  get direction() {
    return direction;
  },
  get isRTL() {
    return isRTL;
  },
  get loading() {
    return loading;
  },
  get supportedLocales() {
    return SUPPORTED_LOCALES;
  },
  init,
  setLocale,
  getLocale,
  isLoading,
  t,
  translateError,
};

// Also export t and translateError directly for convenience
export { t as translate };
