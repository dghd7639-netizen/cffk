import { computed, onMounted, ref, type ComputedRef } from "vue";

import enUS from "@/lib/i18n/en-US";
import zhCN from "@/lib/i18n/zh-CN";
import zhTW from "@/lib/i18n/zh-TW";

const locales = {
  "zh-CN": zhCN,
  "en-US": enUS,
  "zh-TW": zhTW,
} as const;

export type StorefrontLocale = keyof typeof locales;
export type StorefrontTheme = "light" | "dark";
type Messages = (typeof locales)[StorefrontLocale];

const localeStorageKey = "storefront-locale";
const themeStorageKey = "storefront-theme";
const locale = ref<StorefrontLocale>("zh-CN");
const theme = ref<StorefrontTheme>("light");
export const blurLevels = [0, 5, 15, 30, 45, 60, 75, 90, 100] as const;
export function normalizeBlurLevel(value: string | number | null): number {
  if (value === null || String(value).trim() === "" || !Number.isFinite(Number(value))) return 5;
  return blurLevels.reduce<number>((nearest, level) => Math.abs(level - Number(value)) < Math.abs(nearest - Number(value)) ? level : nearest, 0);
}
const blurLevel = ref(5);
function cycleBlur() {
  blurLevel.value = blurLevels[(blurLevels.findIndex(level => level === blurLevel.value) + 1) % blurLevels.length];
  try { window.localStorage.setItem("storefront-blur", String(blurLevel.value)); } catch { /* Keep the preference for this visit when storage is unavailable. */ }
}
let initialized = false;

function isLocale(value: string | null): value is StorefrontLocale {
  return value === "zh-CN" || value === "zh-TW" || value === "en-US";
}

function isTheme(value: string | null): value is StorefrontTheme {
  return value === "light" || value === "dark";
}

export function detectBrowserLocale(browserLocales: readonly string[]): StorefrontLocale {
  for (const browserLocale of browserLocales) {
    const normalizedLocale = browserLocale.toLowerCase();
    if (normalizedLocale === "zh-tw" || normalizedLocale.startsWith("zh-hant") || normalizedLocale.startsWith("zh-hk") || normalizedLocale.startsWith("zh-mo")) return "zh-TW";
    if (normalizedLocale.startsWith("en")) return "en-US";
    if (normalizedLocale.startsWith("zh")) return "zh-CN";
  }

  return "zh-CN";
}

function applyDocumentPreferences() {
  document.documentElement.classList.toggle("dark", theme.value === "dark");
  document.documentElement.lang = locale.value;
}

function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try { blurLevel.value = normalizeBlurLevel(window.localStorage.getItem("storefront-blur")); } catch { blurLevel.value = 5; }

  const savedLocale = window.localStorage.getItem(localeStorageKey);
  const savedTheme = window.localStorage.getItem(themeStorageKey);
  if (isLocale(savedLocale)) {
    locale.value = savedLocale;
  } else {
    locale.value = detectBrowserLocale(navigator.languages.length > 0 ? navigator.languages : [navigator.language]);
    window.localStorage.setItem(localeStorageKey, locale.value);
  }
  if (isTheme(savedTheme)) theme.value = savedTheme;
  applyDocumentPreferences();
}

function replaceParams(value: string, params: Record<string, string | number>) {
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ""));
}

export function useStorefrontPreferences(): {
  locale: typeof locale;
  theme: typeof theme;
  blurLevel: typeof blurLevel;
  cycleBlur: typeof cycleBlur;
  messages: ComputedRef<Messages>;
  setLocale: (nextLocale: StorefrontLocale) => void;
  setTheme: (nextTheme: StorefrontTheme) => void;
  t: (value: string, params?: Record<string, string | number>) => string;
} {
  onMounted(initialize);

  const messages = computed(() => locales[locale.value]);

  function setLocale(nextLocale: StorefrontLocale) {
    locale.value = nextLocale;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(localeStorageKey, nextLocale);
    applyDocumentPreferences();
  }

  function setTheme(nextTheme: StorefrontTheme) {
    theme.value = nextTheme;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(themeStorageKey, nextTheme);
    applyDocumentPreferences();
  }

  function t(value: string, params: Record<string, string | number> = {}) {
    return replaceParams(value, params);
  }

  return { locale, theme, blurLevel, cycleBlur, messages, setLocale, setTheme, t };
}
