import { expect } from '@open-wc/testing';
import type { HassEntity } from 'home-assistant-js-websocket';
import {
  PRIMARY_DOMAINS,
  ClimateEntityFeature,
  WaterHeaterEntityFeature,
  primaryDomain,
  supportsFeature,
  isUnavailable,
  targetModel,
  temperatureServiceCall,
  dialColorMode,
  hvacAction,
} from '../../src/entity/adapter';
import { climateState, waterHeaterState } from '../helpers';

const entity = (state: ReturnType<typeof climateState>): HassEntity => state as HassEntity;

describe('primary entity adapter', () => {
  it('rejects malformed targets and falls through to valid climate ranges', () => {
    for (const invalid of ['55', NaN, Infinity, -Infinity, {}, null, undefined]) {
      expect(targetModel(entity(waterHeaterState({ temperature: invalid })), '°C').kind).to.equal('none');
      expect(targetModel(entity(climateState({ temperature: invalid, supported_features: 1 })), '°C').kind).to.equal('none');
      expect(targetModel(entity(climateState({ temperature: invalid, supported_features: 3, target_temp_low: 18, target_temp_high: 25 })), '°C').kind).to.equal('dual');
      for (const attribute of ['target_temp_low', 'target_temp_high']) {
        expect(targetModel(entity(climateState({ temperature: null, supported_features: 2, target_temp_low: 18, target_temp_high: 25, [attribute]: invalid })), '°C').kind).to.equal('none');
      }
    }
  });

  it('rejects nonfinite limits and steps', () => {
    for (const invalid of [NaN, Infinity, -Infinity]) {
      expect(targetModel(entity(waterHeaterState({ min_temp: invalid, max_temp: invalid, target_temp_step: invalid })), '°C'))
        .to.deep.equal({ kind: 'single', value: 55, min: 43, max: 60, step: 0.5 });
    }
  });
  it('exports the supported domains and HA feature bits', () => {
    expect(PRIMARY_DOMAINS).to.deep.equal(['climate', 'water_heater']);
    expect(ClimateEntityFeature).to.deep.equal({
      TARGET_TEMPERATURE: 1, TARGET_TEMPERATURE_RANGE: 2, TARGET_HUMIDITY: 4,
      FAN_MODE: 8, PRESET_MODE: 16, SWING_MODE: 32, TURN_OFF: 128,
      TURN_ON: 256, SWING_HORIZONTAL_MODE: 512,
    });
    expect(WaterHeaterEntityFeature).to.deep.equal({
      TARGET_TEMPERATURE: 1, OPERATION_MODE: 2, AWAY_MODE: 4, ON_OFF: 8,
    });
  });

  it('recognizes only supported entity domains', () => {
    expect(primaryDomain('climate.test')).to.equal('climate');
    expect(primaryDomain('water_heater.test')).to.equal('water_heater');
    for (const id of [undefined, '', 'sensor.test', 'climate', 'climate_other.test']) {
      expect(primaryDomain(id)).to.equal(undefined);
    }
  });

  it('checks numeric feature bits and permits legacy or missing entities', () => {
    for (const features of [undefined, null, '1']) {
      expect(supportsFeature(entity(climateState({ supported_features: features })), 2)).to.equal(true);
    }
    expect(supportsFeature(undefined, 1)).to.equal(true);
    expect(supportsFeature(entity(climateState({ supported_features: 3 })), 2)).to.equal(true);
    expect(supportsFeature(entity(climateState({ supported_features: 1 })), 2)).to.equal(false);
    expect(supportsFeature(entity(climateState({ supported_features: 0 })), 1)).to.equal(false);
  });

  it('identifies unavailable and unknown states, including missing entities', () => {
    expect(isUnavailable(undefined)).to.equal(true);
    for (const state of ['unavailable', 'unknown', 'off', 'eco']) {
      expect(isUnavailable(entity(waterHeaterState({}, state))))
        .to.equal(state === 'unavailable' || state === 'unknown');
    }
  });

  it('uses single climate targets, including zero, and prefers single over ranges', () => {
    for (const temperature of [0, 21]) {
      expect(targetModel(entity(climateState({
        supported_features: 3, temperature, target_temp_low: 18, target_temp_high: 25,
      })), '°C')).to.deep.equal({ kind: 'single', value: temperature, min: 16, max: 30, step: 0.5 });
    }
    expect(targetModel(entity(climateState()), '°C').kind).to.equal('single');
  });

  it('uses climate ranges in heat_cool and auto, independent of single capability', () => {
    for (const mode of ['heat_cool', 'auto']) {
      for (const attributes of [{ supported_features: 2 }, { temperature: null }, { temperature: undefined }]) {
        expect(targetModel(entity(climateState({
          ...attributes, target_temp_low: 0, target_temp_high: 25,
        }, mode)), '°C')).to.deep.equal({ kind: 'dual', low: 0, high: 25, min: 16, max: 30, step: 0.5 });
      }
    }
  });

  it('returns no climate target for absent capabilities or incomplete values', () => {
    for (const attributes of [
      { supported_features: 0, target_temp_low: 18, target_temp_high: 25 },
      { supported_features: 1, temperature: null },
      { supported_features: 2, target_temp_low: null, target_temp_high: 25 },
      { supported_features: 2, target_temp_low: 18, target_temp_high: null },
      { temperature: undefined },
    ]) {
      expect(targetModel(entity(climateState(attributes)), '°C'))
        .to.deep.equal({ kind: 'none', min: 16, max: 30, step: 0.5 });
    }
  });

  it('uses only single water heater targets, never ranges', () => {
    expect(targetModel(entity(waterHeaterState()), '°C'))
      .to.deep.equal({ kind: 'single', value: 55, min: 40, max: 75, step: 0.5 });
    expect(targetModel(entity(waterHeaterState({ supported_features: undefined })), '°C').kind)
      .to.equal('single');
    for (const attributes of [{ supported_features: 0 }, { temperature: null }, { temperature: undefined }]) {
      expect(targetModel(entity(waterHeaterState({
        ...attributes, target_temp_low: 45, target_temp_high: 60,
      })), '°C')).to.deep.equal({ kind: 'none', min: 40, max: 75, step: 0.5 });
    }
  });

  it('uses domain/unit defaults and rejects nonnumeric limits and nonpositive steps', () => {
    for (const [factory, unit, min, max, step] of [
      [climateState, '°C', 7, 35, 0.5], [climateState, '°F', 45, 95, 1],
      [waterHeaterState, '°C', 43, 60, 0.5], [waterHeaterState, '°F', 110, 140, 1],
    ] as const) {
      for (const invalid of [undefined, null, '20', 0, -1]) {
        const model = targetModel(entity(factory({
          min_temp: 'bad', max_temp: undefined, target_temp_step: invalid,
        })), unit);
        expect({ min: model.min, max: model.max, step: model.step }).to.deep.equal({ min, max, step });
      }
      const explicit = targetModel(entity(factory({ min_temp: 0, max_temp: 100, target_temp_step: 2 })), unit);
      expect({ min: explicit.min, max: explicit.max, step: explicit.step })
        .to.deep.equal({ min: 0, max: 100, step: 2 });
    }
  });

  it('builds domain-aware service payloads without mutating the entity or target', () => {
    const target = Object.freeze({ value: 22, low: 18, high: 25 });
    for (const factory of [climateState, waterHeaterState]) {
      const state = entity(factory());
      const before = JSON.stringify(state);
      const domain = primaryDomain(state.entity_id);
      expect(temperatureServiceCall(state, 'single', target)).to.deep.equal({
        domain, service: 'set_temperature', data: { entity_id: state.entity_id, temperature: 22 },
      });
      expect(temperatureServiceCall(state, 'dual', target)).to.deep.equal({
        domain, service: 'set_temperature', data: domain === 'climate'
          ? { entity_id: state.entity_id, target_temp_low: 18, target_temp_high: 25 }
          : { entity_id: state.entity_id, temperature: 22 },
      });
      expect(JSON.stringify(state)).to.equal(before);
    }
  });

  it('maps climate actions to dial colors and otherwise preserves the state', () => {
    for (const [action, color] of [
      ['cooling', 'cool'], ['heating', 'heat'], ['drying', 'dry'], ['fan', 'fan_only'],
      ['idle', 'auto'], ['off', 'auto'], [undefined, 'auto'],
    ]) {
      const state = entity(climateState({ hvac_action: action }, 'auto'));
      expect(hvacAction(state)).to.equal(action);
      expect(dialColorMode(state)).to.equal(color);
    }
  });

  it('colors water heaters by availability and never exposes an HVAC action', () => {
    for (const mode of ['off', 'unavailable', 'unknown', 'eco', 'electric', 'performance']) {
      const state = entity(waterHeaterState({ hvac_action: 'cooling' }, mode));
      expect(hvacAction(state)).to.equal(undefined);
      expect(dialColorMode(state)).to.equal(['off', 'unavailable', 'unknown'].includes(mode) ? 'off' : 'heat');
    }
  });

  it('treats unknown domains as climate except for domain recognition', () => {
    const state = { ...entity(climateState()), entity_id: 'sensor.test' };
    expect(targetModel(state, '°C').kind).to.equal('single');
    expect(hvacAction(state)).to.equal('cooling');
    expect(dialColorMode(state)).to.equal('cool');
    expect(temperatureServiceCall(state, 'dual', { low: 18, high: 25 })).to.deep.equal({
      domain: 'climate', service: 'set_temperature',
      data: { entity_id: 'sensor.test', target_temp_low: 18, target_temp_high: 25 },
    });
  });

  it('provides the water heater fixture defaults and override semantics', () => {
    expect(waterHeaterState()).to.deep.equal({
      entity_id: 'water_heater.test', state: 'eco', attributes: {
        friendly_name: 'Water heater', current_temperature: 48, temperature: 55,
        min_temp: 40, max_temp: 75, target_temp_step: 0.5,
        operation_list: ['off', 'eco', 'electric', 'performance'],
        operation_mode: 'eco', away_mode: 'off', supported_features: 15,
      },
    });
    expect(waterHeaterState({ temperature: 60 }, 'electric').attributes)
      .to.include({ temperature: 60, operation_mode: 'electric' });
  });
});
