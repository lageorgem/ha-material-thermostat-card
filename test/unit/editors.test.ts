import { fixture, html, expect, aTimeout } from '@open-wc/testing';
import { makeHass, climateState, entityState, captureEvents } from '../helpers';
import type { TestHass } from '../helpers';

import { ensureHaComponents, resetHaComponentsForTest } from '../../src/editors/load-ha';
import '../../src/editor';
import '../../src/editors/climate-feature-editor';
import '../../src/editors/input-select-editor';
import '../../src/editors/entity-list-editor';
import '../../src/editors/entity-tile-editor';
import '../../src/editors/comfort-editor';

import type { MaterialThermostatCardEditor } from '../../src/editor';
import type { MtClimateFeatureEditor } from '../../src/editors/climate-feature-editor';
import type { MtInputSelectEditor } from '../../src/editors/input-select-editor';
import type { MtEntityListEditor } from '../../src/editors/entity-list-editor';
import type { MtEntityTileEditor } from '../../src/editors/entity-tile-editor';
import type { MtComfortEditor } from '../../src/editors/comfort-editor';
import type {
  FeatureType,
  InputSelectFeatureConfig,
  MaterialThermostatCardConfig,
} from '../../src/types';

/** Dispatch a ha-form/picker style value-changed CustomEvent from a node. */
function emitValueChanged(node: Element, value: unknown): void {
  node.dispatchEvent(
    new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true })
  );
}

// ---------------------------------------------------------------------------
// D) load-ha.ts ensureHaComponents
// ---------------------------------------------------------------------------
describe('ensureHaComponents (load-ha)', () => {
  const realGet = customElements.get.bind(customElements);
  let origLoader: any;

  beforeEach(() => {
    origLoader = (window as any).loadCardHelpers;
    resetHaComponentsForTest();
  });
  afterEach(() => {
    (customElements as any).get = realGet;
    (window as any).loadCardHelpers = origLoader;
    resetHaComponentsForTest();
  });

  /** Pretend exactly `names` are registered custom elements (others undefined). */
  function fakeRegistered(names: string[]): void {
    (customElements as any).get = (n: string) =>
      names.includes(n) ? class extends HTMLElement {} : undefined;
  }

  it('resolves immediately when the form components are already registered', async () => {
    fakeRegistered(['ha-form', 'ha-entity-picker', 'ha-icon-picker']);
    let loaderCalled = false;
    (window as any).loadCardHelpers = async () => {
      loaderCalled = true;
      return {};
    };
    await ensureHaComponents();
    expect(loaderCalled).to.equal(false); // early return — the loader is never consulted
  });

  it('returns without loading when loadCardHelpers is unavailable', async () => {
    fakeRegistered([]); // nothing registered → must consult the loader…
    delete (window as any).loadCardHelpers; // …but there is none → just return
    await ensureHaComponents(); // resolves, no throw
  });

  it('invokes loadCardHelpers to pull in the HA form stack when not registered', async () => {
    fakeRegistered([]);
    let createCalled = false;
    let configCalled = false;
    (window as any).loadCardHelpers = async () => ({
      createCardElement: async () => {
        createCalled = true;
        return {
          constructor: {
            getConfigElement: async () => {
              configCalled = true;
              return {};
            },
          },
        };
      },
    });
    await ensureHaComponents();
    expect(createCalled).to.equal(true);
    expect(configCalled).to.equal(true);
  });

  it('swallows errors from HA internals (best-effort, never rejects)', async () => {
    fakeRegistered([]);
    (window as any).loadCardHelpers = async () => {
      throw new Error('boom');
    };
    await ensureHaComponents(); // must resolve despite the throw
  });

  it('is idempotent — memoizes its promise across calls', async () => {
    fakeRegistered([]);
    delete (window as any).loadCardHelpers;
    const a = ensureHaComponents();
    const b = ensureHaComponents();
    expect(a).to.equal(b);
    await a;
  });
});

