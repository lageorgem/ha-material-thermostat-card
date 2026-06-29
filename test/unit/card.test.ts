import { expect, aTimeout, nextFrame } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/material-thermostat-card';
import { MaterialThermostatCard } from '../../src/material-thermostat-card';
import { makeHass, climateState, entityState } from '../helpers';
import { feelsLikeC } from '../../src/calc/comfort-metrics';
import type { MaterialThermostatCardConfig } from '../../src/types';

// The benign "ResizeObserver loop completed with undelivered notifications"
// browser error is not a test failure; swallow it so Mocha doesn't fail tests
// that legitimately resize the host.
const RO_LOOP = /ResizeObserver loop/;
window.addEventListener('error', (e) => {
  if (RO_LOOP.test(e.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const ENTITY = 'climate.test';

/** A minimal valid config pointing at the helper climate entity. */
function baseConfig(
  overrides: Partial<MaterialThermostatCardConfig> = {}
): MaterialThermostatCardConfig {
  return {
    type: 'custom:material-thermostat-card',
    entity: ENTITY,
    ...overrides,
  };
}

/**
 * Mount the card with a config and hass, awaiting the first render.
 * @param config the card config
 * @param states the hass states map
 */
async function mount(
  config: MaterialThermostatCardConfig,
  states: Record<string, any> = { [ENTITY]: climateState() }
): Promise<MaterialThermostatCard> {
  const el = document.createElement('material-thermostat-card') as MaterialThermostatCard;
  el.setConfig(config);
  el.hass = makeHass(states);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

/** Query the dial element from a mounted card. */
function dial(el: MaterialThermostatCard): any {
  return el.shadowRoot!.querySelector('mt-circular-dial');
}

describe('material-thermostat-card', () => {
  let mounted: MaterialThermostatCard[] = [];

  afterEach(() => {
    for (const el of mounted) el.remove();
    mounted = [];
    sinon.restore();
  });

  /** Track for cleanup. */
  function track(el: MaterialThermostatCard): MaterialThermostatCard {
    mounted.push(el);
    return el;
  }

  describe('setConfig', () => {
    it('throws when entity is missing', () => {
      const el = document.createElement('material-thermostat-card') as MaterialThermostatCard;
      expect(() => el.setConfig({ type: 'x', entity: '' } as MaterialThermostatCardConfig)).to.throw(
        'You must specify a climate entity.'
      );
    });

    it('throws when the entity is not a climate.* entity', () => {
      const el = document.createElement('material-thermostat-card') as MaterialThermostatCard;
      expect(() =>
        el.setConfig({ type: 'x', entity: 'light.kitchen' } as MaterialThermostatCardConfig)
      ).to.throw('You must specify a climate entity.');
    });

    it('stores a valid config', () => {
      const el = document.createElement('material-thermostat-card') as MaterialThermostatCard;
      const cfg = baseConfig();
      el.setConfig(cfg);
      expect((el as any)._config).to.equal(cfg);
    });
  });

  describe('getStubConfig', () => {
    it('picks a climate entity from hass.states when present', () => {
      const hass = makeHass({
        'light.x': entityState('light.x'),
        'climate.living': climateState({}, 'cool'),
      });
      const cfg = MaterialThermostatCard.getStubConfig(hass);
      expect(cfg.entity).to.equal('climate.living');
      expect(cfg.type).to.equal('custom:material-thermostat-card');
      expect(cfg.features).to.deep.equal([{ type: 'climate-hvac-modes' }]);
    });

    it("returns '' for entity when no climate entity exists", () => {
      const hass = makeHass({ 'light.x': entityState('light.x') });
      const cfg = MaterialThermostatCard.getStubConfig(hass);
      expect(cfg.entity).to.equal('');
    });
  });

  describe('getCardSize', () => {
    it('returns 7 with no features', () => {
      const el = document.createElement('material-thermostat-card') as MaterialThermostatCard;
      el.setConfig(baseConfig());
      expect(el.getCardSize()).to.equal(7);
    });

    it('returns 7 + features.length', () => {
      const el = document.createElement('material-thermostat-card') as MaterialThermostatCard;
      el.setConfig(
        baseConfig({ features: [{ type: 'climate-hvac-modes' }, { type: 'climate-fan-modes' }] })
      );
      expect(el.getCardSize()).to.equal(9);
    });

    it('returns 7 before any config is set', () => {
      const el = document.createElement('material-thermostat-card') as MaterialThermostatCard;
      expect(el.getCardSize()).to.equal(7);
    });
  });

  describe('getConfigElement', () => {
    it('dynamically imports and returns an editor element', async () => {
      const editor = await MaterialThermostatCard.getConfigElement();
      expect(editor).to.exist;
      expect((editor as HTMLElement).tagName.toLowerCase()).to.equal(
        'material-thermostat-card-editor'
      );
    });
  });

  describe('customCards getEntitySuggestion', () => {
    /** The card's entry on window.customCards (registered at module import). */
    function entry(): any {
      return (window as any).customCards.find(
        (c: any) => c.type === 'material-thermostat-card'
      );
    }

    it('registers an entry with a getEntitySuggestion function', () => {
      expect(entry()).to.not.equal(undefined);
      expect(entry().getEntitySuggestion).to.be.a('function');
    });

    it('suggests the card for a climate entity', () => {
      const hass = makeHass({});
      expect(entry().getEntitySuggestion(hass, 'climate.living')).to.deep.equal({
        config: { type: 'custom:material-thermostat-card', entity: 'climate.living' },
      });
    });

    it('returns null for a non-climate entity', () => {
      const hass = makeHass({});
      expect(entry().getEntitySuggestion(hass, 'light.x')).to.equal(null);
    });
  });

  describe('render base states', () => {
    it('renders empty before setConfig/hass (no shadow content)', async () => {
      const el = track(
        document.createElement('material-thermostat-card') as MaterialThermostatCard
      );
      document.body.appendChild(el);
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('ha-card')).to.equal(null);
    });

    it('renders empty when config is set but hass is missing', async () => {
      const el = track(
        document.createElement('material-thermostat-card') as MaterialThermostatCard
      );
      el.setConfig(baseConfig());
      document.body.appendChild(el);
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('ha-card')).to.equal(null);
    });

    it('shows "Entity not found" when the entity is missing from states', async () => {
      const el = track(await mount(baseConfig(), {}));
      const err = el.shadowRoot!.querySelector('.error');
      expect(err).to.not.equal(null);
      expect(err!.textContent).to.contain('Entity not found');
      expect(err!.textContent).to.contain(ENTITY);
    });

    it('renders unavailable state: disabled dial + Unavailable label', async () => {
      const el = track(
        await mount(baseConfig(), { [ENTITY]: climateState({}, 'unavailable') })
      );
      const d = dial(el);
      expect(d.disabled).to.equal(true);
      expect(d.modeLabel).to.equal('Unavailable');
    });

    it('treats "unknown" state as unavailable too', async () => {
      const el = track(await mount(baseConfig(), { [ENTITY]: climateState({}, 'unknown') }));
      const d = dial(el);
      expect(d.disabled).to.equal(true);
      expect(d.modeLabel).to.equal('Unavailable');
    });

    it('uses config.name over friendly_name when provided', async () => {
      const el = track(await mount(baseConfig({ name: 'My Thermostat' })));
      const name = el.shadowRoot!.querySelector('.name');
      expect(name!.textContent).to.equal('My Thermostat');
    });

    it('falls back to the entity id when no name/friendly_name + uses dial attr defaults', async () => {
      // A state with empty attributes exercises the `?? entity`, dial min/max/step
      // defaults and the `unit ?? °C` fallback (no unit_system on hass.config).
      const bare = { entity_id: ENTITY, state: 'cool', attributes: {} };
      const el = track(
        document.createElement('material-thermostat-card') as MaterialThermostatCard
      );
      el.setConfig(baseConfig());
      el.hass = makeHass({ [ENTITY]: bare }, { config: {} } as any);
      document.body.appendChild(el);
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.name')!.textContent).to.equal(ENTITY);
      const d = dial(el);
      expect(d.value).to.equal(20); // min_temp ?? 20 (and _targetTemp undefined)
      expect(d.min).to.equal(7); // min_temp ?? 7
      expect(d.max).to.equal(35); // max_temp ?? 35
      expect(d.step).to.equal(0.5); // target_temp_step ?? 0.5
      expect(d.unit).to.equal('°C'); // unit ?? '°C'
    });

    it('renders one mt-feature-row per configured feature, in order', async () => {
      const el = track(
        await mount(
          baseConfig({
            features: [
              { type: 'climate-hvac-modes' },
              { type: 'climate-fan-modes' },
              { type: 'climate-swing-modes' },
            ],
          })
        )
      );
      (el as any)._widthPx = 480;
      el.requestUpdate();
      await el.updateComplete;
      const rows = el.shadowRoot!.querySelectorAll('mt-feature-row');
      expect(rows.length).to.equal(3);
      expect((rows[0] as any).feature.type).to.equal('climate-hvac-modes');
      expect((rows[2] as any).feature.type).to.equal('climate-swing-modes');
    });
  });

  describe('_colorMode', () => {
    /**
     * Build a card with a particular hvac_action / state.
     * @param hvac_action the hvac_action attribute
     * @param state the entity state
     */
    async function colorOf(hvac_action: any, state = 'cool'): Promise<string> {
      const el = track(
        await mount(baseConfig(), { [ENTITY]: climateState({ hvac_action }, state) })
      );
      return (el as any)._colorMode();
    }

    it("cooling → 'cool'", async () => {
      expect(await colorOf('cooling')).to.equal('cool');
    });
    it("heating → 'heat'", async () => {
      expect(await colorOf('heating')).to.equal('heat');
    });
    it("drying → 'dry'", async () => {
      expect(await colorOf('drying')).to.equal('dry');
    });
    it("fan → 'fan_only'", async () => {
      expect(await colorOf('fan')).to.equal('fan_only');
    });
    it('otherwise → the entity state', async () => {
      expect(await colorOf('idle', 'heat')).to.equal('heat');
    });
    it('falls back to "off" when there is no state object', () => {
      const el = document.createElement('material-thermostat-card') as MaterialThermostatCard;
      el.setConfig(baseConfig());
      // no hass yet → _stateObj undefined → default branch returns 'off'
      expect((el as any)._colorMode()).to.equal('off');
    });
  });

  describe('preset icon under the dial number', () => {
    const presetState = (preset_mode?: string) =>
      climateState({ preset_modes: ['none', 'eco', 'away'], preset_mode });

    it('is undefined when the preset-modes feature is not configured', async () => {
      const el = track(await mount(baseConfig(), { [ENTITY]: presetState('eco') }));
      expect(dial(el).presetIcon).to.equal(undefined);
    });

    it('shows the heuristic preset icon when the feature is configured', async () => {
      const el = track(
        await mount(baseConfig({ features: [{ type: 'climate-preset-modes' }] }), {
          [ENTITY]: presetState('eco'),
        })
      );
      expect(dial(el).presetIcon).to.equal('mdi:leaf');
    });

    it('is undefined for the "none"/empty preset', async () => {
      const el = track(
        await mount(baseConfig({ features: [{ type: 'climate-preset-modes' }] }), {
          [ENTITY]: presetState('none'),
        })
      );
      expect(dial(el).presetIcon).to.equal(undefined);
      const el2 = track(
        await mount(baseConfig({ features: [{ type: 'climate-preset-modes' }] }), {
          [ENTITY]: presetState(undefined),
        })
      );
      expect(dial(el2).presetIcon).to.equal(undefined);
    });

    it('honors a per-option icon override, and "" suppresses it', async () => {
      const el = track(
        await mount(
          baseConfig({
            features: [{ type: 'climate-preset-modes', options: [{ value: 'eco', icon: 'mdi:sprout' }] }],
          }),
          { [ENTITY]: presetState('eco') }
        )
      );
      expect(dial(el).presetIcon).to.equal('mdi:sprout');

      const el2 = track(
        await mount(
          baseConfig({
            features: [{ type: 'climate-preset-modes', options: [{ value: 'eco', icon: '' }] }],
          }),
          { [ENTITY]: presetState('eco') }
        )
      );
      expect(dial(el2).presetIcon).to.equal(undefined);
    });
  });

  describe('_isDual', () => {
    it('true when heat_cool with low+high present', async () => {
      const el = track(
        await mount(baseConfig(), {
          [ENTITY]: climateState(
            { target_temp_low: 18, target_temp_high: 24 },
            'heat_cool'
          ),
        })
      );
      expect((el as any)._isDual).to.equal(true);
    });

    it('false when heat_cool but setpoints missing', async () => {
      const el = track(await mount(baseConfig(), { [ENTITY]: climateState({}, 'heat_cool') }));
      expect((el as any)._isDual).to.equal(false);
    });

    it('false when not heat_cool even with setpoints', async () => {
      const el = track(
        await mount(baseConfig(), {
          [ENTITY]: climateState({ target_temp_low: 18, target_temp_high: 24 }, 'cool'),
        })
      );
      expect((el as any)._isDual).to.equal(false);
    });

    it('renders dual props on the dial', async () => {
      const el = track(
        await mount(baseConfig(), {
          [ENTITY]: climateState(
            { target_temp_low: 18, target_temp_high: 24, temperature: undefined },
            'heat_cool'
          ),
        })
      );
      const d = dial(el);
      expect(d.dual).to.equal(true);
      expect(d.lowValue).to.equal(18);
      expect(d.highValue).to.equal(24);
    });
  });

  describe('layout', () => {
    /**
     * Set the measured width and wait for re-render.
     * @param el the card
     * @param px the inner width in px
     */
    async function setWidth(el: MaterialThermostatCard, px: number): Promise<void> {
      (el as any)._widthPx = px;
      el.requestUpdate();
      await el.updateComplete;
    }

    // --- stacked vs wide decision (px-based rule) ----------------------------

    it('all-100% features on a wide card → stacked (features need full width)', async () => {
      // A selector defaults to 100% → maxPct === 100 → never wide.
      const el = track(await mount(baseConfig({ features: [{ type: 'climate-hvac-modes' }] })));
      await setWidth(el, 800);
      const body = el.shadowRoot!.querySelector('.body');
      expect(body!.classList.contains('stacked')).to.equal(true);
      expect(body!.classList.contains('wide')).to.equal(false);
    });

    it('width:50 features on a wide (800px) card → wide body', async () => {
      const el = track(
        await mount(baseConfig({ features: [{ type: 'climate-hvac-modes', width: 50 } as any] }))
      );
      await setWidth(el, 800); // >= WIDE_MIN_PX(560); leftover = 800*0.5 = 400 >= DIAL_MIN_PX(240)
      const body = el.shadowRoot!.querySelector('.body');
      expect(body!.classList.contains('wide')).to.equal(true);
      expect(body!.classList.contains('stacked')).to.equal(false);
    });

    it('width just below WIDE_MIN_PX → stacked even with sub-100% features', async () => {
      const el = track(
        await mount(baseConfig({ features: [{ type: 'climate-hvac-modes', width: 50 } as any] }))
      );
      await setWidth(el, 559); // < WIDE_MIN_PX(560)
      const body = el.shadowRoot!.querySelector('.body');
      expect(body!.classList.contains('stacked')).to.equal(true);
      expect(body!.classList.contains('wide')).to.equal(false);
    });

    it('maxPct leaving < DIAL_MIN_PX of leftover → stacked', async () => {
      // width:90 on a 600px card: leftover = 600*0.1 = 60 < DIAL_MIN_PX(240).
      const el = track(
        await mount(baseConfig({ features: [{ type: 'climate-hvac-modes', width: 90 } as any] }))
      );
      await setWidth(el, 600);
      const body = el.shadowRoot!.querySelector('.body');
      expect(body!.classList.contains('stacked')).to.equal(true);
      expect(body!.classList.contains('wide')).to.equal(false);
    });

    it('width >= WIDE_MIN_PX but no features → stacked (wide needs features)', async () => {
      const el = track(await mount(baseConfig()));
      await setWidth(el, 800);
      const body = el.shadowRoot!.querySelector('.body');
      expect(body!.classList.contains('stacked')).to.equal(true);
    });

    // --- _featureWidthPct / _featureSpan ------------------------------------

    it('_featureWidthPct: explicit width is rounded to the nearest ten and clamped', async () => {
      const el = track(await mount(baseConfig()));
      const pct = (f: any): number => (el as any)._featureWidthPct(f);
      expect(pct({ type: 'climate-fan-modes', width: 50 })).to.equal(50);
      expect(pct({ type: 'climate-fan-modes', width: 44 })).to.equal(40); // round(4.4)*10
      expect(pct({ type: 'climate-fan-modes', width: 45 })).to.equal(50); // round(4.5)*10
      expect(pct({ type: 'climate-fan-modes', width: 3 })).to.equal(10); // clamp to MIN_WIDTH_PCT
      expect(pct({ type: 'climate-fan-modes', width: 200 })).to.equal(100); // clamp to MAX_WIDTH_PCT
    });

    it('_featureWidthPct: entity-tile defaults to 50, other features default to 100', async () => {
      const el = track(await mount(baseConfig()));
      const pct = (f: any): number => (el as any)._featureWidthPct(f);
      expect(pct({ type: 'entity-tile', entity: 'sensor.x' })).to.equal(50); // TILE_DEFAULT_PCT
      expect(pct({ type: 'climate-fan-modes' })).to.equal(100); // selector default
      // width:0 / non-numeric width is ignored → falls through to defaults
      expect(pct({ type: 'entity-tile', entity: 'sensor.x', width: 0 })).to.equal(50);
    });

    it('_featureSpan maps a width percentage to a 1..10 column span', async () => {
      const el = track(await mount(baseConfig()));
      const span = (f: any): number => (el as any)._featureSpan(f);
      expect(span({ type: 'climate-fan-modes', width: 100 })).to.equal(10);
      expect(span({ type: 'climate-fan-modes', width: 50 })).to.equal(5);
      expect(span({ type: 'climate-fan-modes', width: 30 })).to.equal(3);
      expect(span({ type: 'climate-fan-modes', width: 3 })).to.equal(1); // pct clamps to 10 → span 1
      expect(span({ type: 'entity-tile', entity: 'sensor.x' })).to.equal(5); // 50% → span 5
      expect(span({ type: 'climate-fan-modes' })).to.equal(10); // 100% → span 10
    });

    // --- _layout outputs ----------------------------------------------------

    it('_layout (stacked): gridCols === 10 and the dial gets a marginBottom crop', async () => {
      const el = track(await mount(baseConfig({ features: [{ type: 'climate-hvac-modes' }] })));
      await setWidth(el, 400);
      const layout = (el as any)._layout();
      expect(layout.wide).to.equal(false);
      expect(layout.gridCols).to.equal(10); // GRID_COLUMNS
      expect(layout.featureStyle).to.deep.equal({});
      expect(layout.dialStyle.marginBottom).to.match(/^-\d+px$/);
    });

    it('_layout (wide): gridCols === maxPct/10 with the expected flex styles', async () => {
      const el = track(
        await mount(baseConfig({ features: [{ type: 'climate-hvac-modes', width: 40 } as any] }))
      );
      await setWidth(el, 800); // wide: leftover = 800*0.6 = 480 >= DIAL_MIN_PX(240)
      const layout = (el as any)._layout();
      expect(layout.wide).to.equal(true);
      expect(layout.gridCols).to.equal(4); // maxPct(40) / 10
      expect(layout.featureStyle.flex).to.equal('0 0 40%');
      expect(layout.dialStyle.flex).to.equal('1 1 auto');
    });

    it('_layout (wide): gridCols/flex follow the widest feature (maxPct)', async () => {
      const el = track(
        await mount(
          baseConfig({
            features: [
              { type: 'climate-hvac-modes', width: 30 } as any,
              { type: 'climate-fan-modes', width: 60 } as any,
            ],
          })
        )
      );
      await setWidth(el, 800); // maxPct = 60; leftover = 800*0.4 = 320 >= 240 → wide
      const layout = (el as any)._layout();
      expect(layout.wide).to.equal(true);
      expect(layout.gridCols).to.equal(6); // maxPct(60) / 10
      expect(layout.featureStyle.flex).to.equal('0 0 60%');
    });

    // --- render: the .features grid -----------------------------------------

    it('renders the .features grid when features exist', async () => {
      const el = track(await mount(baseConfig({ features: [{ type: 'climate-hvac-modes' }] })));
      await setWidth(el, 400);
      expect(el.shadowRoot!.querySelector('.features')).to.not.equal(null);
      expect(el.shadowRoot!.querySelectorAll('mt-feature-row').length).to.equal(1);
    });

    it('omits the .features grid when there are no features', async () => {
      const el = track(await mount(baseConfig()));
      await setWidth(el, 400);
      expect(el.shadowRoot!.querySelector('.features')).to.equal(null);
    });

    it('.features sets grid-template-columns from gridCols (stacked → 10 cols)', async () => {
      const el = track(await mount(baseConfig({ features: [{ type: 'climate-hvac-modes' }] })));
      await setWidth(el, 400);
      const features = el.shadowRoot!.querySelector('.features') as HTMLElement;
      // the browser normalizes the unitless 0 to 0px when read back from style
      expect(features.style.gridTemplateColumns).to.equal('repeat(10, minmax(0px, 1fr))');
    });

    it('.features sets grid-template-columns from gridCols (wide → maxPct/10 cols)', async () => {
      const el = track(
        await mount(baseConfig({ features: [{ type: 'climate-hvac-modes', width: 50 } as any] }))
      );
      await setWidth(el, 800); // wide; maxPct 50 → 5 cols
      const features = el.shadowRoot!.querySelector('.features') as HTMLElement;
      expect(features.style.gridTemplateColumns).to.equal('repeat(5, minmax(0px, 1fr))');
      // wide feature area carries the flex basis too
      expect(features.style.flex).to.equal('0 0 50%');
    });

    it('renders one mt-feature-row per feature, in order, each with its computed span', async () => {
      const el = track(
        await mount(
          baseConfig({
            features: [
              { type: 'climate-hvac-modes', width: 50 } as any, // 50% → span 5
              { type: 'climate-fan-modes', width: 30 } as any, // 30% → span 3
              { type: 'climate-swing-modes' } as any, // default 100% → span 10
            ],
          })
        )
      );
      await setWidth(el, 480);
      const rows = el.shadowRoot!.querySelectorAll('mt-feature-row');
      expect(rows.length).to.equal(3);
      expect((rows[0] as any).feature.type).to.equal('climate-hvac-modes');
      expect((rows[1] as any).feature.type).to.equal('climate-fan-modes');
      expect((rows[2] as any).feature.type).to.equal('climate-swing-modes');
      // .span equals _featureSpan(feature)
      expect((rows[0] as any).span).to.equal(5);
      expect((rows[1] as any).span).to.equal(3);
      expect((rows[2] as any).span).to.equal(10);
      // mt-feature-row reflects the span onto its host grid-column
      await (rows[0] as any).updateComplete;
      await (rows[1] as any).updateComplete;
      await (rows[2] as any).updateComplete;
      expect((rows[0] as HTMLElement).style.gridColumn).to.equal('span 5');
      expect((rows[1] as HTMLElement).style.gridColumn).to.equal('span 3');
      expect((rows[2] as HTMLElement).style.gridColumn).to.equal('span 10');
    });

    it('stacked dial gets a negative marginBottom crop', async () => {
      const el = track(await mount(baseConfig({ features: [{ type: 'climate-hvac-modes' }] })));
      await setWidth(el, 400);
      const wrap = el.shadowRoot!.querySelector('.dial-wrap') as HTMLElement;
      expect(wrap.style.marginBottom).to.match(/^-\d+px$/);
    });

    it('entity-tile defaults to a 50% width (span 5) feature', async () => {
      const el = track(
        await mount(
          baseConfig({ features: [{ type: 'entity-tile', entity: 'sensor.x' } as any] }),
          { [ENTITY]: climateState(), 'sensor.x': entityState('sensor.x', '42') }
        )
      );
      await setWidth(el, 480);
      const row = el.shadowRoot!.querySelector('mt-feature-row') as any;
      expect(row.span).to.equal(5); // TILE_DEFAULT_PCT(50) → span 5
    });
  });

  describe('optimistic temp + debounce commit (single)', () => {
    let clock: sinon.SinonFakeTimers;
    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });
    afterEach(() => {
      clock.restore();
    });

    it('_onChanging sets optimistic temp and reflects it on the dial', async () => {
      const el = track(await mount(baseConfig()));
      (el as any)._onChanging({ detail: { value: 22 } } as CustomEvent);
      expect((el as any)._selectedTemp).to.equal(22);
      await el.updateComplete;
      expect(dial(el).value).to.equal(22);
    });

    it('_onChanged schedules a commit fired after the debounce', async () => {
      const el = track(await mount(baseConfig()));
      (el as any)._onChanged({ detail: { value: 22 } } as CustomEvent);
      expect((el as any)._selectedTemp).to.equal(22);
      expect(el.hass.__calls).to.have.length(0);
      clock.tick(600);
      expect(el.hass.__calls).to.have.length(1);
      expect(el.hass.__calls[0]).to.include({ domain: 'climate', service: 'set_temperature' });
      expect(el.hass.__calls[0].data).to.deep.equal({
        entity_id: ENTITY,
        temperature: 22,
      });
    });

    it('value-changing CustomEvent from the dial updates the optimistic temp', async () => {
      const el = track(await mount(baseConfig()));
      dial(el).dispatchEvent(
        new CustomEvent('value-changing', {
          detail: { value: 25 },
          bubbles: true,
          composed: true,
        })
      );
      expect((el as any)._selectedTemp).to.equal(25);
    });

    it('value-changed CustomEvent from the dial commits after debounce', async () => {
      const el = track(await mount(baseConfig()));
      dial(el).dispatchEvent(
        new CustomEvent('value-changed', {
          detail: { value: 19 },
          bubbles: true,
          composed: true,
        })
      );
      clock.tick(600);
      expect(el.hass.__calls[0].data).to.deep.equal({ entity_id: ENTITY, temperature: 19 });
    });

    it('_scheduleCommit clears a prior timer (only the last commit fires)', async () => {
      const el = track(await mount(baseConfig()));
      (el as any)._onChanged({ detail: { value: 20 } } as CustomEvent);
      clock.tick(300);
      (el as any)._onChanged({ detail: { value: 23 } } as CustomEvent);
      clock.tick(300); // first timer would have fired here if not cleared
      expect(el.hass.__calls).to.have.length(0);
      clock.tick(300); // second timer fires
      expect(el.hass.__calls).to.have.length(1);
      expect(el.hass.__calls[0].data).to.deep.equal({ entity_id: ENTITY, temperature: 23 });
    });
  });

  describe('optimistic temp + debounce commit (dual)', () => {
    let clock: sinon.SinonFakeTimers;
    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });
    afterEach(() => {
      clock.restore();
    });

    /** Mount a dual (heat_cool) card. */
    async function mountDual(): Promise<MaterialThermostatCard> {
      return track(
        await mount(baseConfig(), {
          [ENTITY]: climateState(
            { target_temp_low: 18, target_temp_high: 24 },
            'heat_cool'
          ),
        })
      );
    }

    it('_onChanging sets low/high optimistic values', async () => {
      const el = await mountDual();
      (el as any)._onChanging({ detail: { low: 17, high: 25 } } as CustomEvent);
      expect((el as any)._selectedLow).to.equal(17);
      expect((el as any)._selectedHigh).to.equal(25);
    });

    it('commits target_temp_low/high after the debounce', async () => {
      const el = await mountDual();
      (el as any)._onChanged({ detail: { low: 17, high: 25 } } as CustomEvent);
      clock.tick(600);
      expect(el.hass.__calls[0]).to.include({ domain: 'climate', service: 'set_temperature' });
      expect(el.hass.__calls[0].data).to.deep.equal({
        entity_id: ENTITY,
        target_temp_low: 17,
        target_temp_high: 25,
      });
    });

    it('resets the high edge when a changing event carries only a low value', async () => {
      const el = await mountDual();
      (el as any)._selectedHigh = 25; // pre-seed so the reset is actually observable
      (el as any)._onChanging({ detail: { low: 16 } } as CustomEvent);
      expect((el as any)._selectedLow).to.equal(16);
      expect((el as any)._selectedHigh).to.equal(undefined); // cleared, not left at 25
    });
  });

  describe('updated() clears optimistic values when hass echoes', () => {
    it('clears _selectedTemp once attributes.temperature matches', async () => {
      const el = track(await mount(baseConfig()));
      (el as any)._selectedTemp = 22;
      el.hass = makeHass({ [ENTITY]: climateState({ temperature: 22 }) });
      await el.updateComplete;
      expect((el as any)._selectedTemp).to.equal(undefined);
    });

    it('keeps _selectedTemp when the server has not caught up', async () => {
      const el = track(await mount(baseConfig()));
      (el as any)._selectedTemp = 22;
      el.hass = makeHass({ [ENTITY]: climateState({ temperature: 21 }) });
      await el.updateComplete;
      expect((el as any)._selectedTemp).to.equal(22);
    });

    it('clears _selectedLow/_selectedHigh once the server confirms', async () => {
      const el = track(
        await mount(baseConfig(), {
          [ENTITY]: climateState({ target_temp_low: 18, target_temp_high: 24 }, 'heat_cool'),
        })
      );
      (el as any)._selectedLow = 17;
      (el as any)._selectedHigh = 25;
      el.hass = makeHass({
        [ENTITY]: climateState({ target_temp_low: 17, target_temp_high: 25 }, 'heat_cool'),
      });
      await el.updateComplete;
      expect((el as any)._selectedLow).to.equal(undefined);
      expect((el as any)._selectedHigh).to.equal(undefined);
    });
  });

  describe('theme', () => {
    it('applies a theme without throwing on update', async () => {
      const el = track(
        document.createElement('material-thermostat-card') as MaterialThermostatCard
      );
      el.setConfig(baseConfig({ theme: 'my-theme' }));
      el.hass = makeHass(
        { [ENTITY]: climateState() },
        { themes: { themes: { 'my-theme': { 'primary-color': '#abcdef' } }, default_theme: 'default' } as any }
      );
      document.body.appendChild(el);
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('ha-card')).to.not.equal(null);
      // change just the hass.themes object reference → re-applies without throwing
      el.hass = makeHass(
        { [ENTITY]: climateState() },
        { themes: { themes: { 'my-theme': { 'primary-color': '#123456' } }, default_theme: 'default' } as any }
      );
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('ha-card')).to.not.equal(null);
    });

    it('does not reapply the theme when neither themes nor config changed', async () => {
      const el = track(
        document.createElement('material-thermostat-card') as MaterialThermostatCard
      );
      el.setConfig(baseConfig({ theme: 'my-theme' }));
      const themes = {
        themes: { 'my-theme': { 'primary-color': '#abcdef' } },
        default_theme: 'default',
      } as any;
      el.hass = makeHass({ [ENTITY]: climateState() }, { themes });
      document.body.appendChild(el);
      await el.updateComplete;
      // Update hass but keep the SAME themes object reference and don't touch the
      // config → all three OR-arms are false, so applyThemesOnElement is skipped.
      el.hass = makeHass({ [ENTITY]: climateState({ current_temperature: 25 }) }, { themes });
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('ha-card')).to.not.equal(null);
    });
  });

  describe('more-info', () => {
    it('fires hass-more-info when the header more button is clicked', async () => {
      const el = track(await mount(baseConfig()));
      let detail: any;
      const handler = (e: Event): void => {
        detail = (e as CustomEvent).detail;
      };
      window.addEventListener('hass-more-info', handler);
      const btn = el.shadowRoot!.querySelector('.more') as HTMLButtonElement;
      btn.click();
      window.removeEventListener('hass-more-info', handler);
      expect(detail).to.not.equal(undefined);
      expect(detail.entityId).to.equal(ENTITY);
    });
  });

  describe('_trackedEntityIds', () => {
    it('includes the climate entity plus feature entity/entities[]/items[]', async () => {
      const el = track(
        await mount(
          baseConfig({
            features: [
              { type: 'entity-tile', entity: 'sensor.temp' } as any,
              {
                type: 'switch-group',
                entities: [{ entity: 'switch.a' }, { entity: 'switch.b' }],
              } as any,
              { type: 'button-list', items: [{ entity: 'button.c' }] } as any,
              { type: 'climate-fan-modes' } as any, // no entity/entities/items
            ],
          })
        )
      );
      const ids = (el as any)._trackedEntityIds();
      expect(ids).to.include.members([
        ENTITY,
        'sensor.temp',
        'switch.a',
        'switch.b',
        'button.c',
      ]);
      // deduped set
      expect(new Set(ids).size).to.equal(ids.length);
    });
  });

  describe('shouldUpdate', () => {
    it('re-renders when a tracked entity state object changes', async () => {
      const el = track(await mount(baseConfig()));
      const renderSpy = sinon.spy(el as any, 'render');
      // same reference for the entity → no re-render
      const sameState = climateState();
      el.hass = makeHass({ [ENTITY]: sameState });
      await el.updateComplete;
      el.hass = makeHass({ [ENTITY]: sameState });
      await el.updateComplete;
      const callsAfterSame = renderSpy.callCount;
      // changed reference → re-render
      el.hass = makeHass({ [ENTITY]: climateState({ temperature: 30 }) });
      await el.updateComplete;
      expect(renderSpy.callCount).to.be.greaterThan(callsAfterSame);
    });

    it('shouldUpdate returns true for _config / state-change keys directly', async () => {
      const el = track(await mount(baseConfig()));
      const map = (k: string): Map<string, unknown> => new Map([[k, undefined]]);
      expect((el as any).shouldUpdate(map('_config'))).to.equal(true);
      expect((el as any).shouldUpdate(map('_selectedTemp'))).to.equal(true);
      expect((el as any).shouldUpdate(map('_selectedLow'))).to.equal(true);
      expect((el as any).shouldUpdate(map('_selectedHigh'))).to.equal(true);
      expect((el as any).shouldUpdate(map('_widthPx'))).to.equal(true);
    });

    it('shouldUpdate returns false when nothing relevant changed', async () => {
      const el = track(await mount(baseConfig()));
      expect((el as any).shouldUpdate(new Map())).to.equal(false);
    });

    it('shouldUpdate returns true on first hass (no old value)', async () => {
      const el = track(await mount(baseConfig()));
      // changed.has('hass') but old is undefined → returns true
      const changed = new Map<string, unknown>([['hass', undefined]]);
      expect((el as any).shouldUpdate(changed)).to.equal(true);
    });

    it('shouldUpdate returns false when no _config is set', () => {
      const el = document.createElement('material-thermostat-card') as MaterialThermostatCard;
      // no _config → the hass branch short-circuits to false
      const changed = new Map<string, unknown>([['hass', makeHass()]]);
      expect((el as any).shouldUpdate(changed)).to.equal(false);
    });

    it('shouldUpdate false when the tracked entity state is unchanged (===)', async () => {
      const el = track(await mount(baseConfig()));
      const same = el.hass.states[ENTITY];
      const newHass = makeHass({ [ENTITY]: same });
      const changed = new Map<string, unknown>([['hass', el.hass]]);
      // simulate Lit handing us the new value as `this.hass`
      el.hass = newHass;
      expect((el as any).shouldUpdate(changed)).to.equal(false);
    });
  });

  describe('ResizeObserver / connect-disconnect lifecycle', () => {
    it('connectedCallback is idempotent (no second observer, no throw)', async () => {
      const el = track(await mount(baseConfig()));
      const first = (el as any)._resizeObserver;
      expect(first).to.not.equal(undefined);
      // call again — should early-return, keeping the same observer
      el.connectedCallback();
      expect((el as any)._resizeObserver).to.equal(first);
    });

    it('disconnectedCallback cleans up the observer and pending timer', async () => {
      const el = track(await mount(baseConfig()));
      // arm a debounce timer so disconnect clears it
      (el as any)._debounceTimer = window.setTimeout(() => {}, 10_000);
      el.disconnectedCallback();
      expect((el as any)._resizeObserver).to.equal(undefined);
      // reconnect re-arms the observer
      document.body.appendChild(el);
      el.connectedCallback();
      expect((el as any)._resizeObserver).to.not.equal(undefined);
    });

    it('the ResizeObserver updates _widthPx from the host size', async () => {
      const el = track(await mount(baseConfig()));
      el.style.display = 'block';
      el.style.width = '500px';
      // give the observer a frame to fire
      await nextFrame();
      await aTimeout(50);
      await el.updateComplete;
      // Verify the documented relationship — inner = observed host width − CARD_PADDING_X
      // (32) — against the REAL measured width, not just "> 0".
      const outer = el.getBoundingClientRect().width;
      expect(outer).to.be.greaterThan(0);
      expect((el as any)._widthPx).to.be.closeTo(outer - 32, 2);
    });
  });

  describe('feels-like current temperature', () => {
    const T = 'sensor.room_temp';
    const H = 'sensor.room_hum';

    /** Mount with the feels-like sensors present. */
    async function mountFeels(
      feels_like: MaterialThermostatCardConfig['feels_like'],
      tempState = '30',
      humState = '60'
    ): Promise<MaterialThermostatCard> {
      return track(
        await mount(baseConfig({ feels_like }), {
          [ENTITY]: climateState({ current_temperature: 24 }),
          [T]: entityState(T, tempState),
          [H]: entityState(H, humState),
        })
      );
    }

    it('replaces the dial current with the computed feels-like when enabled', async () => {
      const el = await mountFeels({ temperature: T, humidity: H, show_as_current: true });
      expect(dial(el).current).to.be.closeTo(feelsLikeC(30, 60), 1e-6);
    });

    it('uses the climate current_temperature when show_as_current is off', async () => {
      const el = await mountFeels({ temperature: T, humidity: H, show_as_current: false });
      expect(dial(el).current).to.equal(24);
    });

    it('falls back to current_temperature when a sensor is non-numeric', async () => {
      const el = await mountFeels(
        { temperature: T, humidity: H, show_as_current: true },
        'unavailable'
      );
      expect(dial(el).current).to.equal(24);
    });

    it('falls back when sensors are not set', async () => {
      const el = track(await mount(baseConfig({ feels_like: { show_as_current: true } })));
      expect(dial(el).current).to.equal(24); // climateState default current_temperature
    });

    it('tracks the feels-like sensors for re-render', async () => {
      const el = await mountFeels({ temperature: T, humidity: H, show_as_current: true });
      const ids = (el as any)._trackedEntityIds();
      expect(ids).to.include.members([ENTITY, T, H]);
    });

    it('passes the sensors down to each feature row', async () => {
      const el = track(
        await mount(
          baseConfig({
            feels_like: { temperature: T, humidity: H },
            features: [{ type: 'climate-hvac-modes' }],
          }),
          {
            [ENTITY]: climateState(),
            [T]: entityState(T, '25'),
            [H]: entityState(H, '50'),
          }
        )
      );
      (el as any)._widthPx = 480;
      el.requestUpdate();
      await el.updateComplete;
      const row = el.shadowRoot!.querySelector('mt-feature-row') as any;
      expect(row.feelsLikeTemp).to.equal(T);
      expect(row.feelsLikeHumidity).to.equal(H);
    });
  });
});
