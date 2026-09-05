// @ts-expect-error Tests run with Bun, while this project intentionally omits Bun's global type package.
import { describe, expect, test } from "bun:test";
import { detectBrowserLocale, normalizeBlurLevel, blurLevels } from "../../lib/storefront-preferences.ts";

test("glass blur restores supported levels and rounds legacy values down on ties", () => {
  for (const level of blurLevels) expect(normalizeBlurLevel(String(level))).toBe(level);
  expect(normalizeBlurLevel(null)).toBe(5);
  expect(normalizeBlurLevel("invalid")).toBe(5);
  expect(normalizeBlurLevel("10")).toBe(5);
  expect(normalizeBlurLevel("43")).toBe(45);
  expect(normalizeBlurLevel("120")).toBe(100);
  expect(normalizeBlurLevel("-8")).toBe(0);
});

describe("browser locale detection", () => {
  test("uses the first supported browser preference", () => {
    expect(detectBrowserLocale(["fr-FR", "en-GB", "zh-CN"])).toBe("en-US");
    expect(detectBrowserLocale(["zh-HK", "en-US"])).toBe("zh-TW");
  });

  test("maps simplified and traditional Chinese variants", () => {
    expect(detectBrowserLocale(["zh-CN"])).toBe("zh-CN");
    expect(detectBrowserLocale(["zh-Hant"])).toBe("zh-TW");
    expect(detectBrowserLocale(["zh-MO"])).toBe("zh-TW");
  });

  test("falls back to simplified Chinese for unsupported languages", () => {
    expect(detectBrowserLocale(["fr-FR", "ja-JP"])).toBe("zh-CN");
    expect(detectBrowserLocale([])).toBe("zh-CN");
  });
});