// ---------------------------------------------------------------------------
// E) editor.ts material-thermostat-card-editor
// ---------------------------------------------------------------------------
describe('material-thermostat-card-editor', () => {
  /** Mount the editor with a config + hass. */
  async function mount(
    config: Partial<MaterialThermostatCardConfig> = {},
    hass: TestHass = makeHass({ 'climate.test': climateState() })
  ): Promise<MaterialThermostatCardEditor> {
    const full: MaterialThermostatCardConfig = {
      type: 'custom:material-thermostat-card',
      entity: 'climate.test',
      ...config,
    };
    const el = await fixture<MaterialThermostatCardEditor>(
      html`<material-thermostat-card-editor></material-thermostat-card-editor>`
    );
    el.hass = hass;
    el.setConfig(full);
    await el.updateComplete;
    return el;
  }

  it('renders nothing without config/hass', async () => {
    const el = await fixture<MaterialThermostatCardEditor>(
      html`<material-thermostat-card-editor></material-thermostat-card-editor>`
    );
    // no setConfig / no hass -> render early-returns empty
    expect(el.shadowRoot!.querySelector('ha-form')).to.equal(null);
  });

  it('setConfig stores config; render shows base ha-form and features list', async () => {
    const el = await mount({ features: [{ type: 'climate-hvac-modes' }] });
    expect((el as any)._config.entity).to.equal('climate.test');
    expect(el.shadowRoot!.querySelector('ha-form')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('.features')).to.not.equal(null);
    expect(el.shadowRoot!.querySelectorAll('.feature').length).to.equal(1);
  });

  it('_baseChanged merges config and emits config-changed (empty name/theme -> undefined)', async () => {
    const el = await mount();
    const cap = captureEvents('config-changed');
    const form = el.shadowRoot!.querySelector('ha-form')!;
    emitValueChanged(form, {
      entity: 'climate.other',
      name: '',
      theme: '',
      show_current_as_primary: true,
    });
    cap.stop();
    expect(cap.events.length).to.equal(1);
    const cfg = (cap.events[0].detail as any).config;
    expect(cfg.entity).to.equal('climate.other');
    expect(cfg.name).to.equal(undefined);
    expect(cfg.theme).to.equal(undefined);
    expect(cfg.show_current_as_primary).to.equal(true);
  });

  it('_baseChanged keeps non-empty name/theme and drops falsy show_current_as_primary', async () => {
    const el = await mount();
    const cap = captureEvents('config-changed');
    el.shadowRoot!.querySelector('ha-form')!.dispatchEvent(
      new CustomEvent('value-changed', {
        detail: {
          value: {
            entity: 'climate.test',
            name: 'My AC',
            theme: 'ios-dark',
            show_current_as_primary: false,
          },
        },
        bubbles: true,
        composed: true,
      })
    );
    cap.stop();
    const cfg = (cap.events[0].detail as any).config;
    expect(cfg.name).to.equal('My AC');
    expect(cfg.theme).to.equal('ios-dark');
    expect(cfg.show_current_as_primary).to.equal(undefined);
  });

  it('_computeLabel returns labels for each base schema field', async () => {
    const el = await mount();
    const cl = (el as any)._computeLabel;
    expect(cl({ name: 'entity' })).to.contain('Climate');
    expect(cl({ name: 'name' })).to.equal('Name');
    expect(cl({ name: 'theme' })).to.equal('Theme');
    expect(cl({ name: 'show_current_as_primary' })).to.contain('primary');
    expect(cl({ name: 'something_else' })).to.equal('something_else');
  });

  it('_baseData reflects show_current_as_primary default false', async () => {
    const el = await mount();
    expect((el as any)._baseData.show_current_as_primary).to.equal(false);
    const el2 = await mount({ show_current_as_primary: true });
    expect((el2 as any)._baseData.show_current_as_primary).to.equal(true);
  });

  describe('feels-like section', () => {
    /** The second ha-form in the editor is the feels-like form. */
    function feelsForm(el: MaterialThermostatCardEditor): Element {
      return el.shadowRoot!.querySelectorAll('ha-form')[1];
    }

    it('renders a feels-like form populated from config', async () => {
      const el = await mount({
        feels_like: { temperature: 'sensor.t', humidity: 'sensor.h', show_as_current: true },
      });
      expect((el as any)._feelsLikeData).to.deep.equal({
        temperature: 'sensor.t',
        humidity: 'sensor.h',
        show_as_current: true,
      });
      expect(feelsForm(el)).to.not.equal(undefined);
    });

    it('_feelsLikeData defaults show_as_current to false', async () => {
      const el = await mount();
      expect((el as any)._feelsLikeData.show_as_current).to.equal(false);
    });

    it('_computeLabel covers the feels-like fields', async () => {
      const cl = (await mount() as any)._computeLabel;
      expect(cl({ name: 'temperature' })).to.contain('Temperature');
      expect(cl({ name: 'humidity' })).to.contain('Humidity');
      expect(cl({ name: 'show_as_current' })).to.contain('feels-like');
    });

    it('_feelsLikeChanged writes the nested feels_like object', async () => {
      const el = await mount();
      const cap = captureEvents('config-changed');
      emitValueChanged(feelsForm(el), {
        temperature: 'sensor.t',
        humidity: 'sensor.h',
        show_as_current: true,
      });
      cap.stop();
      const cfg = (cap.events[0].detail as any).config;
      expect(cfg.feels_like).to.deep.equal({
        temperature: 'sensor.t',
        humidity: 'sensor.h',
        show_as_current: true,
      });
    });

    it('clearing every feels-like field drops the object entirely', async () => {
      const el = await mount({ feels_like: { temperature: 'sensor.t' } });
      const cap = captureEvents('config-changed');
      emitValueChanged(feelsForm(el), { temperature: '', humidity: '', show_as_current: false });
      cap.stop();
      const cfg = (cap.events[0].detail as any).config;
      expect(cfg.feels_like).to.equal(undefined);
    });
  });

  describe('add-feature menu and defaultFeature per type', () => {
    it('_addOpen toggles when clicking .add-btn', async () => {
      const el = await mount();
      expect((el as any)._addOpen).to.be.false;
      const btn = el.shadowRoot!.querySelector('.add-btn') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;
      expect((el as any)._addOpen).to.be.true;
      expect(el.shadowRoot!.querySelector('.add-menu')).to.not.equal(null);
      btn.click();
      await el.updateComplete;
      expect((el as any)._addOpen).to.be.false;
    });

    const cases: { type: FeatureType; check: (f: any) => void }[] = [
      { type: 'climate-hvac-modes', check: (f) => expect(f).to.deep.equal({ type: 'climate-hvac-modes' }) },
      { type: 'climate-fan-modes', check: (f) => expect(f).to.deep.equal({ type: 'climate-fan-modes' }) },
      { type: 'climate-swing-modes', check: (f) => expect(f).to.deep.equal({ type: 'climate-swing-modes' }) },
      { type: 'climate-preset-modes', check: (f) => expect(f).to.deep.equal({ type: 'climate-preset-modes' }) },
      { type: 'input-select', check: (f) => expect(f).to.deep.equal({ type: 'input-select', entity: '' }) },
      { type: 'switch-group', check: (f) => expect(f).to.deep.equal({ type: 'switch-group', entities: [] }) },
      { type: 'switch-list', check: (f) => expect(f).to.deep.equal({ type: 'switch-list', entities: [] }) },
      { type: 'button-list', check: (f) => expect(f).to.deep.equal({ type: 'button-list', items: [] }) },
      { type: 'entity-tile', check: (f) => expect(f).to.deep.equal({ type: 'entity-tile', entity: '' }) },
      { type: 'sensor-list', check: (f) => expect(f).to.deep.equal({ type: 'sensor-list', items: [] }) },
      { type: 'comfort', check: (f) => expect(f).to.deep.equal({ type: 'comfort', show_target_eta: false }) },
    ];

    cases.forEach(({ type, check }) => {
      it(`_pickFeature(${type}) appends a default feature and sets _editingIndex`, async () => {
        const el = await mount();
        const cap = captureEvents('config-changed');
        (el as any)._pickFeature(type);
        cap.stop();
        const cfg = (cap.events[0].detail as any).config;
        expect(cfg.features.length).to.equal(1);
        check(cfg.features[0]);
        expect((el as any)._editingIndex).to.equal(0);
        expect((el as any)._addOpen).to.be.false;
      });
    });

    it('clicking an .add-opt button picks that feature', async () => {
      const el = await mount();
      (el as any)._addOpen = true;
      await el.updateComplete;
      const cap = captureEvents('config-changed');
      const opt = el.shadowRoot!.querySelector('.add-opt') as HTMLButtonElement;
      opt.click();
      cap.stop();
      const cfg = (cap.events[0].detail as any).config;
      expect(cfg.features.length).to.equal(1);
      // first ADDABLE_FEATURES entry is climate-hvac-modes
      expect(cfg.features[0].type).to.equal('climate-hvac-modes');
    });
  });

  describe('_addableFeatures filtering', () => {
    const CUSTOM_TYPES: FeatureType[] = [
      'input-select',
      'switch-group',
      'switch-list',
      'button-list',
      'entity-tile',
      'sensor-list',
    ];

    it('entity exposing hvac+fan+swing → those 3 climate types + the 6 custom types', async () => {
      const el = await mount({ features: [] });
      const types = (el as any)._addableFeatures().map((f: any) => f.type);
      expect(types).to.include.members([
        'climate-hvac-modes',
        'climate-fan-modes',
        'climate-swing-modes',
        'comfort',
        ...CUSTOM_TYPES,
      ]);
      // preset modes aren't exposed by this entity → not offered
      expect(types).to.not.include('climate-preset-modes');
      // 3 climate + comfort + 6 custom = 10 addable types, none else
      expect(types.length).to.equal(10);
    });

    it('offers climate-preset-modes only when the entity exposes preset_modes', async () => {
      const without = await mount({ features: [] });
      expect((without as any)._addableFeatures().map((f: any) => f.type)).to.not.include(
        'climate-preset-modes'
      );
      const withPreset = await mount(
        { features: [] },
        makeHass({
          'climate.test': climateState({ preset_modes: ['none', 'eco', 'away'] }),
        })
      );
      const types = (withPreset as any)._addableFeatures().map((f: any) => f.type);
      expect(types).to.include('climate-preset-modes');
      // and it's unique: once added, it's no longer offered
      const added = await mount(
        { features: [{ type: 'climate-preset-modes' }] },
        makeHass({
          'climate.test': climateState({ preset_modes: ['none', 'eco', 'away'] }),
        })
      );
      expect((added as any)._addableFeatures().map((f: any) => f.type)).to.not.include(
        'climate-preset-modes'
      );
    });

    it('treats a missing entity state as no attributes (the ?? {} fallback)', async () => {
      // No state object for the configured entity → attributes default to {} so
      // the climate selectors (which need hvac/fan/swing arrays) are filtered out,
      // while the custom/add-once features remain.
      const el = await mount({ features: [] }, makeHass({}));
      const types = (el as any)._addableFeatures().map((f: any) => f.type);
      expect(types).to.not.include('climate-hvac-modes');
      expect(types).to.not.include('climate-fan-modes');
      expect(types).to.not.include('climate-swing-modes');
      expect(types).to.include.members(CUSTOM_TYPES);
      expect(types).to.include('comfort');
    });

    it('the comfort feature may be added only once', async () => {
      const before = await mount({ features: [] });
      expect((before as any)._addableFeatures().map((f: any) => f.type)).to.include('comfort');
      const after = await mount({ features: [{ type: 'comfort' }] });
      expect((after as any)._addableFeatures().map((f: any) => f.type)).to.not.include('comfort');
    });

    it('entity WITHOUT fan_modes/swing_modes → those climate types absent, hvac present', async () => {
      const el = await mount(
        { features: [] },
        makeHass({
          'climate.test': climateState({ fan_modes: undefined, swing_modes: undefined }),
        })
      );
      const types = (el as any)._addableFeatures().map((f: any) => f.type);
      expect(types).to.include('climate-hvac-modes');
      expect(types).to.not.include('climate-fan-modes');
      expect(types).to.not.include('climate-swing-modes');
      // custom types still all present
      expect(types).to.include.members(CUSTOM_TYPES);
    });

    it('an already-added climate type is filtered out (unique); custom types stay (repeatable)', async () => {
      const el = await mount({
        features: [{ type: 'climate-hvac-modes' }, { type: 'input-select', entity: '' }],
      });
      const types = (el as any)._addableFeatures().map((f: any) => f.type);
      // hvac-modes already added → no longer offered
      expect(types).to.not.include('climate-hvac-modes');
      // the other climate types are still offered (entity exposes them)
      expect(types).to.include('climate-fan-modes');
      expect(types).to.include('climate-swing-modes');
      // custom input-select already added but still offered (repeatable)
      expect(types).to.include('input-select');
      expect(types).to.include.members(CUSTOM_TYPES);
    });
  });

  it('_removeFeature removes by index and clears _editingIndex', async () => {
    const el = await mount({
      features: [{ type: 'climate-hvac-modes' }, { type: 'climate-fan-modes' }],
    });
    (el as any)._editingIndex = 1;
    const cap = captureEvents('config-changed');
    (el as any)._removeFeature(0);
    cap.stop();
    const cfg = (cap.events[0].detail as any).config;
    expect(cfg.features.length).to.equal(1);
    expect(cfg.features[0].type).to.equal('climate-fan-modes');
    expect((el as any)._editingIndex).to.equal(null);
  });

  it('_moveFeature reorders', async () => {
    const el = await mount({
      features: [{ type: 'climate-hvac-modes' }, { type: 'climate-fan-modes' }],
    });
    const cap = captureEvents('config-changed');
    (el as any)._moveFeature({ detail: { oldIndex: 0, newIndex: 1 } });
    cap.stop();
    const cfg = (cap.events[0].detail as any).config;
    expect(cfg.features.map((f: any) => f.type)).to.deep.equal([
      'climate-fan-modes',
      'climate-hvac-modes',
    ]);
    expect((el as any)._editingIndex).to.equal(null);
  });

  it('_featureChanged replaces the feature at index', async () => {
    const el = await mount({ features: [{ type: 'climate-hvac-modes' }] });
    const cap = captureEvents('config-changed');
    (el as any)._featureChanged(0, {
      detail: { feature: { type: 'climate-hvac-modes', display: 'dropdown' } },
    });
    cap.stop();
    const cfg = (cap.events[0].detail as any).config;
    expect(cfg.features[0].display).to.equal('dropdown');
  });

  it('ha-sortable item-moved triggers _moveFeature', async () => {
    const el = await mount({
      features: [{ type: 'climate-hvac-modes' }, { type: 'climate-fan-modes' }],
    });
    const cap = captureEvents('config-changed');
    el.shadowRoot!.querySelector('ha-sortable')!.dispatchEvent(
      new CustomEvent('item-moved', {
        detail: { oldIndex: 1, newIndex: 0 },
        bubbles: true,
        composed: true,
      })
    );
    cap.stop();
    const cfg = (cap.events[0].detail as any).config;
    expect(cfg.features[0].type).to.equal('climate-fan-modes');
  });

  describe('_renderFeatureRow + _renderFeatureEditor per type', () => {
    /** Mount with one feature of `type`, expand it, return the editor host. */
    async function expand(type: FeatureType, extra: Record<string, unknown> = {}) {
      const el = await mount({ features: [{ type, ...extra } as any] });
      (el as any)._editingIndex = 0;
      await el.updateComplete;
      return el;
    }

    it('shows FEATURE_LABELS in the row title', async () => {
      const el = await mount({ features: [{ type: 'entity-tile', entity: '' }] });
      const title = el.shadowRoot!.querySelector('.feature-title')!;
      expect(title.textContent!.trim()).to.equal('Entity tile');
    });

    it('falls back to feature.type for an unknown label', async () => {
      const el = await mount({ features: [{ type: 'bogus' } as any] });
      const title = el.shadowRoot!.querySelector('.feature-title')!;
      expect(title.textContent!.trim()).to.equal('bogus');
    });

    it('climate-hvac-modes -> mt-climate-feature-editor kind=hvac', async () => {
      const el = await expand('climate-hvac-modes');
      const ed = el.shadowRoot!.querySelector('mt-climate-feature-editor') as any;
      expect(ed).to.not.equal(null);
      expect(ed.kind).to.equal('hvac');
    });

    it('climate-fan-modes -> kind=fan', async () => {
      const el = await expand('climate-fan-modes');
      expect((el.shadowRoot!.querySelector('mt-climate-feature-editor') as any).kind).to.equal(
        'fan'
      );
    });

    it('climate-swing-modes -> kind=swing', async () => {
      const el = await expand('climate-swing-modes');
      expect((el.shadowRoot!.querySelector('mt-climate-feature-editor') as any).kind).to.equal(
        'swing'
      );
    });

    it('climate-preset-modes -> kind=preset', async () => {
      const el = await expand('climate-preset-modes');
      expect((el.shadowRoot!.querySelector('mt-climate-feature-editor') as any).kind).to.equal(
        'preset'
      );
    });

    it('input-select -> mt-input-select-editor', async () => {
      const el = await expand('input-select', { entity: '' });
      expect(el.shadowRoot!.querySelector('mt-input-select-editor')).to.not.equal(null);
    });

    it('switch-group -> mt-entity-list-editor (showDisplay true, itemsKey entities)', async () => {
      const el = await expand('switch-group', { entities: [] });
      const ed = el.shadowRoot!.querySelector('mt-entity-list-editor') as any;
      expect(ed).to.not.equal(null);
      expect(ed.itemsKey).to.equal('entities');
      expect(ed.showDisplay).to.equal(true);
    });

    it('switch-list -> mt-entity-list-editor (itemsKey entities)', async () => {
      const el = await expand('switch-list', { entities: [] });
      const ed = el.shadowRoot!.querySelector('mt-entity-list-editor') as any;
      expect(ed.itemsKey).to.equal('entities');
    });

    it('button-list -> mt-entity-list-editor (itemsKey items)', async () => {
      const el = await expand('button-list', { items: [] });
      const ed = el.shadowRoot!.querySelector('mt-entity-list-editor') as any;
      expect(ed.itemsKey).to.equal('items');
    });

    it('entity-tile -> mt-entity-tile-editor', async () => {
      const el = await expand('entity-tile', { entity: '' });
      expect(el.shadowRoot!.querySelector('mt-entity-tile-editor')).to.not.equal(null);
    });

    it('sensor-list -> mt-entity-list-editor (itemsKey items)', async () => {
      const el = await expand('sensor-list', { items: [] });
      const ed = el.shadowRoot!.querySelector('mt-entity-list-editor') as any;
      expect(ed).to.not.equal(null);
      expect(ed.itemsKey).to.equal('items');
    });

    it('comfort -> mt-comfort-editor, reflecting feels-like configured state', async () => {
      const unset = await expand('comfort');
      const edUnset = unset.shadowRoot!.querySelector('mt-comfort-editor') as any;
      expect(edUnset).to.not.equal(null);
      expect(edUnset.feelsLikeConfigured).to.equal(false);

      const set = await mount({
        feels_like: { temperature: 'sensor.t', humidity: 'sensor.h' },
        features: [{ type: 'comfort' }],
      });
      (set as any)._editingIndex = 0;
      await set.updateComplete;
      const edSet = set.shadowRoot!.querySelector('mt-comfort-editor') as any;
      expect(edSet.feelsLikeConfigured).to.equal(true);
    });

    it('unknown type -> "No editor available." hint', async () => {
      const el = await expand('totally-bogus' as FeatureType);
      const editor = el.shadowRoot!.querySelector('.feature-editor')!;
      expect(editor.textContent).to.contain('No editor available');
    });

    it('clicking the edit button toggles _editingIndex (expand then collapse)', async () => {
      const el = await mount({ features: [{ type: 'climate-hvac-modes' }] });
      const editBtn = el.shadowRoot!.querySelector(
        '.icon-btn[aria-label="Edit feature"]'
      ) as HTMLButtonElement;
      editBtn.click();
      await el.updateComplete;
      expect((el as any)._editingIndex).to.equal(0);
      editBtn.click();
      await el.updateComplete;
      expect((el as any)._editingIndex).to.equal(null);
    });

    it('clicking the delete button removes the feature', async () => {
      const el = await mount({ features: [{ type: 'climate-hvac-modes' }] });
      const cap = captureEvents('config-changed');
      const delBtn = el.shadowRoot!.querySelector(
        '.icon-btn[aria-label="Delete feature"]'
      ) as HTMLButtonElement;
      delBtn.click();
      cap.stop();
      expect((cap.events[0].detail as any).config.features.length).to.equal(0);
    });

    it('a sub-editor feature-changed bubbles into _featureChanged', async () => {
      const el = await expand('input-select', { entity: '' });
      const ed = el.shadowRoot!.querySelector('mt-input-select-editor')!;
      const cap = captureEvents('config-changed');
      ed.dispatchEvent(
        new CustomEvent('feature-changed', {
          detail: { feature: { type: 'input-select', entity: 'input_select.x' } },
          bubbles: true,
          composed: true,
        })
      );
      cap.stop();
      expect((cap.events[0].detail as any).config.features[0].entity).to.equal('input_select.x');
    });
  });

  it('connectedCallback runs ensureHaComponents (pulls in the HA form stack)', async () => {
    // Prove the wiring: with the loader stubbed and the memo reset, mounting the
    // editor must actually invoke ensureHaComponents → loadCardHelpers. (Asserting
    // el.isConnected alone is vacuous — fixture() always attaches the element.)
    resetHaComponentsForTest();
    const origLoader = (window as any).loadCardHelpers;
    let loaderCalled = false;
    (window as any).loadCardHelpers = async () => {
      loaderCalled = true;
      return { createCardElement: async () => ({ constructor: {} }) };
    };
    try {
      const el = await mount();
      expect(el.isConnected).to.be.true;
      await aTimeout(20); // let connectedCallback's ensureHaComponents() resolve
      expect(loaderCalled).to.equal(true);
    } finally {
      (window as any).loadCardHelpers = origLoader;
      resetHaComponentsForTest();
    }
  });
});

