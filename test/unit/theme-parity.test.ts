import { expect } from '@open-wc/testing';
import {
  WATER_HEATER_OPERATION_ORDER,
  WATER_HEATER_MODE_ICONS,
  WATER_HEATER_AWAY_ICON,
  waterHeaterModeIcon,
  waterHeaterModeColor,
  sortOperationModes,
  swingHorizontalIcon,
  swingIcon,
  climateModeColor,
  fanIcon,
  presetIcon,
  prettyLabel,
  isOffValue,
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

  const verticalGroups: Array<[string[], string]> = [
    [['off', 'stop', 'fixed', ' OFF '], 'mdi:arrow-expand-vertical'],
    [['both'], 'mdi:arrow-all'],
    [['horizontal', 'swing-horizontal', 'vertical horizontal'], 'mt:swing-horizontal-full'],
    [['on', 'swing', 'vertical', 'full', 'auto', 'all', 'Full Swing', 'auto top'], 'mt:swing-vertical-full'],
    [['top', 'highest', 'up', 'Fixed Top', 'position top'], 'mt:swing-vertical-fixed-top'],
    [['upper', 'high', 'upper middle', 'top middle', 'middle top', 'Fixed Top-Middle', ' fixed__TOP--middle '], 'mt:swing-vertical-fixed-upper-middle'],
    [['middle', 'mid', 'center', 'centre', 'Fixed Middle'], 'mt:swing-vertical-fixed-middle'],
    [['lower', 'low', 'lower middle', 'bottom middle', 'middle bottom', 'Fixed Bottom-Middle'], 'mt:swing-vertical-fixed-lower-middle'],
    [['bottom', 'lowest', 'down', 'Fixed Bottom'], 'mt:swing-vertical-fixed-bottom'],
    [['custom', '', 'diagonal', 'swing custom', 'range custom', 'topmost', 'autonomous', 'nonhorizontal', 'swing-vertical'], 'mdi:swap-vertical'],
    [['full swing top', 'range top middle', ' swing\t TOP\n'], 'mt:swing-vertical-top'],
  ];
  for (const [positions, suffix] of [
    [['top', 'upper', 'high', 'up'], 'top'],
    [['middle', 'mid', 'center', 'centre'], 'middle'],
    [['bottom', 'lower', 'low', 'down'], 'bottom'],
  ] as const) {
    verticalGroups.push([positions.flatMap(p => [`Swing ${p}`, `range_${p}`]), `mt:swing-vertical-${suffix}`]);
  }
  const horizontalGroups: Array<[string[], string]> = [
    [['off', ' OFF '], 'mdi:arrow-collapse-horizontal'],
    [['on', 'swing', 'both', 'full', 'auto', 'wide', 'all', 'Auto Left', 'full right'], 'mt:swing-horizontal-full'],
    [['left', 'leftmost', 'Far LEFT', 'fixed left'], 'mt:swing-horizontal-fixed-left'],
    [['left middle', 'left center', 'center left', 'middle left', 'fixed__LEFT--middle'], 'mt:swing-horizontal-fixed-left-middle'],
    [['right', 'rightmost', 'Far RIGHT'], 'mt:swing-horizontal-fixed-right'],
    [['right middle', 'right center', 'center right', 'middle right'], 'mt:swing-horizontal-fixed-right-middle'],
    [['middle', 'mid', 'center', 'centre', 'Middle position'], 'mt:swing-horizontal-fixed-middle'],
    [['custom', '', 'stop', 'fixed', 'swing custom', 'range custom', 'autonomous', 'leftover'], 'mdi:arrow-left-right'],
    [['full swing left', 'range left middle'], 'mt:swing-horizontal-left'],
  ];
  for (const [positions, suffix] of [
    [['left'], 'left'], [['right'], 'right'], [['middle', 'center', 'centre', 'mid'], 'middle'],
  ] as const) {
    horizontalGroups.push([positions.flatMap(p => [`Swing ${p}`, `range_${p}`]), `mt:swing-horizontal-${suffix}`]);
  }
  for (const [axis, iconFor, groups] of [
    ['vertical', swingIcon, verticalGroups], ['horizontal', swingHorizontalIcon, horizontalGroups],
  ] as const) {
    for (const [values, icon] of groups) {
      for (const value of values) {
        it(`maps ${axis} swing ${JSON.stringify(value)}`, () => {
          expect(iconFor(value)).to.equal(icon);
        });
      }
    }
  }

  it('maps the real-world AC lists and HA standard swing modes in order', () => {
    expect(['Fixed Top', 'Fixed Top-Middle', 'Fixed Middle', 'Fixed Bottom-Middle', 'Fixed Bottom', 'Swing Bottom', 'Swing Middle', 'Swing Top', 'Full Swing'].map(swingIcon)).to.deep.equal([
      'mt:swing-vertical-fixed-top', 'mt:swing-vertical-fixed-upper-middle', 'mt:swing-vertical-fixed-middle', 'mt:swing-vertical-fixed-lower-middle', 'mt:swing-vertical-fixed-bottom', 'mt:swing-vertical-bottom', 'mt:swing-vertical-middle', 'mt:swing-vertical-top', 'mt:swing-vertical-full',
    ]);
    expect(['Top', 'Upper', 'Middle', 'Lower', 'Bottom', 'Auto'].map(swingIcon)).to.deep.equal([
      'mt:swing-vertical-fixed-top', 'mt:swing-vertical-fixed-upper-middle', 'mt:swing-vertical-fixed-middle', 'mt:swing-vertical-fixed-lower-middle', 'mt:swing-vertical-fixed-bottom', 'mt:swing-vertical-full',
    ]);
    expect(['off', 'on', 'both', 'vertical', 'horizontal'].map(swingIcon)).to.deep.equal([
      'mdi:arrow-expand-vertical', 'mt:swing-vertical-full', 'mdi:arrow-all', 'mt:swing-vertical-full', 'mt:swing-horizontal-full',
    ]);
    expect(['off', 'left', 'center', 'right', 'swing'].map(swingHorizontalIcon)).to.deep.equal([
      'mdi:arrow-collapse-horizontal', 'mt:swing-horizontal-fixed-left', 'mt:swing-horizontal-fixed-middle', 'mt:swing-horizontal-fixed-right', 'mt:swing-horizontal-full',
    ]);
    expect(['left', 'right', 'wide'].map(swingHorizontalIcon)).to.deep.equal([
      'mt:swing-horizontal-fixed-left', 'mt:swing-horizontal-fixed-right', 'mt:swing-horizontal-full',
    ]);
  });

  it('retains the other theme helper mappings', () => {
    for (const [value, suffix] of [['auto', 'auto'], ['off', 'off'], ['0', 'off'], ['low', 'speed-1'], ['medium', 'speed-2'], ['high', 'speed-3'], ['custom', '']] as const) {
      expect(fanIcon(value)).to.equal(`mdi:fan${suffix ? `-${suffix}` : ''}`);
    }
    for (const [value, icon] of [['none', 'cancel'], ['off', 'cancel'], ['eco', 'leaf'], ['away', 'home-export-outline'], ['home', 'home'], ['sleep', 'power-sleep'], ['night', 'power-sleep'], ['boost', 'rocket-launch'], ['turbo', 'rocket-launch'], ['comfort', 'sofa'], ['activity', 'run-fast'], ['custom', 'tune-variant']]) {
      expect(presetIcon(value)).to.equal(`mdi:${icon}`);
    }
    expect(presetColor('sleep')).to.equal('#2196f3');
    expect(presetColor('custom')).to.equal(undefined);
    for (const [mode, color] of [['cool', '#2b9af9'], ['heat', '#ff8100'], ['heat_cool', '#009688'], ['auto', '#e5c454'], ['dry', '#efbd07'], ['fan_only', '#8a8a8a']]) {
      expect(climateModeColor(mode)).to.equal(`var(--state-climate-${mode}-color, ${color})`);
    }
    for (const value of ['', 'off', 'none', 'false', 'null', '0', 'unavailable', 'unknown']) expect(isOffValue(value)).to.be.true;
    expect(isOffValue('on')).to.be.false;
    expect(prettyLabel('heat_cool')).to.equal('Heat/Cool');
    expect(prettyLabel('fan_only')).to.equal('Fan Only');
  });

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
