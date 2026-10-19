import { expect } from '@open-wc/testing';
import {
  WATER_HEATER_OPERATION_ORDER,
  WATER_HEATER_MODE_ICONS,
  WATER_HEATER_AWAY_ICON,
  waterHeaterModeIcon,
  waterHeaterModeColor,
  sortOperationModes,
  swingHorizontalIcon,
  climateModeColor,
  presetColor,
  orderValues,
} from '../../src/theme';

describe('theme stock parity', () => {
  it('exports the canonical water heater order and icons', () => {
    expect(WATER_HEATER_OPERATION_ORDER).to.deep.equal([
      'electric', 'gas', 'heat_pump', 'eco', 'performance', 'high_demand', 'off',
    ]);
    const icons = {
      electric: 'mdi:lightning-bolt',
      gas: 'mdi:fire-circle',
      heat_pump: 'mdi:heat-pump',
      eco: 'mdi:leaf',
      performance: 'mdi:rocket-launch',
      high_demand: 'mdi:finance',
      off: 'mdi:power',
      on: 'mdi:power',
    };
    expect(WATER_HEATER_MODE_ICONS).to.deep.equal(icons);
    for (const [mode, icon] of Object.entries(icons)) {
      expect(waterHeaterModeIcon(mode)).to.equal(icon);
    }
    expect(WATER_HEATER_AWAY_ICON).to.equal('mdi:account-arrow-right');
  });

  it('uses the boiler icon for unknown modes, including inherited object keys', () => {
    for (const mode of ['custom', '', 'toString', '__proto__']) {
      expect(waterHeaterModeIcon(mode)).to.equal('mdi:water-boiler');
    }
  });

  it('reuses the off, eco and heat accent colours', () => {
    expect(waterHeaterModeColor('off')).to.equal(climateModeColor('off'));
    expect(waterHeaterModeColor('eco')).to.equal(presetColor('eco'));
    for (const mode of ['electric', 'gas', 'heat_pump', 'performance', 'high_demand', 'on', 'custom', '']) {
      expect(waterHeaterModeColor(mode)).to.equal(climateModeColor('heat'));
    }
  });

  it('sorts canonical modes first without mutating the readonly input', () => {
    const modes = Object.freeze(['off', 'custom', 'eco', 'gas']);
    expect(sortOperationModes(modes)).to.deep.equal(['gas', 'eco', 'off', 'custom']);
    expect(modes).to.deep.equal(['off', 'custom', 'eco', 'gas']);
    expect(sortOperationModes([...WATER_HEATER_OPERATION_ORDER].reverse())).to.deep.equal(
      WATER_HEATER_OPERATION_ORDER,
    );
  });

  it('keeps unknown modes and duplicate modes stable and always returns a new array', () => {
    const unknown = Object.freeze(['second', 'first', 'on', 'second']);
    expect(sortOperationModes(unknown)).to.deep.equal(unknown);
    expect(sortOperationModes(unknown)).not.to.equal(unknown);
    expect(sortOperationModes(['custom', 'off', 'custom-2', 'gas', 'gas'])).to.deep.equal([
      'gas', 'gas', 'off', 'custom', 'custom-2',
    ]);
    const empty: readonly string[] = Object.freeze([]);
    expect(sortOperationModes(empty)).to.deep.equal([]);
    expect(sortOperationModes(empty)).not.to.equal(empty);
    expect(sortOperationModes(['eco'])).to.deep.equal(['eco']);
  });

  const horizontalCases: Array<[string, string]> = [
    ['OFF', 'mdi:arrow-collapse-horizontal'],
    ['on', 'mdi:arrow-left-right'],
    ['both', 'mdi:arrow-left-right'],
    ['swing', 'mdi:arrow-left-right'],
    ['Auto Left', 'mdi:arrow-left-right'],
    ['Far LEFT', 'mdi:arrow-left'],
    ['Far RIGHT', 'mdi:arrow-right'],
    ['CENTER', 'mdi:format-horizontal-align-center'],
    ['Middle position', 'mdi:format-horizontal-align-center'],
    ['custom', 'mdi:arrow-left-right'],
    ['', 'mdi:arrow-left-right'],
    ['left right', 'mdi:arrow-left'],
    ['right center', 'mdi:arrow-right'],
  ];
  for (const [mode, icon] of horizontalCases) {
    it(`maps horizontal swing ${JSON.stringify(mode)}`, () => {
      expect(swingHorizontalIcon(mode)).to.equal(icon);
    });
  }

  describe('orderValues include allow-list', () => {
    it('keeps the existing no-order reference and explicit-order behaviour', () => {
      const all = ['a', 'b', 'c'];
      expect(orderValues(all)).to.equal(all);
      expect(orderValues(all, [])).to.equal(all);
      expect(orderValues(all, ['c', 'x'])).to.deep.equal(['c', 'a', 'b']);
      expect(orderValues(all, undefined, [])).to.equal(all);
      expect(orderValues(all, ['c'], [])).to.deep.equal(['c', 'a', 'b']);
    });

    it('intersects available values with include in include order, then applies order', () => {
      const all = ['a', 'b', 'c'];
      const include = Object.freeze(['c', 'a', 'x']);
      expect(orderValues(all, undefined, include)).to.deep.equal(['c', 'a']);
      expect(orderValues(all, [], include)).to.deep.equal(['c', 'a']);
      expect(orderValues(all, ['a'], include)).to.deep.equal(['a', 'c']);
      expect(orderValues(all, ['b', 'x', 'a'], include)).to.deep.equal(['a', 'c']);
      expect(all).to.deep.equal(['a', 'b', 'c']);
      expect(include).to.deep.equal(['c', 'a', 'x']);
    });

    it('returns no options when a non-empty include has no available values', () => {
      expect(orderValues(['a'], undefined, ['x'])).to.deep.equal([]);
      expect(orderValues([], ['x'], ['x'])).to.deep.equal([]);
    });
  });
});
