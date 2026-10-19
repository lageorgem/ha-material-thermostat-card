// Data only. Every retained publication is enumerated for symmetric cleanup.
const device = { identifiers: ['mtqa'], name: 'MT Parity QA' };
const climate = (id, extra) => ({ domain: 'climate', id, config: {
  name: id, unique_id: id, default_entity_id: `climate.${id}`, device,
  optimistic: true, min_temp: 7, max_temp: 35, temp_step: 0.5,
  mode_command_topic: `mtqa/${id}/mode/set`,
  current_temperature_topic: `mtqa/${id}/current`, ...extra,
} });
const single = (id) => ({ temperature_command_topic: `mtqa/${id}/temperature/set` });
const range = (id) => ({ temperature_low_command_topic: `mtqa/${id}/low/set`, temperature_high_command_topic: `mtqa/${id}/high/set` });
const presets = (id, modes) => ({ preset_modes: modes, preset_mode_command_topic: `mtqa/${id}/preset/set` });
export const MQTT_ENTITIES = [
  climate('mtqa_full', { modes: ['off', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only'],
    ...single('mtqa_full'), ...range('mtqa_full'), ...presets('mtqa_full', ['eco', 'comfort', 'sleep', 'away', 'boost']),
    fan_modes: ['auto', 'low', 'medium', 'high'], fan_mode_command_topic: 'mtqa/mtqa_full/fan/set',
    swing_modes: ['off', 'on', 'vertical', 'both'], swing_mode_command_topic: 'mtqa/mtqa_full/swing/set',
    swing_horizontal_modes: ['off', 'on', 'left', 'right'], swing_horizontal_mode_command_topic: 'mtqa/mtqa_full/horizontal/set',
    action_topic: 'mtqa/mtqa_full/action' }),
  climate('mtqa_range', { modes: ['off', 'heat_cool', 'auto'], ...range('mtqa_range'), action_topic: 'mtqa/mtqa_range/action' }),
  climate('mtqa_heat', { modes: ['off', 'heat'], ...single('mtqa_heat'), ...presets('mtqa_heat', ['eco', 'comfort']), action_topic: 'mtqa/mtqa_heat/action' }),
  climate('mtqa_reject', { optimistic: false, modes: ['off', 'heat'], ...single('mtqa_reject'), temperature_state_topic: 'mtqa/mtqa_reject/temperature', mode_state_topic: 'mtqa/mtqa_reject/mode' }),
  climate('mtqa_fan', { modes: ['off', 'fan_only'], fan_modes: ['low', 'high'], fan_mode_command_topic: 'mtqa/mtqa_fan/fan/set' }),
  ...[['mtqa_tank', ['off', 'eco', 'electric', 'gas', 'heat_pump', 'high_demand', 'performance']], ['mtqa_basic', ['off', 'gas']]].map(([id, modes]) => ({
    domain: 'water_heater', id, config: { name: id, unique_id: id, default_entity_id: `water_heater.${id}`, device,
      optimistic: true, modes, mode_command_topic: `mtqa/${id}/mode/set`, ...single(id),
      current_temperature_topic: `mtqa/${id}/current`, power_command_topic: `mtqa/${id}/power/set`, min_temp: 40, max_temp: 75, precision: 0.5 },
  })),
];
const state = (entity_id, value, attributes) => ({ entity_id, body: { state: value, attributes } });
export const REST_ENTITIES = [
  state('water_heater.mtqa_away', 'eco', { friendly_name: 'MTQA Away', supported_features: 15, operation_list: ['off', 'eco', 'electric', 'boost'], operation_mode: 'eco', away_mode: 'on', temperature: 55, current_temperature: 48, min_temp: 40, max_temp: 75, target_temp_step: 1 }),
  state('water_heater.mtqa_readonly', 'electric', { friendly_name: 'MTQA WH readonly', supported_features: 2, operation_list: ['off', 'electric'], current_temperature: 50, min_temp: 40, max_temp: 75 }),
  state('water_heater.mtqa_unavailable', 'unavailable', { friendly_name: 'MTQA WH unavailable', supported_features: 3, operation_list: ['off', 'eco'] }),
  state('climate.mtqa_unavailable', 'unavailable', { friendly_name: 'MTQA Climate unavailable', hvac_modes: ['off', 'heat'], supported_features: 1 }),
  state('climate.mtqa_auto_range', 'auto', { friendly_name: 'MTQA Auto range', supported_features: 18, hvac_modes: ['off', 'heat_cool', 'auto'], temperature: null, target_temp_low: 20, target_temp_high: 24, current_temperature: 22, hvac_action: 'idle', preset_modes: ['none', 'eco'], preset_mode: 'none' }),
  state('climate.mtqa_off', 'off', { friendly_name: 'MTQA Off', supported_features: 1, hvac_modes: ['off', 'heat'], temperature: 21, current_temperature: 19.5, hvac_action: 'off' }),
];
export const RETAINED_STATES = Object.entries({
  'mtqa/mtqa_full/current': '21.3', 'mtqa/mtqa_full/action': 'heating',
  'mtqa/mtqa_range/current': '22.1', 'mtqa/mtqa_range/action': 'idle',
  'mtqa/mtqa_heat/current': '20.4', 'mtqa/mtqa_heat/action': 'idle',
  'mtqa/mtqa_reject/current': '20', 'mtqa/mtqa_reject/temperature': '21', 'mtqa/mtqa_reject/mode': 'heat',
  'mtqa/mtqa_fan/current': '23', 'mtqa/mtqa_tank/current': '47.5', 'mtqa/mtqa_basic/current': '52',
}).map(([topic, payload]) => ({ topic, payload, retain: true }));
export const DISCOVERY = MQTT_ENTITIES.map(({ domain, id, config }) => ({ topic: `homeassistant/${domain}/${id}/config`, payload: JSON.stringify(config), retain: true }));
// Optimistic MQTT entities need service calls (not unechoed state topics) to initialize targets.
export const INITIAL_SERVICES = [
  ['climate', 'mtqa_full', 'heat', { temperature: 21.5 }],
  ['climate', 'mtqa_range', 'heat_cool', { target_temp_low: 20, target_temp_high: 24 }],
  ['climate', 'mtqa_heat', 'heat', { temperature: 21.5 }],
  ['climate', 'mtqa_fan', 'fan_only', null],
  ['water_heater', 'mtqa_tank', 'electric', { temperature: 55 }],
  ['water_heater', 'mtqa_basic', 'gas', { temperature: 55 }],
].flatMap(([domain, id, mode, temperature]) => [
  { domain, service: domain === 'climate' ? 'set_hvac_mode' : 'set_operation_mode', data: { entity_id: `${domain}.${id}`, [domain === 'climate' ? 'hvac_mode' : 'operation_mode']: mode } },
  ...(temperature ? [{ domain, service: 'set_temperature', data: { entity_id: `${domain}.${id}`, ...temperature } }] : []),
]);
