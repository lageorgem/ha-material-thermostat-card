import { expect } from '@open-wc/testing';
import {
  parseReading,
  normalizeTempUnit,
  systemTempUnit,
  sensorTempUnit,
  toCelsius,
  fromCelsius,
  type TempUnit,
} from '../../src/calc/units';

describe('calc/units', () => {
  describe('parseReading', () => {
    it('preserves finite numbers and parses trimmed numeric prefixes', () => {
      for (const value of [0, -12, 21.5, Number.MAX_VALUE]) {
        expect(parseReading(value)).to.equal(value);
      }
      expect(Object.is(parseReading(-0), -0)).to.equal(true);
      for (const value of ['21.5', '21.5abc', ' 21.5 ', ' 21.5abc ']) {
        expect(parseReading(value)).to.equal(21.5);
      }
      expect(parseReading('0')).to.equal(0);
      expect(parseReading('-12.5')).to.equal(-12.5);
      expect(parseReading('1e2')).to.equal(100);
      expect(parseReading('  21 ')).to.equal(21);
      expect(parseReading('1e3')).to.equal(1000);
    });

    it('rejects empty, nonnumeric, nonfinite, and non-number/string values', () => {
      for (const value of [
        '',
        '  ',
        '\t\n',
        'unknown',
        'unavailable',
        'abc21.5',
        'NaN',
        'Infinity',
        '-Infinity',
        '1e999',
        NaN,
        Infinity,
        -Infinity,
        null,
        undefined,
        true,
        false,
        {},
        [],
        new Number(21.5),
      ]) {
        expect(parseReading(value)).to.equal(undefined);
      }
    });
  });

  describe('normalizeTempUnit', () => {
    it('normalizes every supported alias, ignoring case and whitespace', () => {
      const aliases: [TempUnit, string[]][] = [
        ['°C', ['°c', 'c', '℃', 'celsius']],
        ['°F', ['°f', 'f', '℉', 'fahrenheit']],
        ['K', ['k', 'kelvin']],
      ];
      for (const [unit, values] of aliases) {
        for (const value of values) {
          expect(normalizeTempUnit(value)).to.equal(unit);
          expect(normalizeTempUnit(` ${value.toUpperCase()} `)).to.equal(unit);
        }
      }
    });

    it('rejects unsupported units and non-strings', () => {
      for (const unit of ['', '  ', 'unknown', '°K', 'degrees C', null, undefined, 0, true, {}]) {
        expect(normalizeTempUnit(unit)).to.equal(undefined);
      }
    });

    it('accepts masculine-ordinal degree look-alikes', () => {
      expect(normalizeTempUnit('ºF')).to.equal('°F');
      expect(normalizeTempUnit('ºf')).to.equal('°F');
      expect(normalizeTempUnit('ºC')).to.equal('°C');
      expect(normalizeTempUnit('ºc')).to.equal('°C');
    });
  });

  describe('systemTempUnit', () => {
    it('normalizes the configured unit', () => {
      for (const [temperature, expected] of [
        [' celsius ', '°C'],
        [' FAHRENHEIT ', '°F'],
        ['kelvin', 'K'],
      ] as const) {
        expect(systemTempUnit({ config: { unit_system: { temperature } } })).to.equal(expected);
      }
    });

    it('defaults to Celsius for missing paths or an unsupported unit', () => {
      for (const hass of [
        null,
        undefined,
        {},
        { config: {} },
        { config: { unit_system: {} } },
        { config: { unit_system: { temperature: 'unknown' } } },
      ]) {
        expect(systemTempUnit(hass)).to.equal('°C');
      }
    });
  });

  describe('sensorTempUnit', () => {
    it('prefers a masculine-ordinal Fahrenheit sensor unit over a Celsius system', () => {
      const hass = {
        config: { unit_system: { temperature: '°C' } },
        states: { 'sensor.temperature': { attributes: { unit_of_measurement: 'ºF' } } },
      };
      expect(sensorTempUnit(hass, 'sensor.temperature')).to.equal('°F');
    });

    it('prefers the normalized sensor unit over the system unit', () => {
      for (const [unit, expected] of [
        ['℃', '°C'],
        [' FAHRENHEIT ', '°F'],
        ['kelvin', 'K'],
      ] as const) {
        const hass = {
          config: { unit_system: { temperature: '°F' } },
          states: { 'sensor.temperature': { attributes: { unit_of_measurement: unit } } },
        };
        expect(sensorTempUnit(hass, 'sensor.temperature')).to.equal(expected);
      }
    });

    it('defaults to Celsius for missing hass, states, entity, or attributes', () => {
      for (const hass of [
        null,
        undefined,
        {},
        { states: {} },
        { states: { 'sensor.temperature': {} } },
        { states: { 'sensor.temperature': { attributes: {} } } },
      ]) {
        expect(sensorTempUnit(hass, 'sensor.temperature')).to.equal('°C');
      }
    });

    it('falls back to the system unit for missing or unsupported sensor units', () => {
      const config = { unit_system: { temperature: 'kelvin' } };
      for (const states of [
        undefined,
        {},
        { 'sensor.temperature': {} },
        { 'sensor.temperature': { attributes: {} } },
        { 'sensor.temperature': { attributes: { unit_of_measurement: 'unknown' } } },
        { 'sensor.temperature': { attributes: { unit_of_measurement: 42 } } },
      ]) {
        expect(sensorTempUnit({ config, states }, 'sensor.temperature')).to.equal('K');
      }
    });
  });

  describe('temperature conversion', () => {
    it('converts absolute temperatures to Celsius', () => {
      expect(toCelsius(21.5, '°C')).to.equal(21.5);
      expect(toCelsius(32, '°F')).to.equal(0);
      expect(toCelsius(212, '°F')).to.equal(100);
      expect(toCelsius(273.15, 'K')).to.equal(0);
      expect(toCelsius(0, 'K')).to.equal(-273.15);
    });

    it('converts Celsius to absolute temperatures', () => {
      expect(fromCelsius(21.5, '°C')).to.equal(21.5);
      expect(fromCelsius(0, '°F')).to.equal(32);
      expect(fromCelsius(100, '°F')).to.equal(212);
      expect(fromCelsius(0, 'K')).to.equal(273.15);
      expect(fromCelsius(-273.15, 'K')).to.equal(0);
    });

    it('round-trips each unit in both directions', () => {
      for (const unit of ['°C', '°F', 'K'] as const) {
        for (const value of [-273.15, -40, 0, 21.5, 100, 373.15]) {
          expect(fromCelsius(toCelsius(value, unit), unit)).to.be.closeTo(value, 1e-10);
          expect(toCelsius(fromCelsius(value, unit), unit)).to.be.closeTo(value, 1e-10);
        }
      }
    });
  });
});
