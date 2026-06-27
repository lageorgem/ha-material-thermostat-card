import { fixture, html, expect } from '@open-wc/testing';
import { makeHass, climateState } from '../helpers';
import type { TestHass } from '../helpers';
import '../../src/features/feature-row';
import type { MtFeatureRow } from '../../src/features/feature-row';
import type { FeatureConfig } from '../../src/types';

/**
 * Mount an mt-feature-row.
 * @param hass the fake hass
 * @param feature the feature config
 * @param props grid placement props (row/colStart/span) + entityId
 */
async function mount(
  hass: TestHass,
  feature: FeatureConfig,
  props: {
    entityId?: string;
    row?: number;
    colStart?: number;
    span?: number;
  } = {}
): Promise<MtFeatureRow> {
  const { entityId = 'climate.test', row = 1, colStart = 1, span = 1 } = props;
  return fixture<MtFeatureRow>(
    html`<mt-feature-row
      .hass=${hass}
      entityId=${entityId}
      .feature=${feature}
      .row=${row}
      .colStart=${colStart}
      .span=${span}
    ></mt-feature-row>`
  );
}

describe('mt-feature-row', () => {
  describe('willUpdate grid placement', () => {
    it('sets gridRow and gridColumn from row/colStart/span', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await mount(
        hass,
        { type: 'climate-hvac-modes' },
        { row: 2, colStart: 3, span: 4 }
      );
      expect(el.style.gridRow).to.equal('2');
      expect(el.style.gridColumn).to.equal('3 / span 4');
    });

    it('clamps row/colStart/span to a minimum of 1 (Math.max)', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await mount(
        hass,
        { type: 'climate-hvac-modes' },
        { row: 0, colStart: 0, span: 0 }
      );
      expect(el.style.gridRow).to.equal('1');
      expect(el.style.gridColumn).to.equal('1 / span 1');
    });

    it('updates inline styles when row/colStart/span change', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await mount(
        hass,
        { type: 'climate-hvac-modes' },
        { row: 1, colStart: 1, span: 1 }
      );
      el.row = 5;
      el.colStart = 2;
      el.span = 3;
      await el.updateComplete;
      expect(el.style.gridRow).to.equal('5');
      expect(el.style.gridColumn).to.equal('2 / span 3');
    });

    it('updates styles when only colStart changes', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await mount(
        hass,
        { type: 'climate-hvac-modes' },
        { row: 2, colStart: 1, span: 4 }
      );
      el.colStart = 6;
      await el.updateComplete;
      expect(el.style.gridRow).to.equal('2');
      expect(el.style.gridColumn).to.equal('6 / span 4');
    });

    it('updates styles when only span changes', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await mount(
        hass,
        { type: 'climate-hvac-modes' },
        { row: 2, colStart: 3, span: 1 }
      );
      el.span = 5;
      await el.updateComplete;
      expect(el.style.gridRow).to.equal('2');
      expect(el.style.gridColumn).to.equal('3 / span 5');
    });

    it('does not re-touch grid styles when an unrelated property changes', async () => {
      const hass = makeHass({ 'climate.test': climateState() });
      const el = await mount(
        hass,
        { type: 'climate-hvac-modes' },
        { row: 2, colStart: 3, span: 4 }
      );
      // Manually clear the inline styles, then trigger an update via a prop that
      // is NOT row/colStart/span — willUpdate's guard should be false so the
      // styles are not re-applied.
      el.style.gridRow = '';
      el.style.gridColumn = '';
      el.entityId = 'climate.other';
      await el.updateComplete;
      expect(el.style.gridRow).to.equal('');
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

    it('entity-tile -> mt-entity-tile', async () => {
      const hass = makeHass({ 'sensor.x': { entity_id: 'sensor.x', state: '1', attributes: {} } });
      const el = await mount(hass, { type: 'entity-tile', entity: 'sensor.x' });
      expect(el.shadowRoot!.querySelector('mt-entity-tile')).to.not.equal(null);
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
