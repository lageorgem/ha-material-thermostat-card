import { MT_ICONS } from './icons.generated';

interface CustomIcon {
  path: string;
  secondaryPath?: string;
  viewBox?: string;
}
interface CustomIconListItem {
  name: string;
  keywords?: string[];
}
interface CustomIconSet {
  getIcon: (name: string) => Promise<CustomIcon>;
  getIconList?: () => Promise<CustomIconListItem[]>;
}

/**
 * Register the card's AC swing icons with Home Assistant's custom-icon
 * registry, so they can be used anywhere `ha-icon` is (config, icon pickers,
 * other cards) as `mt:<name>` — e.g. `mt:swing-vertical-full`.
 */
export function registerMtIcons(): void {
  const w = window as unknown as { customIcons?: Record<string, CustomIconSet> };
  w.customIcons = w.customIcons || {};
  if (w.customIcons.mt) return; // already registered (e.g. card loaded twice)
  w.customIcons.mt = {
    getIcon: async (name: string): Promise<CustomIcon> => {
      const icon = MT_ICONS[name];
      if (!icon) throw new Error(`Unknown mt icon: mt:${name}`);
      // Secondary path renders at 50% opacity → the gray "unselected" blades.
      return icon.secondary
        ? { path: icon.path, secondaryPath: icon.secondary }
        : { path: icon.path };
    },
    // Lets the icon picker list/search these (keyword "swing", "ac", "vane", …).
    getIconList: async (): Promise<CustomIconListItem[]> =>
      Object.keys(MT_ICONS).map((name) => ({
        name,
        keywords: ['ac', 'swing', 'vane', 'louver', 'climate', 'airflow', ...name.split('-')],
      })),
  };
}
