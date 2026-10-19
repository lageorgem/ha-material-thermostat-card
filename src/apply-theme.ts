import type { Theme as LegacyTheme } from 'custom-card-helpers';

type ThemeVars = Record<string, string | number>;
type ThemeModes = { light?: ThemeVars; dark?: ThemeVars };
type Theme = { modes?: ThemeModes; [key: string]: string | number | ThemeModes | undefined };

/** Theme fields consumed by the card; older HA versions may omit darkMode. */
export interface HassThemes {
  themes: Record<string, Theme | LegacyTheme>;
  darkMode?: boolean;
}

const appliedKeys = new WeakMap<HTMLElement, Set<string>>();

/** Apply a local HA theme, clearing only variables previously applied here.
 * @param element card host receiving the CSS custom properties
 * @param themes current Home Assistant themes and active colour mode
 * @param themeName configured local theme, or undefined to inherit
 */
export function applyCardTheme(element: HTMLElement, themes: HassThemes | undefined, themeName: string | undefined): void {
  const theme = themeName ? themes?.themes[themeName] : undefined;
  const variables: ThemeVars = {};
  if (theme) {
    const { modes, ...base } = theme as Theme;
    for (const [key, value] of Object.entries({ ...base, ...modes?.[themes?.darkMode ? 'dark' : 'light'] })) {
      if (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))) variables[key] = value;
    }
  }
  const properties = new Map<string, string>();
  for (const [key, value] of Object.entries(variables)) {
    const hex = typeof value === 'string' && /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value);
    if (hex && !key.startsWith('rgb-')) {
      const digits = hex[1].length === 3 ? hex[1].split('').map((digit) => digit + digit).join('') : hex[1];
      properties.set(`--rgb-${key}`, [0, 2, 4].map((offset) => parseInt(digits.slice(offset, offset + 2), 16)).join(', '));
    }
  }
  for (const [key, value] of Object.entries(variables)) properties.set(`--${key}`, String(value));
  for (const key of appliedKeys.get(element) ?? []) {
    if (!properties.has(key)) element.style.removeProperty(key);
  }
  for (const [key, value] of properties) element.style.setProperty(key, value);
  appliedKeys.set(element, new Set(properties.keys()));
}