// ---------------------------------------------------------------------------
// F) climate-feature-editor.ts
// ---------------------------------------------------------------------------
describe('mt-climate-feature-editor', () => {
  /** Mount the climate feature editor. */
  async function mount(
    kind: 'hvac' | 'fan' | 'swing' | 'preset',
    feature: any = { type: 'climate-hvac-modes' },
    states: Record<string, any> = { 'climate.test': climateState() }
  ): Promise<MtClimateFeatureEditor> {
    const hass = makeHass(states);
    const el = await fixture<MtClimateFeatureEditor>(
      html`<mt-climate-feature-editor
        .hass=${hass}
        entityId="climate.test"
        kind=${kind}
        .feature=${feature}
      ></mt-climate-feature-editor>`
    );
    return el;
  }

  it('_values() returns hvac_modes for kind=hvac', async () => {
    const el = await mount('hvac');
    expect((el as any)._values()).to.deep.equal([
      'off',
      'cool',
      'heat',
      'heat_cool',
      'auto',
      'dry',
      'fan_only',
    ]);
  });

  it('_values() returns fan_modes for kind=fan', async () => {
    const el = await mount('fan');
    expect((el as any)._values()).to.deep.equal(['auto', 'low', 'medium', 'high']);
  });

  it('_values() returns swing_modes for kind=swing', async () => {
    const el = await mount('swing');
    expect((el as any)._values()).to.deep.equal(['off', 'vertical', 'horizontal', 'both']);
  });

  it('_values() returns preset_modes for kind=preset', async () => {
    const el = await mount(
      'preset',
      { type: 'climate-preset-modes' },
      { 'climate.test': climateState({ preset_modes: ['none', 'eco', 'away'] }) }
    );
    expect((el as any)._values()).to.deep.equal(['none', 'eco', 'away']);
  });

  it('_values() empty when no state -> renders the hint', async () => {
    const el = await mount('hvac', { type: 'climate-hvac-modes' }, {});
    expect((el as any)._values()).to.deep.equal([]);
    expect(el.shadowRoot!.querySelector('p.hint')).to.not.equal(null);
    expect(el.shadowRoot!.querySelector('.options')).to.equal(null);
  });

  it('_values() empty array when fan attribute missing (?? fallback)', async () => {
    const el = await mount(
      'fan',
      { type: 'climate-fan-modes' },
      { 'climate.test': climateState({ fan_modes: undefined }) }
    );
    expect((el as any)._values()).to.deep.equal([]);
  });

  it('_values() empty array when hvac attribute missing (?? fallback)', async () => {
    const el = await mount(
      'hvac',
      { type: 'climate-hvac-modes' },
      { 'climate.test': climateState({ hvac_modes: undefined }) }
    );
    expect((el as any)._values()).to.deep.equal([]);
  });

  it('_values() empty array when swing attribute missing (?? fallback)', async () => {
    const el = await mount(
      'swing',
      { type: 'climate-swing-modes' },
      { 'climate.test': climateState({ swing_modes: undefined }) }
    );
    expect((el as any)._values()).to.deep.equal([]);
  });

  it('renders one option row per value', async () => {
    const el = await mount('fan', { type: 'climate-fan-modes' });
    expect(el.shadowRoot!.querySelectorAll('.opt').length).to.equal(4);
  });

  it('Title field sets the feature label', async () => {
    const el = await mount('fan', { type: 'climate-fan-modes' });
    const cap = captureEvents('feature-changed');
    const titleTf = el.shadowRoot!.querySelector('.editor > mt-text-field') as Element;
    emitValueChanged(titleTf, 'Fan speed');
    cap.stop();
    expect((cap.events[0].detail as any).feature.label).to.equal('Fan speed');
  });

  it('Title field emptied prunes the label to undefined', async () => {
    const el = await mount('fan', { type: 'climate-fan-modes', label: 'Fan speed' });
    const cap = captureEvents('feature-changed');
    const titleTf = el.shadowRoot!.querySelector('.editor > mt-text-field') as Element;
    emitValueChanged(titleTf, '');
    cap.stop();
    expect((cap.events[0].detail as any).feature.label).to.equal(undefined);
  });

  it('previews each option default icon in its icon pill', async () => {
    const el = await mount('fan', { type: 'climate-fan-modes' });
    const field = el.shadowRoot!.querySelector('.opt .opt-icon') as any;
    // 'auto' is the first fan option → fanIcon('auto') = 'mdi:fan-auto'
    expect(field.defaultIcon).to.equal('mdi:fan-auto');
  });

  describe('reordering', () => {
    it('_orderedValues defaults to the natural value order', async () => {
      const el = await mount(
        'hvac',
        { type: 'climate-hvac-modes' },
        { 'climate.test': climateState({ hvac_modes: ['off', 'cool', 'heat'] }) }
      );
      expect((el as any)._orderedValues()).to.deep.equal(['off', 'cool', 'heat']);
    });

    it('_orderedValues reflects a preset feature.order', async () => {
      const el = await mount(
        'hvac',
        { type: 'climate-hvac-modes', order: ['heat', 'off'] },
        { 'climate.test': climateState({ hvac_modes: ['off', 'cool', 'heat'] }) }
      );
      expect((el as any)._orderedValues()).to.deep.equal(['heat', 'off', 'cool']);
    });

    it('_moveOption (0 → 2) emits feature-changed with the reordered order list', async () => {
      const el = await mount(
        'hvac',
        { type: 'climate-hvac-modes' },
        { 'climate.test': climateState({ hvac_modes: ['off', 'cool', 'heat'] }) }
      );
      const cap = captureEvents('feature-changed');
      (el as any)._moveOption(new CustomEvent('item-moved', { detail: { oldIndex: 0, newIndex: 2 } }));
      cap.stop();
      expect((cap.events[0].detail as any).feature.order).to.deep.equal(['cool', 'heat', 'off']);
    });

    // Regression: the options list is nested inside the outer features
    // ha-sortable; its composed+bubbling item-moved must be stopped or it would
    // also reorder the FEATURE (and collapse the panel) instead of the options.
    it('_moveOption stops the event so it cannot reach the outer features sortable', async () => {
      const el = await mount(
        'hvac',
        { type: 'climate-hvac-modes' },
        { 'climate.test': climateState({ hvac_modes: ['off', 'cool', 'heat'] }) }
      );
      const ev = new CustomEvent('item-moved', { detail: { oldIndex: 0, newIndex: 1 } });
      let stopped = false;
      ev.stopPropagation = () => {
        stopped = true;
      };
      (el as any)._moveOption(ev);
      expect(stopped).to.be.true;
    });
  });

  it('_override finds an existing override', async () => {
    const el = await mount('hvac', {
      type: 'climate-hvac-modes',
      options: [{ value: 'cool', label: 'Chill' }],
    });
    expect((el as any)._override('cool')).to.deep.equal({ value: 'cool', label: 'Chill' });
    expect((el as any)._override('heat')).to.equal(undefined);
  });

  it('display toggle change -> feature-changed {display}', async () => {
    const el = await mount('hvac', { type: 'climate-hvac-modes' });
    const cap = captureEvents('feature-changed');
    emitValueChanged(el.shadowRoot!.querySelector('mt-display-toggle')!, 'dropdown');
    cap.stop();
    expect((cap.events[0].detail as any).feature.display).to.equal('dropdown');
  });

  it('width-field change -> feature-changed {width}', async () => {
    const el = await mount('hvac', { type: 'climate-hvac-modes' });
    const cap = captureEvents('feature-changed');
    el.shadowRoot!.querySelector('mt-width-field')!.dispatchEvent(
      new CustomEvent('width-changed', { detail: { value: 6 }, bubbles: true, composed: true })
    );
    cap.stop();
    expect((cap.events[0].detail as any).feature.width).to.equal(6);
  });

  describe('_setOverride', () => {
    it('adds an override when setting a label', async () => {
      const el = await mount('hvac', { type: 'climate-hvac-modes' });
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('cool', { label: 'Chill' });
      cap.stop();
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([
        { value: 'cool', label: 'Chill' },
      ]);
    });

    it('label="" prunes a non-meaningful new override (empty options)', async () => {
      const el = await mount('hvac', { type: 'climate-hvac-modes' });
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('cool', { label: '' });
      cap.stop();
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([]);
    });

    it('sets an icon override', async () => {
      const el = await mount('hvac', { type: 'climate-hvac-modes' });
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('heat', { icon: 'mdi:fire' });
      cap.stop();
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([
        { value: 'heat', icon: 'mdi:fire' },
      ]);
    });

    it('icon="" is kept as an explicit "no icon" override', async () => {
      const el = await mount('hvac', {
        type: 'climate-hvac-modes',
        options: [{ value: 'heat', icon: 'mdi:fire' }],
      });
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('heat', { icon: '' });
      cap.stop();
      // '' = "no icon" — meaningful, so the override persists
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([
        { value: 'heat', icon: '' },
      ]);
    });

    it('icon=undefined reverts to the default (prunes the override)', async () => {
      const el = await mount('hvac', {
        type: 'climate-hvac-modes',
        options: [{ value: 'heat', icon: 'mdi:fire' }],
      });
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('heat', { icon: undefined });
      cap.stop();
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([]);
    });

    it('hide toggle on adds hide; off prunes', async () => {
      const el = await mount('hvac', { type: 'climate-hvac-modes' });
      const cap1 = captureEvents('feature-changed');
      (el as any)._setOverride('dry', { hide: true });
      cap1.stop();
      expect((cap1.events[0].detail as any).feature.options).to.deep.equal([
        { value: 'dry', hide: true },
      ]);

      const el2 = await mount('hvac', {
        type: 'climate-hvac-modes',
        options: [{ value: 'dry', hide: true }],
      });
      const cap2 = captureEvents('feature-changed');
      (el2 as any)._setOverride('dry', { hide: false });
      cap2.stop();
      expect((cap2.events[0].detail as any).feature.options).to.deep.equal([]);
    });

    it('updates an existing override (keeps label, sets icon)', async () => {
      const el = await mount('hvac', {
        type: 'climate-hvac-modes',
        options: [{ value: 'cool', label: 'Chill' }],
      });
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('cool', { icon: 'mdi:snowflake' });
      cap.stop();
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([
        { value: 'cool', label: 'Chill', icon: 'mdi:snowflake' },
      ]);
    });

    it('option label field drives _setOverride', async () => {
      const el = await mount('fan', { type: 'climate-fan-modes' });
      const cap = captureEvents('feature-changed');
      const tf = el.shadowRoot!.querySelector('.opt .opt-label') as Element;
      emitValueChanged(tf, 'Quiet');
      cap.stop();
      const opt = (cap.events[0].detail as any).feature.options[0];
      expect(opt.label).to.equal('Quiet');
    });

    it('option icon picker value-changed drives _setOverride', async () => {
      const el = await mount('fan', { type: 'climate-fan-modes' });
      const cap = captureEvents('feature-changed');
      const ip = el.shadowRoot!.querySelector('.opt .opt-icon') as Element;
      emitValueChanged(ip, 'mdi:fan');
      cap.stop();
      expect((cap.events[0].detail as any).feature.options[0].icon).to.equal('mdi:fan');
    });

    it('option icon picker with undefined detail coerces to "" (prunes)', async () => {
      const el = await mount('fan', { type: 'climate-fan-modes' });
      const cap = captureEvents('feature-changed');
      const ip = el.shadowRoot!.querySelector('.opt .opt-icon') as Element;
      emitValueChanged(ip, undefined);
      cap.stop();
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([]);
    });

    it('hide button click drives _setOverride', async () => {
      const el = await mount('fan', { type: 'climate-fan-modes' });
      const cap = captureEvents('feature-changed');
      (el.shadowRoot!.querySelector('.opt .opt-hide') as HTMLButtonElement).click();
      cap.stop();
      expect((cap.events[0].detail as any).feature.options[0].hide).to.equal(true);
    });

    it('renders an already-hidden option with the eye-off state', async () => {
      const el = await mount('fan', {
        type: 'climate-fan-modes',
        options: [{ value: 'auto', hide: true }],
      });
      const hideBtn = el.shadowRoot!.querySelector('.opt .opt-hide')!;
      expect(hideBtn.classList.contains('on')).to.be.true;
    });
  });
});

