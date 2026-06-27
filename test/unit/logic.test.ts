import { fixture, html, expect } from '@open-wc/testing';
import {
  climateModeColor,
  HVAC_MODE_ICONS,
  fanIcon,
  swingIcon,
  prettyLabel,
  orderValues,
} from '../../src/theme';
import {
  WIDTH_STEP,
  MIN_WIDTH_PCT,
  MAX_WIDTH_PCT,
  GRID_COLUMNS,
  TILE_DEFAULT_PCT,
  DIAL_MAX_PX,
  DIAL_MIN_PX,
  WIDE_MIN_PX,
  CARD_PADDING_X,
  pctToSpan,
} from '../../src/grid';
import {
  CARD_VERSION,
  CARD_TYPE,
  EDITOR_TYPE,
  CARD_NAME,
  CARD_DESCRIPTION,
} from '../../src/const';
import { MT_ICONS } from '../../src/icons.generated';
import { registerMtIcons } from '../../src/register-icons';
import { pressOrToggle, performTap } from '../../src/actions';
import { makeHass, captureEvents } from '../helpers';

describe('theme', () => {
  describe('climateModeColor', () => {
    it('cool', () => {
      expect(climateModeColor('cool')).to.equal('var(--state-climate-cool-color, #2b9af9)');
    });
    it('heat', () => {
      expect(climateModeColor('heat')).to.equal('var(--state-climate-heat-color, #ff8100)');
    });
    it('heat_cool', () => {
      expect(climateModeColor('heat_cool')).to.equal(
        'var(--state-climate-heat_cool-color, #009688)'
      );
    });
    it('auto', () => {
      expect(climateModeColor('auto')).to.equal('var(--state-climate-auto-color, #e5c454)');
    });
    it('dry', () => {
      expect(climateModeColor('dry')).to.equal('var(--state-climate-dry-color, #efbd07)');
    });
    it('fan_only', () => {
      expect(climateModeColor('fan_only')).to.equal(
        'var(--state-climate-fan_only-color, #8a8a8a)'
      );
    });
    it('off → default branch', () => {
      expect(climateModeColor('off')).to.equal(
        'var(--state-climate-off-color, var(--mt-on-surface-variant))'
      );
    });
    it('undefined → default branch', () => {
      expect(climateModeColor(undefined)).to.equal(
        'var(--state-climate-off-color, var(--mt-on-surface-variant))'
      );
    });
    it('unknown value → default branch', () => {
      expect(climateModeColor('whatever')).to.equal(
        'var(--state-climate-off-color, var(--mt-on-surface-variant))'
      );
    });
  });

  describe('HVAC_MODE_ICONS', () => {
    it('has the expected keys/values', () => {
      expect(HVAC_MODE_ICONS).to.deep.equal({
        off: 'mdi:power',
        heat: 'mdi:fire',
        cool: 'mdi:snowflake',
        heat_cool: 'mdi:sun-snowflake-variant',
        auto: 'mdi:thermostat-auto',
        dry: 'mdi:water-percent',
        fan_only: 'mdi:fan',
      });
    });
  });

  describe('fanIcon', () => {
    it('auto', () => {
      expect(fanIcon('auto')).to.equal('mdi:fan-auto');
      expect(fanIcon('Auto')).to.equal('mdi:fan-auto');
    });
    it('off', () => {
      expect(fanIcon('off')).to.equal('mdi:fan-off');
    });
    it("'0' → off", () => {
      expect(fanIcon('0')).to.equal('mdi:fan-off');
    });
    it("'1'/low/min/quiet/silent → speed-1", () => {
      expect(fanIcon('1')).to.equal('mdi:fan-speed-1');
      expect(fanIcon('low')).to.equal('mdi:fan-speed-1');
      expect(fanIcon('min')).to.equal('mdi:fan-speed-1');
      expect(fanIcon('quiet')).to.equal('mdi:fan-speed-1');
      expect(fanIcon('silent')).to.equal('mdi:fan-speed-1');
    });
    it("'2'/mid/med → speed-2", () => {
      expect(fanIcon('2')).to.equal('mdi:fan-speed-2');
      expect(fanIcon('mid')).to.equal('mdi:fan-speed-2');
      expect(fanIcon('medium')).to.equal('mdi:fan-speed-2');
    });
    it("'3'/high/max/strong/turbo → speed-3", () => {
      expect(fanIcon('3')).to.equal('mdi:fan-speed-3');
      expect(fanIcon('high')).to.equal('mdi:fan-speed-3');
      expect(fanIcon('max')).to.equal('mdi:fan-speed-3');
      expect(fanIcon('strong')).to.equal('mdi:fan-speed-3');
      expect(fanIcon('turbo')).to.equal('mdi:fan-speed-3');
    });
    it('arbitrary → mdi:fan', () => {
      expect(fanIcon('whatever')).to.equal('mdi:fan');
      expect(fanIcon('')).to.equal('mdi:fan');
    });
  });

  describe('swingIcon', () => {
    it('off/stop/fixed → arrow-expand-vertical', () => {
      expect(swingIcon('off')).to.equal('mdi:arrow-expand-vertical');
      expect(swingIcon('stop')).to.equal('mdi:arrow-expand-vertical');
      expect(swingIcon('fixed')).to.equal('mdi:arrow-expand-vertical');
      expect(swingIcon('OFF')).to.equal('mdi:arrow-expand-vertical');
    });
    it('both/on/full → arrow-all', () => {
      expect(swingIcon('both')).to.equal('mdi:arrow-all');
      expect(swingIcon('on')).to.equal('mdi:arrow-all');
      expect(swingIcon('full')).to.equal('mdi:arrow-all');
    });
    it('*horizontal* → arrow-left-right', () => {
      expect(swingIcon('horizontal')).to.equal('mdi:arrow-left-right');
      expect(swingIcon('swing-horizontal')).to.equal('mdi:arrow-left-right');
    });
    it('*vertical* → arrow-up-down', () => {
      expect(swingIcon('vertical')).to.equal('mdi:arrow-up-down');
      expect(swingIcon('swing-vertical')).to.equal('mdi:arrow-up-down');
    });
    it('default → swap-vertical', () => {
      expect(swingIcon('diagonal')).to.equal('mdi:swap-vertical');
      expect(swingIcon('')).to.equal('mdi:swap-vertical');
    });
  });

  describe('prettyLabel', () => {
    it('heat_cool → Heat/Cool', () => {
      expect(prettyLabel('heat_cool')).to.equal('Heat/Cool');
    });
    it('fan_only → Fan Only', () => {
      expect(prettyLabel('fan_only')).to.equal('Fan Only');
    });
    it('single word capitalization', () => {
      expect(prettyLabel('cool')).to.equal('Cool');
      expect(prettyLabel('auto')).to.equal('Auto');
    });
  });

  describe('orderValues', () => {
    it('returns the list unchanged when no order is given', () => {
      const all = ['a', 'b', 'c'];
      expect(orderValues(all)).to.deep.equal(['a', 'b', 'c']);
      // same array reference (early return)
      expect(orderValues(all)).to.equal(all);
    });

    it('returns the list unchanged for an empty order', () => {
      const all = ['a', 'b', 'c'];
      expect(orderValues(all, [])).to.deep.equal(['a', 'b', 'c']);
      expect(orderValues(all, [])).to.equal(all);
    });

    it('moves listed values to the front (in order), rest in natural order', () => {
      expect(orderValues(['a', 'b', 'c', 'd'], ['c', 'a'])).to.deep.equal(['c', 'a', 'b', 'd']);
    });

    it('ignores order values not present in the list', () => {
      expect(orderValues(['a', 'b'], ['x', 'b'])).to.deep.equal(['b', 'a']);
    });
  });
});

