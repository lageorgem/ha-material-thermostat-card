import { MT_ICONS } from './icons.generated';

interface CustomIcon {
  path: string;
  viewBox?: string;
}
interface CustomIconSet {
  getIcon: (name: string) => Promise<CustomIcon>;
}

/**
 * Register the card's AC swing icons with Home Assistant's custom-icon
 * registry, so they can be used anywhere `ha-icon` is (config, icon pickers,
 * other cards) as `mt:<name>` — e.g. `mt:swing-vertical-full` or
 * `mt:swing-horizontal-fixed-left-outline`.
 */
export function registerMtIcons(): void {
  const w = window as unknown as { customIcons?: Record<string, CustomIconSet> };
  w.customIcons = w.customIcons || {};
  if (w.customIcons.mt) return; // already registered (e.g. card loaded twice)
  w.customIcons.mt = {
    getIcon: async (name: string): Promise<CustomIcon> => {
      const path = MT_ICONS[name];
      if (!path) throw new Error(`Unknown mt icon: mt:${name}`);
      return { path };
    },
  };
}
