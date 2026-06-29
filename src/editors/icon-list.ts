import type { SearchItem } from './search-panel';

/**
 * A curated set of common MDI icon names for the icon picker to BROWSE. HA
 * bundles the full ~7000-icon list at build time with no runtime URL to fetch,
 * so we can't enumerate them all offline — instead we offer a sensible common
 * set here and let the search box commit ANY `mdi:<name>` as free text (the long
 * tail). Registered custom icon sets (e.g. this card's `mt:` icons, or installed
 * icon packs) are merged in dynamically via `window.customIcons`.
 */
const COMMON_ICONS: string[] = [
  // climate / comfort
  'thermostat',
  'thermostat-auto',
  'thermometer',
  'snowflake',
  'snowflake-variant',
  'sun-snowflake-variant',
  'fire',
  'water-percent',
  'air-conditioner',
  'air-filter',
  'air-humidifier',
  'air-purifier',
  'heat-pump',
  'radiator',
  'radiator-disabled',
  'fan',
  'fan-auto',
  'fan-off',
  'fan-speed-1',
  'fan-speed-2',
  'fan-speed-3',
  'fan-chevron-up',
  'fan-chevron-down',
  'leaf',
  'sofa',
  'sofa-outline',
  'bed',
  'sleep',
  'power-sleep',
  'home',
  'home-outline',
  'home-thermometer',
  'home-automation',
  'home-export-outline',
  'run-fast',
  'rocket-launch',
  'cancel',
  'snowman',
  'sun-thermometer',
  'snowflake-thermometer',
  'coolant-temperature',
  // weather
  'weather-sunny',
  'weather-night',
  'weather-cloudy',
  'weather-partly-cloudy',
  'weather-rainy',
  'weather-pouring',
  'weather-snowy',
  'weather-windy',
  'weather-fog',
  'weather-lightning',
  'weather-hail',
  'weather-sunset',
  'white-balance-sunny',
  'umbrella',
  // power / energy
  'power',
  'flash',
  'lightning-bolt',
  'battery',
  'solar-power',
  'transmission-tower',
  'ev-station',
  'gauge',
  'speedometer',
  'meter-electric',
  // lighting
  'lightbulb',
  'lightbulb-group',
  'ceiling-light',
  'floor-lamp',
  'lamp',
  'led-strip',
  'brightness-5',
  'brightness-6',
  'palette',
  // covers / openings
  'door',
  'door-open',
  'garage',
  'garage-variant',
  'gate',
  'window-closed',
  'window-open',
  'blinds',
  'curtains',
  'fence',
  // media
  'television',
  'speaker',
  'music',
  'volume-high',
  'play',
  'pause',
  'stop',
  // sensors / safety
  'motion-sensor',
  'smoke-detector',
  'fire-alert',
  'water',
  'water-alert',
  'valve',
  'pump',
  'eye',
  'eye-off',
  'lock',
  'lock-open',
  'bell',
  'alarm',
  // appliances
  'fridge',
  'stove',
  'microwave',
  'dishwasher',
  'washing-machine',
  'tumble-dryer',
  'robot-vacuum',
  'vacuum',
  'shower',
  'bathtub',
  'toilet',
  'water-boiler',
  'grill',
  'pool',
  // outdoors / misc
  'tree',
  'flower',
  'sprout',
  'watering-can',
  'sprinkler',
  'car',
  // controls / nav
  'tune',
  'tune-variant',
  'cog',
  'sync',
  'refresh',
  'restart',
  'arrow-up',
  'arrow-down',
  'arrow-left',
  'arrow-right',
  'arrow-all',
  'arrow-up-down',
  'arrow-left-right',
  'swap-vertical',
  'account',
  'account-group',
  'calendar',
  'clock',
  'star',
  'heart',
  'flag',
  'map-marker',
  'tag',
];

/** A registered custom icon set (e.g. this card's `mt:`). */
interface CustomIconSet {
  getIconList?: () => Promise<{ name: string; keywords?: string[] }[]>;
}

let _cache: SearchItem[] | undefined;

/**
 * The browsable icon list: the curated MDI common set plus every icon exposed by
 * a registered custom icon set (`window.customIcons[prefix].getIconList()`).
 * Memoized. Anything not listed is still reachable by typing its full name in
 * the search box (free text).
 */
export async function loadIconItems(): Promise<SearchItem[]> {
  if (_cache) return _cache;
  const items: SearchItem[] = COMMON_ICONS.map((name) => ({
    value: `mdi:${name}`,
    primary: `mdi:${name}`,
    icon: `mdi:${name}`,
    keywords: name.split('-'),
  }));

  const customIcons = (window as unknown as { customIcons?: Record<string, CustomIconSet> })
    .customIcons;
  if (customIcons) {
    for (const prefix of Object.keys(customIcons)) {
      const getList = customIcons[prefix]?.getIconList;
      if (typeof getList !== 'function') continue;
      try {
        const list = await getList();
        for (const ic of list) {
          items.push({
            value: `${prefix}:${ic.name}`,
            primary: `${prefix}:${ic.name}`,
            icon: `${prefix}:${ic.name}`,
            keywords: ic.keywords,
          });
        }
      } catch {
        // A misbehaving icon pack shouldn't break the picker.
      }
    }
  }
  _cache = items;
  return _cache;
}

/**
 * Clear the memoized list. Test-only seam.
 * @internal
 */
export function resetIconItemsForTest(): void {
  _cache = undefined;
}