describe('grid', () => {
  it('constants have exact values', () => {
    expect(WIDTH_STEP).to.equal(10);
    expect(MIN_WIDTH_PCT).to.equal(10);
    expect(MAX_WIDTH_PCT).to.equal(100);
    expect(GRID_COLUMNS).to.equal(10);
    expect(TILE_DEFAULT_PCT).to.equal(50);
    expect(DIAL_MAX_PX).to.equal(320);
    expect(DIAL_MIN_PX).to.equal(240);
    expect(WIDE_MIN_PX).to.equal(560);
    expect(CARD_PADDING_X).to.equal(32);
  });
  it('pctToSpan maps percentage to a 10-column span', () => {
    expect(pctToSpan(100)).to.equal(10);
    expect(pctToSpan(50)).to.equal(5);
    expect(pctToSpan(30)).to.equal(3);
    expect(pctToSpan(5)).to.equal(1); // clamped to min 1
    expect(pctToSpan(999)).to.equal(10); // clamped to max 10
    expect(pctToSpan(44)).to.equal(4); // rounds down
    expect(pctToSpan(45)).to.equal(5); // rounds to nearest
  });
});

describe('const', () => {
  it('CARD_VERSION is a non-empty string', () => {
    expect(CARD_VERSION).to.be.a('string');
    expect(CARD_VERSION.length).to.be.greaterThan(0);
  });
  it('identifiers are strings', () => {
    expect(CARD_TYPE).to.be.a('string');
    expect(EDITOR_TYPE).to.be.a('string');
    expect(CARD_NAME).to.be.a('string');
    expect(CARD_DESCRIPTION).to.be.a('string');
  });
});

