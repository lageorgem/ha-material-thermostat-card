import { expect } from '@open-wc/testing';
import { normalizeConfig } from '../../src/config/normalize';
import type { MaterialThermostatCardConfig } from '../../src/types';

const selectors = [
  ['climate-hvac-modes', 'hvac_modes'],
  ['climate-preset-modes', 'preset_modes'],
  ['climate-fan-modes', 'fan_modes'],
  ['climate-swing-modes', 'swing_modes'],
  ['climate-swing-horizontal-modes', 'swing_horizontal_modes'],
  ['water-heater-operation-modes', 'operation_modes'],
] as const;

function configWith(features: unknown[]): MaterialThermostatCardConfig {
  return {
    type: 'custom:material-thermostat-card',
    entity: 'climate.test',
    features,
  } as MaterialThermostatCardConfig;
}

describe('normalizeConfig', () => {
  it('drops the legacy state label key without mutating frozen input', () => {
    const config = Object.freeze({ ...configWith([]), show_state_label: true });
    expect(normalizeConfig(config)).not.to.have.property('show_state_label');
    expect(config.show_state_label).to.equal(true);
    expect(normalizeConfig({ ...config, features: undefined })).not.to.have.property('show_state_label');
  });

  for (const [type, key] of selectors) {
    for (const alignment of ['left', 'center', 'right']) {
      it(`preserves ${type} ${alignment} alignment while normalizing frozen stock YAML`, () => {
        const feature = Object.freeze({ type, style: 'dropdown', alignment, [key]: ['heat'] });
        const config = Object.freeze(configWith([feature]));
        Object.freeze(config.features);
        expect(normalizeConfig(config).features).to.deep.equal([
          { type, display: 'dropdown', alignment, include: ['heat'] },
        ]);
        expect(feature.style).to.equal('dropdown');
        expect(feature.alignment).to.equal(alignment);
      });
    }
    for (const style of ['icons', 'dropdown']) {
      it(`translates ${type} with ${style} without mutating frozen input`, () => {
        const values = Object.freeze(['second', 'first']);
        const feature = Object.freeze({ type, style, [key]: values, label: 'Modes' });
        const config = configWith([feature]);
        Object.freeze(config.features);
        Object.freeze(config);

        const result = normalizeConfig(config);

        expect(result).not.to.equal(config);
        expect(result.features).not.to.equal(config.features);
        expect(result.features).to.deep.equal([
          { type, display: style, include: values, label: 'Modes' },
        ]);
        expect(feature).to.deep.equal({ type, style, [key]: values, label: 'Modes' });
      });
    }

    it(`preserves explicit display and include for ${type}`, () => {
      const feature = {
        type,
        style: 'dropdown',
        display: 'tile',
        include: [],
        [key]: ['ignored'],
        order: ['custom'],
        options: [{ value: 'custom', label: 'Custom' }],
      };
      expect(normalizeConfig(configWith([feature])).features).to.deep.equal([
        {
          type,
          display: 'tile',
          include: [],
          order: ['custom'],
          options: [{ value: 'custom', label: 'Custom' }],
        },
      ]);
    });
  }

  for (const style of [undefined, 'tile', 'invalid', null]) {
    it(`drops unsupported stock style ${String(style)}`, () => {
      expect(normalizeConfig(configWith([{ type: 'climate-hvac-modes', style }])).features)
        .to.deep.equal([{ type: 'climate-hvac-modes' }]);
    });
  }

  for (const value of [undefined, null, 'heat', 42, { heat: true }]) {
    it(`drops non-array stock list ${JSON.stringify(value)}`, () => {
      expect(normalizeConfig(configWith([
        { type: 'climate-hvac-modes', hvac_modes: value },
      ])).features).to.deep.equal([{ type: 'climate-hvac-modes' }]);
    });
  }

  it('preserves empty stock lists and unrelated selector properties', () => {
    expect(normalizeConfig(configWith([
      { type: 'climate-hvac-modes', hvac_modes: [], fan_modes: ['unrelated'] },
    ])).features).to.deep.equal([
      { type: 'climate-hvac-modes', include: [], fan_modes: ['unrelated'] },
    ]);
  });

  it('passes non-selector and unknown features through by reference', () => {
    const features = [
      { type: 'input-select', entity: 'input_select.test', style: 'icons', hvac_modes: [] },
      { type: 'comfort' },
      { type: 'unknown', style: 'dropdown', operation_modes: [] },
      { type: 'toString', style: 'icons' },
    ].map((feature) => Object.freeze(feature));
    const result = normalizeConfig(configWith(features));
    features.forEach((feature, index) => expect(result.features![index]).to.equal(feature));
  });

  it('returns a shallow copy without adding features when absent', () => {
    const config = Object.freeze({
      type: 'custom:material-thermostat-card',
      entity: 'climate.test',
      feels_like: Object.freeze({ temperature: 'sensor.test' }),
    });
    const result = normalizeConfig(config);
    expect(result).not.to.equal(config);
    expect(result).to.deep.equal(config);
    expect(result).not.to.have.property('features');
    expect(result.feels_like).to.equal(config.feels_like);
  });

  it('handles an empty feature list', () => {
    expect(normalizeConfig(configWith([])).features).to.deep.equal([]);
  });

  it('retains already normalized selectors', () => {
    const feature = { type: 'climate-hvac-modes', display: 'icons', include: ['heat'] };
    expect(normalizeConfig(configWith([feature])).features).to.deep.equal([feature]);
  });
});
