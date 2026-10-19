import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

// REST fixtures carry their seed body beside an independently declared oracle.
// Risk focus: capability precedence, malformed integration data, unavailable state.
// Styling permutations belong to the dashboard, not additional entity fixtures.
export const AUX = {
  input_select: 'input_select.mtqa_select',
  switches: ['switch.mtqa_sw_1', 'switch.mtqa_sw_2'],
  buttons: ['button.mtqa_btn_1', 'button.mtqa_btn_2'],
  sensors: { temperature: 'sensor.mtqa_temp', humidity: 'sensor.mtqa_humidity', power: 'sensor.mtqa_power' },
};
const hvac = ['off', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only'];
const operations = ['electric', 'gas', 'heat_pump', 'eco', 'performance', 'high_demand', 'off'];
const allLists = {
  hvac_modes: hvac, fan_modes: ['auto', 'low', 'medium', 'high'], fan_mode: 'auto',
  preset_modes: ['none', 'eco', 'comfort'], preset_mode: 'none',
  swing_modes: ['off', 'on', 'vertical', 'both'], swing_mode: 'off',
  swing_horizontal_modes: ['off', 'on', 'left', 'right'], swing_horizontal_mode: 'off',
};
const allValues = { hvac, fan: ['auto', 'low', 'medium', 'high'], preset: ['none', 'eco', 'comfort'], swing: ['off', 'on', 'vertical', 'both'], swing_horizontal: ['off', 'on', 'left', 'right'] };
const allActive = { fan: 'auto', preset: 'none', swing: 'off', swing_horizontal: 'off' };
function fixture(id, domain, state, attributes, expected = {}, mqttId) {
  const title = id.replace(/^[cw]-/, '').replaceAll('-', ' ');
  const entity_id = `${domain}.${mqttId ?? `mtqa_${id.replaceAll('-', '_')}`}`;
  const expect = {
    model: 'single', unavailable: false, state, malformed: false,
    values: {}, active: {}, away: null, target: null, low: null, high: null, current: null,
    ...expected,
  };
  return { id, title, entity_id, domain, source: mqttId ? 'mqtt' : 'rest', interactive: Boolean(mqttId) && id !== 'c-mqtt-reject',
    expect, body: { state, attributes: { friendly_name: `MTQA ${title}`, min_temp: domain === 'climate' ? 7 : 40, max_temp: domain === 'climate' ? 35 : 75, target_temp_step: 0.5, ...attributes } } };
}
const c = (id, state, attrs, expected, mqttId) => fixture(id, 'climate', state, attrs, expected, mqttId);
const w = (id, state, attrs, expected, mqttId) => fixture(id, 'water_heater', state, attrs, expected, mqttId);
const baseC = { supported_features: 1, temperature: 21.5, current_temperature: 20, hvac_modes: hvac };
const singleExpect = (state, extra = {}) => ({ target: 21.5, current: 20, values: { hvac }, active: { hvac: state }, ...extra });
const baseW = { supported_features: 15, operation_list: operations, away_mode: 'off', temperature: 55, current_temperature: 48 };
const { current_temperature: ignoredCurrent, ...waterWithoutCurrent } = baseW;
const waterExpect = (state, extra = {}) => ({ target: 55, current: 48, away: 'off', values: { operation: operations }, active: { operation: state }, ...extra });

export const SCENARIOS = [
  c('c-mqtt-full', 'heat', {}, singleExpect('heat', { current: 21.3, values: { ...allValues, preset: ['none', 'eco', 'comfort', 'sleep', 'away', 'boost'] }, active: { hvac: 'heat', fan: 'auto', preset: 'eco', swing: 'off', swing_horizontal: 'off' } }), 'mtqa_full'),
  c('c-mqtt-range', 'heat_cool', {}, { model: 'dual', low: 20, high: 24, current: 22.1, values: { hvac: ['off', 'heat_cool', 'auto'] }, active: { hvac: 'heat_cool' } }, 'mtqa_range'),
  c('c-mqtt-heat', 'heat', {}, singleExpect('heat', { current: 20.4, values: { hvac: ['off', 'heat'], preset: ['none', 'eco', 'comfort'] }, active: { hvac: 'heat', preset: 'eco' } }), 'mtqa_heat'),
  c('c-mqtt-reject', 'heat', {}, { target: 21, current: 20, values: { hvac: ['off', 'heat'] }, active: { hvac: 'heat' } }, 'mtqa_reject'),
  c('c-mqtt-fan', 'fan_only', {}, { model: 'none', current: 23, values: { hvac: ['off', 'fan_only'], fan: ['low', 'high'] }, active: { hvac: 'fan_only', fan: 'low' } }, 'mtqa_fan'),
  ...[
    ['heat-heating', 'heat', 'heating', 20], ['heat-idle', 'heat', 'idle', 22.5],
    ['cool-cooling', 'cool', 'cooling', 24], ['cool-idle', 'cool', 'idle', 20],
    ['off', 'off', 'off', 20], ['dry', 'dry', 'drying', 20],
    ['fan-only', 'fan_only', 'fan', 20], ['auto', 'auto', 'heating', 20],
  ].map(([suffix, state, action, current]) => c(`c-single-${suffix}`, state,
    { ...baseC, ...allLists, supported_features: 569, hvac_action: action, current_temperature: current },
    singleExpect(state, { current, values: allValues, active: { ...allActive, hvac: state } }))),
  c('c-range-heatcool', 'heat_cool', { ...baseC, supported_features: 18, temperature: null, target_temp_low: 20, target_temp_high: 24, preset_modes: ['none', 'eco'], preset_mode: 'none' }, singleExpect('heat_cool', { model: 'dual', target: null, low: 20, high: 24, values: { hvac, preset: ['none', 'eco'] }, active: { hvac: 'heat_cool', preset: 'none' } })),
  c('c-range-auto', 'auto', { ...baseC, supported_features: 2, temperature: null, target_temp_low: 20, target_temp_high: 24 }, singleExpect('auto', { model: 'dual', target: null, low: 20, high: 24 })),
  c('c-both-single', 'heat_cool', { ...baseC, supported_features: 3, temperature: 22, target_temp_low: 20, target_temp_high: 24 }, singleExpect('heat_cool', { target: 22 })),
  c('c-both-nulltemp', 'heat_cool', { ...baseC, supported_features: 3, temperature: null, target_temp_low: 20, target_temp_high: 24 }, singleExpect('heat_cool', { model: 'dual', target: null, low: 20, high: 24 })),
  c('c-none', 'fan_only', { supported_features: 8, hvac_modes: ['off', 'fan_only'], fan_modes: ['low', 'high'], fan_mode: 'low' }, { model: 'none', values: { hvac: ['off', 'fan_only'], fan: ['low', 'high'] }, active: { hvac: 'fan_only', fan: 'low' } }),
  c('c-legacy-single', 'heat', { temperature: 21 }, { target: 21 }),
  c('c-legacy-range', 'heat_cool', { temperature: null, target_temp_low: 20, target_temp_high: 24 }, { model: 'dual', low: 20, high: 24 }),
  c('c-unavailable', 'unavailable', {}, { model: 'none', unavailable: true }),
  c('c-unknown', 'unknown', { ...baseC }, singleExpect('unknown', { unavailable: true })),
  c('c-no-current', 'heat', { supported_features: 1, temperature: 21.5 }, { target: 21.5 }),
  c('c-step-1', 'heat', { ...baseC, target_temp_step: 1, min_temp: 16, max_temp: 30, temperature: 21 }, singleExpect('heat', { target: 21 })),
  c('c-step-01', 'heat', { ...baseC, target_temp_step: 0.1, temperature: 21.3, current_temperature: 20.7 }, singleExpect('heat', { target: 21.3, current: 20.7 })),
  c('c-presets-none', 'heat', { ...baseC, supported_features: 17, preset_modes: ['none', 'eco', 'comfort'], preset_mode: 'none' }, singleExpect('heat', { values: { hvac, preset: ['none', 'eco', 'comfort'] }, active: { hvac: 'heat', preset: 'none' } })),
  c('c-custom-values', 'heat', { ...baseC, supported_features: 537, fan_modes: ['turbo', 'quiet_mode'], fan_mode: 'quiet_mode', preset_modes: ['vacation_home'], preset_mode: 'vacation_home', swing_horizontal_modes: ['left', 'right', 'wide'], swing_horizontal_mode: 'wide' }, singleExpect('heat', { values: { hvac, fan: ['turbo', 'quiet_mode'], preset: ['vacation_home'], swing_horizontal: ['left', 'right', 'wide'] }, active: { hvac: 'heat', fan: 'quiet_mode', preset: 'vacation_home', swing_horizontal: 'wide' } })),
  c('c-many-modes', 'auto', { ...baseC, supported_features: 25, friendly_name: 'MTQA Upstairs west wing family room thermostat with many modes', preset_modes: ['none', 'eco', 'comfort', 'sleep', 'away', 'boost', 'home', 'activity', 'vacation', 'party'], preset_mode: 'party', fan_modes: ['auto', 'low', 'medium', 'high', 'turbo', 'quiet'], fan_mode: 'quiet' }, singleExpect('auto', { values: { hvac, preset: ['none', 'eco', 'comfort', 'sleep', 'away', 'boost', 'home', 'activity', 'vacation', 'party'], fan: ['auto', 'low', 'medium', 'high', 'turbo', 'quiet'] }, active: { hvac: 'auto', preset: 'party', fan: 'quiet' } })),
  c('c-malformed', 'heat', { supported_features: 57, temperature: '22', current_temperature: '21', fan_modes: 'auto', swing_modes: {}, preset_modes: [null, 'eco'], preset_mode: 'eco' }, { model: 'none', malformed: true, values: { preset: ['eco'] }, active: { preset: 'eco' } }),
  w('w-mqtt-tank', 'electric', {}, waterExpect('electric', { current: 47.5, away: null }), 'mtqa_tank'),
  w('w-mqtt-basic', 'gas', {}, waterExpect('gas', { current: 52, away: null, values: { operation: ['gas', 'off'] } }), 'mtqa_basic'),
  ...operations.map((mode) => w(`w-state-${mode.replaceAll('_', '-')}`, mode, { ...baseW }, waterExpect(mode))),
  ...['on', 'off'].map((away) => w(`w-away-${away}`, 'eco', { ...baseW, away_mode: away }, waterExpect('eco', { away }))),
  w('w-no-away', 'eco', { ...baseW, supported_features: 3 }, waterExpect('eco', { away: null })),
  w('w-op-only', 'eco', { supported_features: 2, operation_list: operations, current_temperature: 48 }, { model: 'none', current: 48, values: { operation: operations }, active: { operation: 'eco' } }),
  w('w-target-only', 'electric', { supported_features: 1, temperature: 55, current_temperature: 48 }, { target: 55, current: 48 }),
  w('w-onoff', 'electric', { supported_features: 9, temperature: 55, current_temperature: 48 }, { target: 55, current: 48 }),
  w('w-unavailable', 'unavailable', {}, { model: 'none', unavailable: true }),
  w('w-unknown', 'unknown', { ...baseW }, waterExpect('unknown', { unavailable: true })),
  w('w-no-current', 'eco', waterWithoutCurrent, waterExpect('eco', { current: null })),
  w('w-satisfied', 'eco', { ...baseW, current_temperature: 58 }, waterExpect('eco', { current: 58 })),
  w('w-custom-modes', 'boost', { ...baseW, operation_list: ['off', 'boost', 'vacation', 'eco'] }, waterExpect('boost', { values: { operation: ['eco', 'off', 'boost', 'vacation'] } })),
  w('w-legacy', 'eco', { temperature: 50, away_mode: 'on' }, { target: 50 }),
  w('w-malformed', 'electric', { supported_features: 3, temperature: '55', current_temperature: '48', operation_list: {} }, { model: 'none', malformed: true }),
];

export function checkMatrix() {
  const errors = [];
  const ids = new Set(), entities = new Set();
  for (const s of SCENARIOS) {
    if (ids.has(s.id) || entities.has(s.entity_id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.id)) errors.push(`${s.id}: duplicate or invalid ID`);
    ids.add(s.id); entities.add(s.entity_id);
    if (s.source !== 'rest') continue;
    const a = s.body.attributes;
    const supports = (bit) => typeof a.supported_features !== 'number' || Boolean(a.supported_features & bit);
    const finite = (v) => typeof v === 'number' && Number.isFinite(v);
    const model = supports(1) && finite(a.temperature) ? 'single' : s.domain === 'climate' && supports(2) && finite(a.target_temp_low) && finite(a.target_temp_high) ? 'dual' : 'none';
    const values = {}, active = {};
    const lists = s.domain === 'climate' ? { hvac: 'hvac_modes', preset: 'preset_modes', fan: 'fan_modes', swing: 'swing_modes', swing_horizontal: 'swing_horizontal_modes' } : { operation: 'operation_list' };
    for (const [key, attr] of Object.entries(lists)) {
      let entries = Array.isArray(a[attr]) ? a[attr].filter((v) => typeof v === 'string') : [];
      if (key === 'operation') entries = [...operations.filter((v) => entries.includes(v)), ...entries.filter((v) => !operations.includes(v))];
      if (!entries.length) continue;
      values[key] = entries;
      const selected = key === 'hvac' || key === 'operation' ? s.body.state : a[`${key}_mode`];
      if (typeof selected === 'string') active[key] = selected;
    }
    const away = s.domain === 'water_heater' && typeof a.supported_features === 'number' && (a.supported_features & 4) && ['on', 'off'].includes(a.away_mode) ? a.away_mode : null;
    const actual = { model, values, active, away, unavailable: ['unavailable', 'unknown'].includes(s.body.state), state: s.body.state,
      target: model === 'single' ? a.temperature : null, low: model === 'dual' ? a.target_temp_low : null, high: model === 'dual' ? a.target_temp_high : null, current: finite(a.current_temperature) ? a.current_temperature : null };
    for (const [key, value] of Object.entries(actual)) if (!isDeepStrictEqual(value, s.expect[key])) errors.push(`${s.id}: expect.${key}: declared ${JSON.stringify(s.expect[key])}, computed ${JSON.stringify(value)}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return SCENARIOS.length;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(`Matrix self-check passed: ${checkMatrix()} scenarios`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