// ---------------------------------------------------------------------------
// G) input-select-editor.ts
// ---------------------------------------------------------------------------
describe('mt-input-select-editor', () => {
  /** Mount the input-select editor. */
  async function mount(
    feature: InputSelectFeatureConfig,
    states: Record<string, any> = {}
  ): Promise<MtInputSelectEditor> {
    const hass = makeHass(states);
    return fixture<MtInputSelectEditor>(
      html`<mt-input-select-editor
        .hass=${hass}
        .feature=${feature}
      ></mt-input-select-editor>`
    );
  }

  const withOptions = (entity = 'input_select.mode') =>
    mount(
      { type: 'input-select', entity },
      {
        [entity]: entityState(entity, 'home', { options: ['home', 'away', 'sleep'] }),
      }
    );

  it('_values() reads options from the bound entity', async () => {
    const el = await withOptions();
    expect((el as any)._values()).to.deep.equal(['home', 'away', 'sleep']);
  });

  it('_values() empty -> hint shown', async () => {
    const el = await mount({ type: 'input-select', entity: '' });
    expect((el as any)._values()).to.deep.equal([]);
    expect(el.shadowRoot!.querySelector('p.hint')).to.not.equal(null);
  });

  it('entity-picker value falls back to "" when feature.entity is undefined', async () => {
    const el = await mount({ type: 'input-select' } as InputSelectFeatureConfig);
    const picker = el.shadowRoot!.querySelector('mt-entity-picker') as any;
    expect(picker.value).to.equal('');
  });

  it('renders an option row per value', async () => {
    const el = await withOptions();
    expect(el.shadowRoot!.querySelectorAll('.opt').length).to.equal(3);
  });

  describe('reordering', () => {
    it('_orderedValues defaults to the natural option order', async () => {
      const el = await withOptions();
      expect((el as any)._orderedValues()).to.deep.equal(['home', 'away', 'sleep']);
    });

    it('_orderedValues reflects a preset feature.order', async () => {
      const el = await mount(
        { type: 'input-select', entity: 'input_select.mode', order: ['sleep', 'home'] },
        {
          'input_select.mode': entityState('input_select.mode', 'home', {
            options: ['home', 'away', 'sleep'],
          }),
        }
      );
      expect((el as any)._orderedValues()).to.deep.equal(['sleep', 'home', 'away']);
    });

    it('_moveOption (0 → 2) emits feature-changed with the reordered order list', async () => {
      const el = await withOptions();
      const cap = captureEvents('feature-changed');
      (el as any)._moveOption(new CustomEvent('item-moved', { detail: { oldIndex: 0, newIndex: 2 } }));
      cap.stop();
      expect((cap.events[0].detail as any).feature.order).to.deep.equal(['away', 'sleep', 'home']);
    });

    it('_moveOption stops the event so it cannot reach the outer features sortable', async () => {
      const el = await withOptions();
      const ev = new CustomEvent('item-moved', { detail: { oldIndex: 0, newIndex: 1 } });
      let stopped = false;
      ev.stopPropagation = () => {
        stopped = true;
      };
      (el as any)._moveOption(ev);
      expect(stopped).to.be.true;
    });
  });

  it('entity-picker change -> feature-changed {entity}', async () => {
    const el = await mount({ type: 'input-select', entity: '' });
    const cap = captureEvents('feature-changed');
    emitValueChanged(el.shadowRoot!.querySelector('mt-entity-picker')!, 'input_select.x');
    cap.stop();
    expect((cap.events[0].detail as any).feature.entity).to.equal('input_select.x');
  });

  it('label input non-empty -> feature-changed {label}', async () => {
    const el = await withOptions();
    const cap = captureEvents('feature-changed');
    const tf = el.shadowRoot!.querySelector('mt-text-field') as Element; // first = row label
    emitValueChanged(tf, 'Mode');
    cap.stop();
    expect((cap.events[0].detail as any).feature.label).to.equal('Mode');
  });

  it('label input empty -> {label: undefined}', async () => {
    const el = await withOptions();
    const cap = captureEvents('feature-changed');
    const tf = el.shadowRoot!.querySelector('mt-text-field') as Element;
    emitValueChanged(tf, '');
    cap.stop();
    expect((cap.events[0].detail as any).feature.label).to.equal(undefined);
  });

  it('display toggle change -> {display}', async () => {
    const el = await withOptions();
    const cap = captureEvents('feature-changed');
    emitValueChanged(el.shadowRoot!.querySelector('mt-display-toggle')!, 'dropdown');
    cap.stop();
    expect((cap.events[0].detail as any).feature.display).to.equal('dropdown');
  });

  it('width change -> {width}', async () => {
    const el = await withOptions();
    const cap = captureEvents('feature-changed');
    el.shadowRoot!.querySelector('mt-width-field')!.dispatchEvent(
      new CustomEvent('width-changed', { detail: { value: 4 }, bubbles: true, composed: true })
    );
    cap.stop();
    expect((cap.events[0].detail as any).feature.width).to.equal(4);
  });

  it('_override finds existing override', async () => {
    const el = await mount(
      { type: 'input-select', entity: 'input_select.mode', options: [{ value: 'home', label: 'H' }] },
      { 'input_select.mode': entityState('input_select.mode', 'home', { options: ['home'] }) }
    );
    expect((el as any)._override('home')).to.deep.equal({ value: 'home', label: 'H' });
  });

  describe('_setOverride', () => {
    it('adds a label override', async () => {
      const el = await withOptions();
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('home', { label: 'Home!' });
      cap.stop();
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([
        { value: 'home', label: 'Home!' },
      ]);
    });

    it('label="" prunes new override', async () => {
      const el = await withOptions();
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('home', { label: '' });
      cap.stop();
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([]);
    });

    it('updates an existing override and keeps it meaningful', async () => {
      const el = await mount(
        {
          type: 'input-select',
          entity: 'input_select.mode',
          options: [{ value: 'away', label: 'Away' }],
        },
        { 'input_select.mode': entityState('input_select.mode', 'home', { options: ['away'] }) }
      );
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('away', { icon: 'mdi:home' });
      cap.stop();
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([
        { value: 'away', label: 'Away', icon: 'mdi:home' },
      ]);
    });

    it('keeps icon="" (no icon) but prunes on icon=undefined (revert to default)', async () => {
      const el = await mount(
        {
          type: 'input-select',
          entity: 'input_select.mode',
          options: [{ value: 'away', icon: 'mdi:home' }],
        },
        { 'input_select.mode': entityState('input_select.mode', 'home', { options: ['away'] }) }
      );
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('away', { icon: '' });
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([
        { value: 'away', icon: '' },
      ]);
      (el as any)._setOverride('away', { icon: undefined });
      cap.stop();
      expect((cap.events[1].detail as any).feature.options).to.deep.equal([]);
    });

    it('hide toggle on/off', async () => {
      const el = await withOptions();
      const cap = captureEvents('feature-changed');
      (el as any)._setOverride('sleep', { hide: true });
      cap.stop();
      expect((cap.events[0].detail as any).feature.options).to.deep.equal([
        { value: 'sleep', hide: true },
      ]);
    });

    it('option label/icon/hide controls in a rendered row drive _setOverride', async () => {
      const el = await withOptions();
      // per-option label fields are within .opt; first .opt label field
      const optTf = el.shadowRoot!.querySelectorAll('.opt mt-text-field')[0] as Element;
      const cap1 = captureEvents('feature-changed');
      emitValueChanged(optTf, 'Casa');
      cap1.stop();
      expect((cap1.events[0].detail as any).feature.options[0].label).to.equal('Casa');

      const optIcon = el.shadowRoot!.querySelector('.opt mt-icon-field') as Element;
      const cap2 = captureEvents('feature-changed');
      emitValueChanged(optIcon, 'mdi:home');
      cap2.stop();
      expect((cap2.events[0].detail as any).feature.options[0].icon).to.equal('mdi:home');

      const optIcon2 = el.shadowRoot!.querySelector('.opt mt-icon-field') as Element;
      const cap3 = captureEvents('feature-changed');
      emitValueChanged(optIcon2, undefined);
      cap3.stop();
      expect((cap3.events[0].detail as any).feature.options).to.deep.equal([]);

      const hideBtn = el.shadowRoot!.querySelector('.opt .opt-hide') as HTMLButtonElement;
      const cap4 = captureEvents('feature-changed');
      hideBtn.click();
      cap4.stop();
      expect((cap4.events[0].detail as any).feature.options[0].hide).to.equal(true);
    });

    it('renders an already-hidden option', async () => {
      const el = await mount(
        {
          type: 'input-select',
          entity: 'input_select.mode',
          options: [{ value: 'home', hide: true }],
        },
        { 'input_select.mode': entityState('input_select.mode', 'home', { options: ['home'] }) }
      );
      expect(el.shadowRoot!.querySelector('.opt .opt-hide')!.classList.contains('on')).to.be.true;
    });
  });
});

