import { fixture, html, expect, aTimeout } from '@open-wc/testing';
import { makeHass, climateState, entityState } from '../helpers';
import type { TestHass } from '../helpers';
import '../../src/features/feature-row';
import type { MtFeatureRow } from '../../src/features/feature-row';
import type { FeatureConfig } from '../../src/types';

/**
 * Mount an mt-feature-row.
 * @param hass the fake hass
 * @param feature the feature config
 * @param props sizing props (span) + entityId
 */
async function mount(
  hass: TestHass,
  feature: FeatureConfig,
  props: {
    entityId?: string;
    span?: number;
  } = {}
): Promise<MtFeatureRow> {
  const { entityId = 'climate.test', span } = props;
  return fixture<MtFeatureRow>(
    html`<mt-feature-row
      .hass=${hass}
      entityId=${entityId}
      .feature=${feature}
      .span=${span}
    ></mt-feature-row>`
  );
}

describe('mt-feature-row', () => {
  describe('willUpdate column span', () => {
    it('applies the span to the host grid-column', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await mount(hass, { type: 'climate-hvac-modes' }, { span: 5 });
      expect(el.style.gridColumn).to.equal('span 5');
    });

    it('clamps a span of 0 to span 1', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await mount(hass, { type: 'climate-hvac-modes' }, { span: 0 });
      expect(el.style.gridColumn).to.equal('span 1');
    });

    it('updates the span when it changes', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await mount(hass, { type: 'climate-hvac-modes' }, { span: 3 });
      el.span = 9;
      await el.updateComplete;
      expect(el.style.gridColumn).to.equal('span 9');
    });

    it('does not re-touch grid-column when an unrelated property changes', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await mount(hass, { type: 'climate-hvac-modes' }, { span: 5 });
      el.style.gridColumn = '';
      el.entityId = 'climate.other';
      await el.updateComplete;
      expect(el.style.gridColumn).to.equal('');
    });
  });

  describe('render dispatch by feature type', () => {
    it('climate-hvac-modes -> mt-climate-selector kind=hvac', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await mount(hass, { type: 'climate-hvac-modes' });
      const child = el.shadowRoot!.querySelector('mt-climate-selector') as any;
      expect(child).to.not.equal(null);
      expect(child.kind).to.equal('hvac');
    });

    it('climate-fan-modes -> mt-climate-selector kind=fan', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await mount(hass, { type: 'climate-fan-modes' });
      const child = el.shadowRoot!.querySelector('mt-climate-selector') as any;
      expect(child).to.not.equal(null);
      expect(child.kind).to.equal('fan');
    });

    it('climate-swing-modes -> mt-climate-selector kind=swing', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await mount(hass, { type: 'climate-swing-modes' });
      const child = el.shadowRoot!.querySelector('mt-climate-selector') as any;
      expect(child).to.not.equal(null);
      expect(child.kind).to.equal('swing');
    });

    it('climate-preset-modes -> mt-climate-selector kind=preset', async () => {
      const hass = makeHass({
        'climate.test': climateState({ preset_modes: ['none', 'eco'] }),
      });
      const el = await mount(hass, { type: 'climate-preset-modes' });
      const child = el.shadowRoot!.querySelector('mt-climate-selector') as any;
      expect(child).to.not.equal(null);
      expect(child.kind).to.equal('preset');
    });

    it('sensor-list -> mt-sensor-list', async () => {
      const hass = makeHass({ 'sensor.x': entityState('sensor.x', '1') });
      const el = await mount(hass, { type: 'sensor-list', items: [{ entity: 'sensor.x' }] });
      expect(el.shadowRoot!.querySelector('mt-sensor-list')).to.not.equal(null);
    });

    it('input-select -> mt-input-select', async () => {
      const hass = makeHass({});
      const el = await mount(hass, { type: 'input-select', entity: 'input_select.x' });
      expect(el.shadowRoot!.querySelector('mt-input-select')).to.not.equal(null);
    });

    it('switch-group -> mt-switch-group', async () => {
      const hass = makeHass({});
      const el = await mount(hass, { type: 'switch-group', entities: [] });
      expect(el.shadowRoot!.querySelector('mt-switch-group')).to.not.equal(null);
    });

    it('switch-list -> mt-switch-list', async () => {
      const hass = makeHass({});
      const el = await mount(hass, { type: 'switch-list', entities: [] });
      expect(el.shadowRoot!.querySelector('mt-switch-list')).to.not.equal(null);
    });

    it('button-list -> mt-button-list', async () => {
      const hass = makeHass({});
      const el = await mount(hass, { type: 'button-list', items: [] });
      expect(el.shadowRoot!.querySelector('mt-button-list')).to.not.equal(null);
    });

    it('entity-tile -> mt-entity-tile (forceOff false when the climate is not off)', async () => {
      const hass = makeHass({
        'climate.test': climateState({}, 'cool'),
        'sensor.x': entityState('sensor.x', '1'),
      });
      const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.x' });
      const tile = el.shadowRoot!.querySelector('mt-entity-tile') as any;
      expect(tile).to.not.equal(null);
      expect(tile.forceOff).to.equal(false);
    });

    it('entity-tile -> forceOff true when the card climate entity is off', async () => {
      const hass = makeHass({
        'climate.test': climateState({}, 'off'),
        'sensor.x': entityState('sensor.x', '1'),
      });
      const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.x' });
      const tile = el.shadowRoot!.querySelector('mt-entity-tile') as any;
      expect(tile.forceOff).to.equal(true);
    });

    it('comfort -> mt-comfort, threading the shared feels-like sensors', async () => {
      const hass = makeHass({
        'climate.test': climateState({ current_temperature: 22 }, 'cool'),
        'sensor.t': entityState('sensor.t', '22'),
        'sensor.h': entityState('sensor.h', '50'),
      });
      const el = await fixture<MtFeatureRow>(
        html`<mt-feature-row
          .hass=${hass}
          entityId="climate.test"
          .feature=${{ type: 'comfort' } as FeatureConfig}
          .feelsLikeTemp=${'sensor.t'}
          .feelsLikeHumidity=${'sensor.h'}
        ></mt-feature-row>`
      );
      const child = el.shadowRoot!.querySelector('mt-comfort') as any;
      expect(child).to.not.equal(null);
      expect(child.tempSensor).to.equal('sensor.t');
      expect(child.humiditySensor).to.equal('sensor.h');
    });

    it('comfort row collapses (host hidden) when the feature reports it is not visible', async () => {
      // Start visible, then make the climate unavailable so mt-comfort fires
      // feature-visibility:false — the row must hide IN RESPONSE to that event,
      // not merely from the initial default (which would pass vacuously).
      const states = {
        'climate.test': climateState({ current_temperature: 25 }, 'cool'),
        'sensor.t': entityState('sensor.t', '25'),
        'sensor.h': entityState('sensor.h', '50'),
      };
      const el = await fixture<MtFeatureRow>(
        html`<mt-feature-row
          .hass=${makeHass(states)}
          entityId="climate.test"
          .feature=${{ type: 'comfort' } as FeatureConfig}
          .feelsLikeTemp=${'sensor.t'}
          .feelsLikeHumidity=${'sensor.h'}
        ></mt-feature-row>`
      );
      await aTimeout(10);
      await el.updateComplete;
      expect(el.hasAttribute('hidden')).to.equal(false); // visible first

      el.hass = makeHass({
        ...states,
        'climate.test': climateState({ current_temperature: 25 }, 'unavailable'),
      });
      await aTimeout(10);
      await el.updateComplete;
      expect(el.hasAttribute('hidden')).to.equal(true); // hid in response to the event
    });

    it('comfort row un-hides once the feature reports it is visible', async () => {
      const hass = makeHass({
        'climate.test': climateState({ current_temperature: 25 }, 'cool'),
        'sensor.t': entityState('sensor.t', '25'),
        'sensor.h': entityState('sensor.h', '50'),
      });
      const el = await fixture<MtFeatureRow>(
        html`<mt-feature-row
          .hass=${hass}
          entityId="climate.test"
          .feature=${{ type: 'comfort' } as FeatureConfig}
          .feelsLikeTemp=${'sensor.t'}
          .feelsLikeHumidity=${'sensor.h'}
        ></mt-feature-row>`
      );
      await aTimeout(10);
      await el.updateComplete;
      expect(el.hasAttribute('hidden')).to.equal(false);
    });

    it('unknown/invalid type -> renders nothing', async () => {
      const hass = makeHass({});
      const el = await mount(hass, { type: 'totally-bogus' } as any);
      // none of the known children should be present
      expect(el.shadowRoot!.querySelector('mt-climate-selector')).to.equal(null);
      expect(el.shadowRoot!.querySelector('mt-input-select')).to.equal(null);
      expect(el.shadowRoot!.querySelector('mt-switch-group')).to.equal(null);
      expect(el.shadowRoot!.querySelector('mt-switch-list')).to.equal(null);
      expect(el.shadowRoot!.querySelector('mt-button-list')).to.equal(null);
      expect(el.shadowRoot!.querySelector('mt-entity-tile')).to.equal(null);
    });
  });
});
