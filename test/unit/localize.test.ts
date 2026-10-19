import { expect } from '@open-wc/testing';
import type { HassEntity } from 'home-assistant-js-websocket';
import { makeHass, climateState } from '../helpers';
import {
  entityDisplayName,
  formatAttributeName,
  formatAttributeValue,
  formatEntityState,
  formatNumber,
  localizeKey,
  numberLocale,
} from '../../src/localize';

const state = climateState() as HassEntity;
const hassWith = (overrides: Record<string, unknown>) => Object.assign(makeHass(), overrides);

describe('localization helpers', () => {
  it('delegates state formatting with its receiver and optional state', () => {
    const hass = hassWith({
      formatEntityState(entity: HassEntity, value?: string) {
        expect(this).to.equal(hass);
        expect(entity).to.equal(state);
        return value === undefined ? 'Kühlen' : value;
      },
    });
    expect(formatEntityState(hass, state)).to.equal('Kühlen');
    expect(formatEntityState(hass, state, 'heat')).to.equal('heat');
  });

  it('falls back to English state labels without a callable formatter', () => {
    expect(formatEntityState(undefined, state)).to.equal('Cool');
    expect(formatEntityState(makeHass(), state, 'heat_cool')).to.equal('Heat/Cool');
    expect(formatEntityState(hassWith({ formatEntityState: false }), state, '')).to.equal('');
  });

  it('delegates attribute value formatting, including omitted values', () => {
    const hass = hassWith({
      formatEntityAttributeValue(entity: HassEntity, attribute: string, value?: unknown) {
        expect(this).to.equal(hass);
        expect(entity).to.equal(state);
        expect(attribute).to.equal('fan_mode');
        return value === undefined ? 'Niedrig' : String(value);
      },
    });
    expect(formatAttributeValue(hass, state, 'fan_mode')).to.equal('Niedrig');
    expect(formatAttributeValue(hass, state, 'fan_mode', 0)).to.equal('0');
  });

  it('falls back through explicit values, entity attributes, and empty values', () => {
    expect(formatAttributeValue(undefined, state, 'fan_mode')).to.equal('Low');
    expect(formatAttributeValue(makeHass(), state, 'fan_mode', 'fan_only')).to.equal('Fan Only');
    expect(formatAttributeValue(makeHass(), state, 'fan_mode', null)).to.equal('Low');
    expect(formatAttributeValue(makeHass(), state, 'missing')).to.equal('');
    expect(formatAttributeValue(hassWith({ formatEntityAttributeValue: 1 }), state, 'fan_mode', false)).to.equal('False');
    expect(formatAttributeValue(undefined, state, 'fan_mode', '')).to.equal('');
  });

  it('delegates attribute names and rejects empty or non-string results', () => {
    const hass = hassWith({
      formatEntityAttributeName(entity: HassEntity, attribute: string) {
        expect(this).to.equal(hass);
        expect(entity).to.equal(state);
        expect(attribute).to.equal('fan_mode');
        return 'Lüftermodus';
      },
    });
    expect(formatAttributeName(hass, state, 'fan_mode', 'Fan mode')).to.equal('Lüftermodus');
    for (const formatter of [undefined, false, () => '', () => null]) {
      expect(formatAttributeName(hassWith({ formatEntityAttributeName: formatter }), state, 'fan_mode', 'Fan mode')).to.equal('Fan mode');
    }
    expect(formatAttributeName(undefined, state, 'fan_mode', 'Fan mode')).to.equal('Fan mode');
  });

  it('localizes keys with English fallback for absent, empty, or invalid results', () => {
    const hass = hassWith({
      localize(key: string) {
        expect(this).to.equal(hass);
        expect(key).to.equal('test.key');
        return 'Übersetzung';
      },
    });
    expect(localizeKey(hass, 'test.key', 'English')).to.equal('Übersetzung');
    for (const localize of [undefined, false, () => '', () => null]) {
      expect(localizeKey(hassWith({ localize }), 'test.key', 'English')).to.equal('English');
    }
    expect(localizeKey(undefined, 'test.key', 'English')).to.equal('English');
  });

  it('maps every HA number format preference', () => {
    const cases: Array<[string, string | string[] | undefined]> = [
      ['language', 'de'],
      ['system', undefined],
      ['comma_decimal', ['en-US', 'en']],
      ['decimal_comma', ['de', 'es', 'it']],
      ['space_comma', ['fr', 'sv', 'cs']],
      ['none', 'de'],
    ];
    for (const [number_format, expected] of cases) {
      expect(numberLocale(hassWith({ locale: { language: 'de', number_format } }))).to.deep.equal(expected);
    }
    expect(numberLocale(hassWith({ locale: { number_format: 'language' } }))).to.equal('en');
    expect(numberLocale(hassWith({ locale: { number_format: 'none' } }))).to.equal('en');
    expect(numberLocale(hassWith({ locale: { language: 'cs' } }))).to.equal('cs');
    expect(numberLocale(makeHass())).to.equal('en');
    expect(numberLocale(undefined)).to.equal(undefined);
  });

  it('formats numbers with fixed decimals and without grouping', () => {
    const german = hassWith({ locale: { language: 'de', number_format: 'language' } });
    const commaDecimal = hassWith({ locale: { language: 'de', number_format: 'comma_decimal' } });
    expect(formatNumber(german, 21.5, 1)).to.equal('21,5');
    expect(formatNumber(commaDecimal, 21.5, 1)).to.equal('21.5');
    expect(formatNumber(german, 21.4, 0)).to.equal('21');
    expect(formatNumber(german, 1234, 2)).to.equal('1234,00');
    expect(formatNumber(undefined, 21, 0)).to.equal('21');
    expect(formatNumber(hassWith({ language: 'bad_locale' }), 21.5, 2)).to.equal('21.50');
  });

  it('does not hide unrelated number formatting errors', () => {
    const hass = makeHass();
    const error = new Error('unexpected');
    Object.defineProperty(hass, 'locale', { get: () => { throw error; } });
    expect(() => formatNumber(hass, 21, 0)).to.throw(error);
  });

  it('uses plain names verbatim, including empty strings', () => {
    expect(entityDisplayName(undefined, state, state.entity_id, 'Kitchen')).to.equal('Kitchen');
    expect(entityDisplayName(undefined, undefined, 'climate.test', '')).to.equal('');
  });

  it('delegates structured and default names to HA with its receiver', () => {
    const config = { type: 'device' };
    const configs = [config, ['device', config], undefined];
    for (const name of configs) {
      const hass = hassWith({
        formatEntityName(entity: HassEntity, value: unknown) {
          expect(this).to.equal(hass);
          expect(entity).to.equal(state);
          expect(value).to.equal(name);
          return 'Wohnzimmer';
        },
      });
      expect(entityDisplayName(hass, state, state.entity_id, name)).to.equal('Wohnzimmer');
    }
  });

  it('falls back to friendly name or entity ID without usable HA name formatting', () => {
    const config = { type: 'device' };
    expect(entityDisplayName(undefined, state, state.entity_id, config)).to.equal('Test AC');
    for (const formatter of [undefined, false, () => '', () => null]) {
      expect(entityDisplayName(hassWith({ formatEntityName: formatter }), state, state.entity_id, config)).to.equal('Test AC');
    }
    const hass = hassWith({ formatEntityName: () => { throw new Error('must not call without state'); } });
    expect(entityDisplayName(hass, undefined, 'climate.missing', config)).to.equal('climate.missing');
    expect(entityDisplayName(undefined, undefined, 'climate.missing')).to.equal('climate.missing');
    expect(entityDisplayName(makeHass(), climateState({ friendly_name: undefined }) as HassEntity, 'climate.unnamed')).to.equal('climate.unnamed');
    expect(entityDisplayName(undefined, climateState({ friendly_name: '' }) as HassEntity, 'climate.empty')).to.equal('');
  });
});