// ---------------------------------------------------------------------------
// H) entity-list-editor.ts
// ---------------------------------------------------------------------------
describe('mt-entity-list-editor', () => {
  /** Mount the entity-list editor. */
  async function mount(opts: {
    feature: any;
    itemsKey?: 'entities' | 'items';
    showDisplay?: boolean;
  }): Promise<MtEntityListEditor> {
    const hass = makeHass({});
    const { feature, itemsKey = 'entities', showDisplay = false } = opts;
    return fixture<MtEntityListEditor>(
      html`<mt-entity-list-editor
        .hass=${hass}
        .feature=${feature}
        itemsKey=${itemsKey}
        .showDisplay=${showDisplay}
        .includeDomains=${['switch']}
      ></mt-entity-list-editor>`
    );
  }

  it('_items reads from itemsKey "entities"', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: 'switch.a' }] },
      itemsKey: 'entities',
    });
    expect((el as any)._items).to.deep.equal([{ entity: 'switch.a' }]);
  });

  it('_items reads from itemsKey "items"', async () => {
    const el = await mount({
      feature: { type: 'button-list', items: [{ entity: 'button.b' }] },
      itemsKey: 'items',
    });
    expect((el as any)._items).to.deep.equal([{ entity: 'button.b' }]);
  });

  it('_items defaults to [] when missing', async () => {
    const el = await mount({ feature: { type: 'switch-list' }, itemsKey: 'entities' });
    expect((el as any)._items).to.deep.equal([]);
  });

  it('item entity picker value falls back to "" when item.entity is undefined', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{}] },
    });
    const picker = el.shadowRoot!.querySelector('.item mt-entity-picker') as any;
    expect(picker.value).to.equal('');
  });

  it('showDisplay true shows the display toggle', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [] },
      showDisplay: true,
    });
    expect(el.shadowRoot!.querySelector('mt-display-toggle')).to.not.equal(null);
  });

  it('showDisplay false hides the display toggle', async () => {
    const el = await mount({ feature: { type: 'switch-list', entities: [] }, showDisplay: false });
    expect(el.shadowRoot!.querySelector('mt-display-toggle')).to.equal(null);
  });

  it('display toggle change -> feature-changed {display}', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [], display: 'icons' },
      showDisplay: true,
    });
    const cap = captureEvents('feature-changed');
    emitValueChanged(el.shadowRoot!.querySelector('mt-display-toggle')!, 'dropdown');
    cap.stop();
    expect((cap.events[0].detail as any).feature.display).to.equal('dropdown');
  });

  it('label input -> {label} (empty -> undefined)', async () => {
    const el = await mount({ feature: { type: 'switch-group', entities: [] } });
    const cap = captureEvents('feature-changed');
    const tf = el.shadowRoot!.querySelector('mt-text-field') as Element; // row label
    emitValueChanged(tf, 'Lights');
    expect((cap.events[0].detail as any).feature.label).to.equal('Lights');
    emitValueChanged(tf, '');
    cap.stop();
    expect((cap.events[1].detail as any).feature.label).to.equal(undefined);
  });

  it('width change -> {width}', async () => {
    const el = await mount({ feature: { type: 'switch-group', entities: [] } });
    const cap = captureEvents('feature-changed');
    el.shadowRoot!.querySelector('mt-width-field')!.dispatchEvent(
      new CustomEvent('width-changed', { detail: { value: 8 }, bubbles: true, composed: true })
    );
    cap.stop();
    expect((cap.events[0].detail as any).feature.width).to.equal(8);
  });

  it('_addItem appends {entity:""} using the right itemsKey', async () => {
    const el = await mount({
      feature: { type: 'button-list', items: [{ entity: 'button.a' }] },
      itemsKey: 'items',
    });
    const cap = captureEvents('feature-changed');
    (el as any)._addItem();
    cap.stop();
    expect((cap.events[0].detail as any).feature.items).to.deep.equal([
      { entity: 'button.a' },
      { entity: '' },
    ]);
  });

  it('Add entity button triggers _addItem', async () => {
    const el = await mount({ feature: { type: 'switch-group', entities: [] } });
    const cap = captureEvents('feature-changed');
    (el.shadowRoot!.querySelector('ha-button') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true })
    );
    cap.stop();
    expect((cap.events[0].detail as any).feature.entities).to.deep.equal([{ entity: '' }]);
  });

  it('_updateItem sets entity', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: '' }] },
    });
    const cap = captureEvents('feature-changed');
    (el as any)._updateItem(0, { entity: 'switch.x' });
    cap.stop();
    expect((cap.events[0].detail as any).feature.entities[0].entity).to.equal('switch.x');
  });

  it('_updateItem prunes an empty label but keeps icon="" as "no icon"', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: 'switch.x', label: 'L', icon: 'i' }] },
    });
    const cap = captureEvents('feature-changed');
    (el as any)._updateItem(0, { label: '', icon: '' });
    cap.stop();
    expect((cap.events[0].detail as any).feature.entities[0]).to.deep.equal({
      entity: 'switch.x',
      icon: '',
    });
  });

  it('_updateItem with icon=undefined reverts to the default (prunes the key)', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: 'switch.x', icon: '' }] },
    });
    const cap = captureEvents('feature-changed');
    (el as any)._updateItem(0, { icon: undefined });
    cap.stop();
    expect((cap.events[0].detail as any).feature.entities[0]).to.deep.equal({ entity: 'switch.x' });
  });

  it('item pickers/inputs drive _updateItem', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: 'switch.x' }] },
    });
    const picker = el.shadowRoot!.querySelector('.item mt-entity-picker') as Element;
    const cap1 = captureEvents('feature-changed');
    emitValueChanged(picker, 'switch.y');
    cap1.stop();
    expect((cap1.events[0].detail as any).feature.entities[0].entity).to.equal('switch.y');

    const labelTf = el.shadowRoot!.querySelector('.item mt-text-field') as Element;
    const cap2 = captureEvents('feature-changed');
    emitValueChanged(labelTf, 'Lamp');
    cap2.stop();
    expect((cap2.events[0].detail as any).feature.entities[0].label).to.equal('Lamp');

    const iconPicker = el.shadowRoot!.querySelector('.item mt-icon-field') as Element;
    const cap3 = captureEvents('feature-changed');
    emitValueChanged(iconPicker, 'mdi:lamp');
    cap3.stop();
    expect((cap3.events[0].detail as any).feature.entities[0].icon).to.equal('mdi:lamp');

    const cap4 = captureEvents('feature-changed');
    emitValueChanged(iconPicker, undefined); // undefined -> revert to default (pruned)
    cap4.stop();
    expect((cap4.events[0].detail as any).feature.entities[0].icon).to.equal(undefined);
  });

  it("previews the entity's own icon as the icon pill default", async () => {
    const hass = makeHass({ 'switch.x': entityState('switch.x', 'on', { icon: 'mdi:lamp' }) });
    const el = await fixture<MtEntityListEditor>(
      html`<mt-entity-list-editor
        .hass=${hass}
        .feature=${{ type: 'switch-group', entities: [{ entity: 'switch.x' }] }}
        itemsKey="entities"
        .includeDomains=${['switch']}
      ></mt-entity-list-editor>`
    );
    const field = el.shadowRoot!.querySelector('.item mt-icon-field') as any;
    expect(field.defaultIcon).to.equal('mdi:lamp');
  });

  it('_moveItem reorders the list (0 → 2 gives [b, c, a])', async () => {
    const el = await mount({
      feature: {
        type: 'switch-group',
        entities: [{ entity: 'switch.a' }, { entity: 'switch.b' }, { entity: 'switch.c' }],
      },
      itemsKey: 'entities',
    });
    const cap = captureEvents('feature-changed');
    (el as any)._moveItem(new CustomEvent('item-moved', { detail: { oldIndex: 0, newIndex: 2 } }));
    cap.stop();
    expect((cap.events[0].detail as any).feature.entities).to.deep.equal([
      { entity: 'switch.b' },
      { entity: 'switch.c' },
      { entity: 'switch.a' },
    ]);
  });

  it('_moveItem stops the event so it cannot reach the outer features sortable', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: 'switch.a' }, { entity: 'switch.b' }] },
      itemsKey: 'entities',
    });
    const ev = new CustomEvent('item-moved', { detail: { oldIndex: 0, newIndex: 1 } });
    let stopped = false;
    ev.stopPropagation = () => {
      stopped = true;
    };
    (el as any)._moveItem(ev);
    expect(stopped).to.be.true;
  });

  it('_removeItem removes by index', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: 'a' }, { entity: 'b' }] },
    });
    const cap = captureEvents('feature-changed');
    (el as any)._removeItem(0);
    cap.stop();
    expect((cap.events[0].detail as any).feature.entities).to.deep.equal([{ entity: 'b' }]);
  });

  it('delete button triggers _removeItem', async () => {
    const el = await mount({
      feature: { type: 'switch-group', entities: [{ entity: 'a' }] },
    });
    const cap = captureEvents('feature-changed');
    (el.shadowRoot!.querySelector('.item .del') as HTMLButtonElement).click();
    cap.stop();
    expect((cap.events[0].detail as any).feature.entities).to.deep.equal([]);
  });
});