describe('icons.generated', () => {
  it('MT_ICONS is a non-empty object', () => {
    expect(MT_ICONS).to.be.an('object');
    expect(Object.keys(MT_ICONS).length).to.be.greaterThan(0);
  });
  it("contains 'swing-vertical-full' with a path string", () => {
    expect(MT_ICONS['swing-vertical-full']).to.be.an('object');
    expect(MT_ICONS['swing-vertical-full'].path).to.be.a('string');
    expect(MT_ICONS['swing-vertical-full'].path.length).to.be.greaterThan(0);
  });
});

describe('register-icons', () => {
  it('registerMtIcons() fresh-register branch creates customIcons.mt', () => {
    const w = window as any;
    if (w.customIcons) delete w.customIcons.mt;
    expect(w.customIcons && w.customIcons.mt).to.be.an('undefined');
    registerMtIcons();
    expect(w.customIcons).to.be.an('object');
    expect(w.customIcons.mt).to.be.an('object');
    expect(w.customIcons.mt.getIcon).to.be.a('function');
    expect(w.customIcons.mt.getIconList).to.be.a('function');
  });

  it('handles the case where customIcons is empty object', () => {
    const w = window as any;
    w.customIcons = {};
    registerMtIcons();
    expect(w.customIcons.mt).to.be.an('object');
  });

  it('getIcon returns {path, secondaryPath} for an icon with secondary', async () => {
    const w = window as any;
    delete w.customIcons.mt;
    registerMtIcons();
    // swing-vertical-top has a `secondary`.
    const icon = await w.customIcons.mt.getIcon('swing-vertical-top');
    expect(icon.path).to.equal(MT_ICONS['swing-vertical-top'].path);
    expect(icon.secondaryPath).to.equal(MT_ICONS['swing-vertical-top'].secondary);
  });

  it('getIcon returns {path} only for an icon without secondary', async () => {
    const w = window as any;
    const icon = await w.customIcons.mt.getIcon('swing-vertical-full');
    expect(icon.path).to.equal(MT_ICONS['swing-vertical-full'].path);
    expect(icon).to.not.have.property('secondaryPath');
  });

  it('getIcon rejects for an unknown icon', async () => {
    const w = window as any;
    let threw = false;
    try {
      await w.customIcons.mt.getIcon('nope');
    } catch (e) {
      threw = true;
      expect((e as Error).message).to.contain('Unknown mt icon');
    }
    expect(threw).to.be.true;
  });

  it('getIconList returns array of {name, keywords} with swing + name parts', async () => {
    const w = window as any;
    const list = await w.customIcons.mt.getIconList();
    expect(list).to.be.an('array');
    expect(list.length).to.equal(Object.keys(MT_ICONS).length);
    const item = list.find((i: any) => i.name === 'swing-vertical-full');
    expect(item).to.be.an('object');
    expect(item.keywords).to.include('swing');
    // name parts from 'swing-vertical-full'.split('-')
    expect(item.keywords).to.include('vertical');
    expect(item.keywords).to.include('full');
    expect(item.keywords).to.include('climate');
  });

  it('is idempotent: calling twice keeps the set and does not throw', () => {
    const w = window as any;
    delete w.customIcons.mt;
    registerMtIcons();
    const first = w.customIcons.mt;
    // already-registered branch: early return, keeps same set.
    registerMtIcons();
    expect(w.customIcons.mt).to.equal(first);
  });
});