// ---------------------------------------------------------------------------
// I) entity-tile-editor.ts
// ---------------------------------------------------------------------------
describe('mt-entity-tile-editor', () => {
  /** Mount the entity-tile editor. */
  async function mount(feature: any): Promise<MtEntityTileEditor> {
    const hass = makeHass({});
    return fixture<MtEntityTileEditor>(
      html`<mt-entity-tile-editor .hass=${hass} .feature=${feature}></mt-entity-tile-editor>`
    );
  }

  it('_data getter reflects the feature with compact default false (no width in the form)', async () => {
    const el = await mount({ type: 'entity-tile', entity: 'sensor.x' });
    expect((el as any)._data).to.deep.equal({
      entity: 'sensor.x',
      name: undefined,
      icon: undefined,
      compact: false,
      tap_action: undefined,
    });
  });

  it('_data getter reflects all fields when set', async () => {
    const el = await mount({
      type: 'entity-tile',
      entity: 'sensor.x',
      name: 'X',
      icon: 'mdi:home',
      compact: true,
      tap_action: { action: 'more-info' },
    });
    const d = (el as any)._data;
    expect(d.compact).to.equal(true);
    expect(d.tap_action).to.deep.equal({ action: 'more-info' });
  });

  it('_computeLabel covers each case', async () => {
    const el = await mount({ type: 'entity-tile', entity: '' });
    const cl = (el as any)._computeLabel;
    expect(cl({ name: 'entity' })).to.equal('Entity');
    expect(cl({ name: 'name' })).to.contain('Name');
    expect(cl({ name: 'icon' })).to.contain('Icon');
    expect(cl({ name: 'compact' })).to.contain('Compact');
    expect(cl({ name: 'tap_action' })).to.equal('Tap action');
    expect(cl({ name: 'mystery' })).to.equal('mystery');
  });

  it('_changed emits a normalized feature (falsy -> undefined), preserving width', async () => {
    const el = await mount({ type: 'entity-tile', entity: 'sensor.x', width: 50 });
    const cap = captureEvents('feature-changed');
    emitValueChanged(el.shadowRoot!.querySelector('ha-form')!, {
      entity: 'sensor.y',
      name: '',
      icon: '',
      compact: false,
      tap_action: undefined,
    });
    cap.stop();
    // _changed spreads the existing feature then the form patch (width untouched)
    expect((cap.events[0].detail as any).feature).to.deep.equal({
      type: 'entity-tile',
      entity: 'sensor.y',
      name: undefined,
      icon: undefined,
      compact: undefined,
      width: 50,
      tap_action: undefined,
    });
  });

  it('_changed keeps truthy values', async () => {
    const el = await mount({ type: 'entity-tile', entity: 'sensor.x' });
    const cap = captureEvents('feature-changed');
    emitValueChanged(el.shadowRoot!.querySelector('ha-form')!, {
      entity: 'sensor.z',
      name: 'Tile',
      icon: 'mdi:lamp',
      compact: true,
      tap_action: { action: 'toggle' },
    });
    cap.stop();
    expect((cap.events[0].detail as any).feature).to.deep.equal({
      type: 'entity-tile',
      entity: 'sensor.z',
      name: 'Tile',
      icon: 'mdi:lamp',
      compact: true,
      tap_action: { action: 'toggle' },
    });
  });

  it('renders a width field with the tile default (50) and emits width changes', async () => {
    const el = await mount({ type: 'entity-tile', entity: 'sensor.x' });
    const wf = el.shadowRoot!.querySelector('mt-width-field') as any;
    expect(wf).to.not.equal(null);
    expect(wf.default).to.equal(50);
    const cap = captureEvents('feature-changed');
    wf.dispatchEvent(
      new CustomEvent('width-changed', { detail: { value: 30 }, bubbles: true, composed: true })
    );
    cap.stop();
    expect((cap.events[0].detail as any).feature.width).to.equal(30);
  });
});

// ---------------------------------------------------------------------------
// J) comfort-editor.ts
// ---------------------------------------------------------------------------
describe('mt-comfort-editor', () => {
  /** Mount the comfort editor. */
  async function mount(feature: any, feelsLikeConfigured = true): Promise<MtComfortEditor> {
    const hass = makeHass({});
    return fixture<MtComfortEditor>(
      html`<mt-comfort-editor
        .hass=${hass}
        .feature=${feature}
        .feelsLikeConfigured=${feelsLikeConfigured}
      ></mt-comfort-editor>`
    );
  }

  it('_data defaults show_target_eta to false', async () => {
    const el = await mount({ type: 'comfort' });
    expect((el as any)._data).to.deep.equal({
      show_target_eta: false,
    });
  });

  it('_data reflects set values', async () => {
    const el = await mount({
      type: 'comfort',
      show_target_eta: true,
    });
    expect((el as any)._data).to.deep.equal({
      show_target_eta: true,
    });
  });

  it('_computeLabel covers each field', async () => {
    const cl = (await mount({ type: 'comfort' }) as any)._computeLabel;
    expect(cl({ name: 'show_target_eta' })).to.contain('target temperature');
    expect(cl({ name: 'mystery' })).to.equal('mystery');
  });

  it('warns when feels-like sensors are not configured', async () => {
    const warn = await mount({ type: 'comfort' }, false);
    expect(warn.shadowRoot!.querySelector('.warn')).to.not.equal(null);
    const ok = await mount({ type: 'comfort' }, true);
    expect(ok.shadowRoot!.querySelector('.warn')).to.equal(null);
  });

  it('_changed emits a normalized feature (falsy show_target_eta -> undefined)', async () => {
    const el = await mount({ type: 'comfort', width: 40 });
    const cap = captureEvents('feature-changed');
    emitValueChanged(el.shadowRoot!.querySelector('ha-form')!, {
      show_target_eta: false,
    });
    cap.stop();
    expect((cap.events[0].detail as any).feature).to.deep.equal({
      type: 'comfort',
      width: 40,
      show_target_eta: undefined,
    });
  });

  it('emits width changes via the width field', async () => {
    const el = await mount({ type: 'comfort' });
    const cap = captureEvents('feature-changed');
    el.shadowRoot!.querySelector('mt-width-field')!.dispatchEvent(
      new CustomEvent('width-changed', { detail: { value: 70 }, bubbles: true, composed: true })
    );
    cap.stop();
    expect((cap.events[0].detail as any).feature.width).to.equal(70);
  });
});