describe('actions', () => {
  let node: HTMLElement;

  beforeEach(async () => {
    node = await fixture(html`<div></div>`);
  });

  describe('pressOrToggle', () => {
    it('button → button.press', () => {
      const hass = makeHass();
      pressOrToggle(node, hass, 'button.x');
      expect(hass.__calls).to.deep.equal([
        { domain: 'button', service: 'press', data: { entity_id: 'button.x' }, target: undefined },
      ]);
    });
    it('input_button → input_button.press', () => {
      const hass = makeHass();
      pressOrToggle(node, hass, 'input_button.x');
      expect(hass.__calls[0]).to.include({ domain: 'input_button', service: 'press' });
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'input_button.x' });
    });
    it('scene → scene.turn_on', () => {
      const hass = makeHass();
      pressOrToggle(node, hass, 'scene.x');
      expect(hass.__calls[0]).to.include({ domain: 'scene', service: 'turn_on' });
    });
    it('script → script.turn_on', () => {
      const hass = makeHass();
      pressOrToggle(node, hass, 'script.x');
      expect(hass.__calls[0]).to.include({ domain: 'script', service: 'turn_on' });
    });
    it('switch → homeassistant.toggle', () => {
      const hass = makeHass();
      pressOrToggle(node, hass, 'switch.x');
      expect(hass.__calls[0]).to.include({ domain: 'homeassistant', service: 'toggle' });
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'switch.x' });
    });
    it('light → homeassistant.toggle', () => {
      const hass = makeHass();
      pressOrToggle(node, hass, 'light.x');
      expect(hass.__calls[0]).to.include({ domain: 'homeassistant', service: 'toggle' });
    });
    it('fan → homeassistant.toggle', () => {
      const hass = makeHass();
      pressOrToggle(node, hass, 'fan.x');
      expect(hass.__calls[0]).to.include({ domain: 'homeassistant', service: 'toggle' });
    });
    it('input_boolean → homeassistant.toggle', () => {
      const hass = makeHass();
      pressOrToggle(node, hass, 'input_boolean.x');
      expect(hass.__calls[0]).to.include({ domain: 'homeassistant', service: 'toggle' });
    });
    it('unknown domain → hass-more-info bubbling composed event', async () => {
      const hass = makeHass();
      const cap = captureEvents('hass-more-info');
      pressOrToggle(node, hass, 'sensor.x');
      cap.stop();
      expect(hass.__calls).to.have.length(0);
      expect(cap.events).to.have.length(1);
      expect((cap.events[0].detail as any).entityId).to.equal('sensor.x');
    });
  });

  describe('performTap', () => {
    it('undefined action → default → pressOrToggle', () => {
      const hass = makeHass();
      performTap(node, hass, 'switch.x');
      expect(hass.__calls[0]).to.include({ domain: 'homeassistant', service: 'toggle' });
    });

    it('explicit default action string → pressOrToggle', () => {
      const hass = makeHass();
      performTap(node, hass, 'button.x', { action: 'default' } as any);
      expect(hass.__calls[0]).to.include({ domain: 'button', service: 'press' });
    });

    it("{action:'none'} → no call", () => {
      const hass = makeHass();
      const cap = captureEvents('hass-more-info');
      performTap(node, hass, 'switch.x', { action: 'none' } as any);
      cap.stop();
      expect(hass.__calls).to.have.length(0);
      expect(cap.events).to.have.length(0);
    });

    it("{action:'more-info'} → hass-more-info with entity", async () => {
      const hass = makeHass();
      const cap = captureEvents('hass-more-info');
      performTap(node, hass, 'switch.x', { action: 'more-info' } as any);
      cap.stop();
      expect(cap.events).to.have.length(1);
      expect((cap.events[0].detail as any).entityId).to.equal('switch.x');
    });

    it("{action:'more-info'} with cfg.entity override", async () => {
      const hass = makeHass();
      const cap = captureEvents('hass-more-info');
      performTap(node, hass, 'switch.x', {
        action: 'more-info',
        entity: 'light.override',
      } as any);
      cap.stop();
      expect(cap.events).to.have.length(1);
      expect((cap.events[0].detail as any).entityId).to.equal('light.override');
    });

    it("{action:'toggle'} → homeassistant.toggle", () => {
      const hass = makeHass();
      performTap(node, hass, 'climate.x', { action: 'toggle' } as any);
      expect(hass.__calls[0]).to.include({ domain: 'homeassistant', service: 'toggle' });
      expect(hass.__calls[0].data).to.deep.equal({ entity_id: 'climate.x' });
    });

    it("{action:'url', url_path} → window.open", () => {
      const hass = makeHass();
      const original = window.open;
      const opened: string[] = [];
      (window as any).open = (u: string): void => {
        opened.push(u);
      };
      try {
        performTap(node, hass, 'switch.x', {
          action: 'url',
          url_path: 'https://example.com',
        } as any);
      } finally {
        window.open = original;
      }
      expect(opened).to.deep.equal(['https://example.com']);
    });

    it("{action:'url'} without url_path → no window.open", () => {
      const hass = makeHass();
      const original = window.open;
      let called = false;
      (window as any).open = (): void => {
        called = true;
      };
      try {
        performTap(node, hass, 'switch.x', { action: 'url' } as any);
      } finally {
        window.open = original;
      }
      expect(called).to.be.false;
    });

    it("{action:'navigate', navigation_path} → pushState + location-changed", async () => {
      const hass = makeHass();
      const originalPush = window.history.pushState;
      const pushArgs: any[] = [];
      window.history.pushState = function (...args: any[]): void {
        pushArgs.push(args);
        return originalPush.apply(window.history, args as any);
      } as any;
      const cap = captureEvents('location-changed');
      try {
        performTap(node, hass, 'switch.x', {
          action: 'navigate',
          navigation_path: '/lovelace/0',
        } as any);
      } finally {
        window.history.pushState = originalPush;
        cap.stop();
      }
      expect(pushArgs).to.have.length(1);
      expect(pushArgs[0][2]).to.equal('/lovelace/0');
      expect(cap.events).to.have.length(1);
      expect((cap.events[0].detail as any).replace).to.equal(false);
    });

    it("{action:'navigate'} without navigation_path → no pushState/event", () => {
      const hass = makeHass();
      const originalPush = window.history.pushState;
      let pushed = false;
      window.history.pushState = function (...args: any[]): void {
        pushed = true;
        return originalPush.apply(window.history, args as any);
      } as any;
      const cap = captureEvents('location-changed');
      try {
        performTap(node, hass, 'switch.x', { action: 'navigate' } as any);
      } finally {
        window.history.pushState = originalPush;
        cap.stop();
      }
      expect(pushed).to.be.false;
      expect(cap.events).to.have.length(0);
    });

    it("{action:'call-service', service, data} → callService parsed", () => {
      const hass = makeHass();
      performTap(node, hass, 'switch.x', {
        action: 'call-service',
        service: 'light.turn_on',
        data: { brightness: 50 },
      } as any);
      expect(hass.__calls).to.have.length(1);
      expect(hass.__calls[0]).to.include({ domain: 'light', service: 'turn_on' });
      expect(hass.__calls[0].data).to.deep.equal({ brightness: 50 });
    });

    it("{action:'call-service'} uses service_data fallback when data absent", () => {
      const hass = makeHass();
      performTap(node, hass, 'switch.x', {
        action: 'call-service',
        service: 'light.turn_on',
        service_data: { color_temp: 300 },
      } as any);
      expect(hass.__calls[0].data).to.deep.equal({ color_temp: 300 });
    });

    it("{action:'perform-action', perform_action, target} → callService parsed", () => {
      const hass = makeHass();
      performTap(node, hass, 'switch.x', {
        action: 'perform-action',
        perform_action: 'scene.turn_on',
        target: { entity_id: 'scene.movie' },
      } as any);
      expect(hass.__calls).to.have.length(1);
      expect(hass.__calls[0]).to.include({ domain: 'scene', service: 'turn_on' });
      expect(hass.__calls[0].target).to.deep.equal({ entity_id: 'scene.movie' });
      // No data provided → defaults to {}.
      expect(hass.__calls[0].data).to.deep.equal({});
    });

    it('call-service with no service → no call', () => {
      const hass = makeHass();
      performTap(node, hass, 'switch.x', { action: 'call-service' } as any);
      expect(hass.__calls).to.have.length(0);
    });

    it('call-service with service lacking a dot → no call', () => {
      const hass = makeHass();
      performTap(node, hass, 'switch.x', {
        action: 'call-service',
        service: 'nodot',
      } as any);
      expect(hass.__calls).to.have.length(0);
    });

    it('unknown/default action string → pressOrToggle', () => {
      const hass = makeHass();
      performTap(node, hass, 'switch.x', { action: 'totally-unknown' } as any);
      expect(hass.__calls[0]).to.include({ domain: 'homeassistant', service: 'toggle' });
    });
  });
});
