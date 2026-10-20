/**
 * Shared README shots: consumed by `node dev/ha-shots.mjs` and
 * `node dev/push-dashboard.mjs --dry-run`. State/history/drag overrides are
 * client-side only; publishing a dashboard saves configs, never these overrides.
 */
const CLIMATE = 'climate.mt_showcase_thermostat';
const AC = 'climate.mt_showcase_ac';
const WATER_HEATER = 'water_heater.mt_showcase_tank';
const TEMPERATURE = 'sensor.mt_showcase_temperature';
const HUMIDITY = 'sensor.mt_showcase_humidity';
const FAN = 'input_select.mt_showcase_fan_speed';
const ECO = 'input_boolean.mt_showcase_eco';
const BOOST = 'input_boolean.mt_showcase_boost';
const LAMP = 'input_boolean.mt_showcase_lamp';
const OUTDOOR = 'sensor.mt_showcase_outdoor';

/** Numeric samples only; the screenshot consumer supplies recorder timestamps. */
export function cool(from, to, count = 12) {
  return Array.from({ length: count }, (_, i) =>
    Number((to + (from - to) * Math.exp((-2.2 * i) / (count - 1))).toFixed(1))
  );
}

function card(features = [], overrides = {}) {
  return {
    type: 'custom:material-thermostat-card',
    entity: CLIMATE,
    name: 'Living Room',
    dial_style: 'halo',
    features,
    ...overrides,
  };
}

function climate(state, attributes = {}) {
  return {
    state,
    attributes: {
      friendly_name: 'Showcase thermostat',
      hvac_modes: ['off', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only'],
      supported_features: 1 | 2 | 4 | 8 | 16 | 32 | 128 | 256,
      min_temp: 16,
      max_temp: 30,
      target_temp_step: 0.5,
      temperature: 23,
      target_temp_low: 20,
      target_temp_high: 24,
      current_temperature: 21,
      hvac_action: 'heating',
      fan_modes: ['auto', 'low', 'medium', 'high'],
      fan_mode: 'medium',
      swing_modes: ['Fixed Top', 'Fixed Top-Middle', 'Fixed Middle', 'Fixed Bottom-Middle',
        'Fixed Bottom', 'Swing Bottom', 'Swing Middle', 'Swing Top', 'Full Swing'],
      swing_mode: 'Full Swing',
      preset_modes: ['none', 'eco', 'boost', 'sleep'],
      preset_mode: 'eco',
      ...attributes,
    },
  };
}

function waterHeater(state, attributes = {}) {
  return {
    state,
    attributes: {
      friendly_name: 'Showcase tank',
      supported_features: 15,
      operation_list: ['off', 'eco', 'electric', 'heat_pump', 'high_demand', 'performance'],
      operation_mode: state,
      temperature: 55,
      current_temperature: 47.5,
      min_temp: 40,
      max_temp: 75,
      target_temp_step: 0.5,
      away_mode: 'off',
      ...attributes,
    },
  };
}

function states(state = 'cool', attributes = {}) {
  const active = climate(state, {
    ...(state === 'cool' ? { current_temperature: 26.5, hvac_action: 'cooling' } : {}),
    ...attributes,
  });
  return {
    [CLIMATE]: active,
    [AC]: { ...active, attributes: { ...active.attributes, friendly_name: 'Bedroom AC' } },
    [TEMPERATURE]: { state: String(active.attributes.current_temperature), attributes: {
      friendly_name: 'Temperature', unit_of_measurement: '°C', device_class: 'temperature',
    } },
    [HUMIDITY]: { state: '46', attributes: {
      friendly_name: 'Humidity', unit_of_measurement: '%', device_class: 'humidity',
    } },
    [FAN]: { state: 'medium', attributes: { options: ['low', 'medium', 'high'] } },
    [ECO]: { state: 'on' },
    [BOOST]: { state: 'off' },
    [LAMP]: { state: 'on' },
    'input_button.mt_showcase_restart': { state: 'unknown' },
  };
}

function sensorTiles(display = 'tile') {
  return [
    { type: 'entity-tile', entity: TEMPERATURE, name: 'Temperature',
      icon: 'mdi:thermometer', display, width: 50 },
    { type: 'entity-tile', entity: HUMIDITY, name: 'Humidity',
      icon: 'mdi:water-percent', display, width: 50 },
  ];
}

const fanOptions = [
  { value: 'low', label: 'Low', icon: 'mdi:fan-speed-1' },
  { value: 'medium', label: 'Medium', icon: 'mdi:fan-speed-2' },
  { value: 'high', label: 'High', icon: 'mdi:fan-speed-3' },
];
const presets = [
  { entity: ECO, label: 'Eco', icon: 'mdi:leaf' },
  { entity: BOOST, label: 'Boost', icon: 'mdi:rocket-launch' },
  { entity: LAMP, label: 'Lamp', icon: 'mdi:lamp' },
];
const dualStates = () => states('heat_cool', {
  current_temperature: 22, hvac_action: 'idle', temperature: null,
});

export const SHOTS = [
  {
    name: 'water-heater', title: 'Hot water', width: 420,
    config: card([
      { type: 'water-heater-operation-modes', display: 'icons', width: 100 },
      { type: 'water-heater-away-mode', display: 'tile', label: 'Away', width: 100 },
    ], { entity: WATER_HEATER, name: 'Hot water', dial_style: 'halo' }),
    states: { [WATER_HEATER]: waterHeater('eco') },
  },
  {
    name: 'water-heater-gas', title: 'Gas boiler', width: 420,
    config: card([
      { type: 'water-heater-operation-modes', display: 'dropdown', label: 'Mode' },
    ], { entity: WATER_HEATER, name: 'Gas boiler', dial_style: 'google' }),
    states: { [WATER_HEATER]: waterHeater('gas', {
      temperature: 60, current_temperature: 44,
      operation_list: ['off', 'gas'], supported_features: 11,
    }) },
  },
  {
    name: 'water-heater-tile', title: 'Heat pump cylinder', width: 420,
    config: card([
      { type: 'water-heater-operation-modes', display: 'tile', label: 'Mode', width: 50 },
      { type: 'water-heater-away-mode', display: 'tile', label: 'Away', width: 50 },
    ], { entity: WATER_HEATER, name: 'Heat pump cylinder', dial_style: 'minimal' }),
    states: { [WATER_HEATER]: waterHeater('heat_pump', {
      temperature: 50, current_temperature: 51,
      operation_list: ['off', 'eco', 'heat_pump', 'performance'], away_mode: 'on',
    }) },
  },
  {
    name: 'swing-both', title: 'Living Room AC', width: 420,
    config: card([
      { type: 'climate-hvac-modes', display: 'icons', width: 100 },
      { type: 'climate-swing-modes', display: 'tile', label: 'Vertical', width: 50 },
      { type: 'climate-swing-horizontal-modes', display: 'tile', label: 'Horizontal', width: 50 },
    ], { entity: AC, name: 'Living Room AC' }),
    states: states('cool', {
      supported_features: 1 | 2 | 4 | 8 | 16 | 32 | 128 | 256 | 512,
      swing_mode: 'Full Swing',
      swing_horizontal_modes: ['off', 'Left', 'Center', 'Right', 'Swing'],
      swing_horizontal_mode: 'Center',
    }),
  },
  {
    name: 'swing-icons', title: 'Default swing icons', width: 420,
    config: card([
      { type: 'climate-swing-modes', display: 'icons', width: 100 },
      { type: 'climate-swing-horizontal-modes', display: 'icons', width: 100 },
    ], { entity: AC, name: 'Default swing icons' }),
    states: states('cool', {
      supported_features: 1 | 2 | 4 | 8 | 16 | 32 | 128 | 256 | 512,
      swing_mode: 'Fixed Middle',
      swing_horizontal_modes: ['off', 'Left', 'Center', 'Right', 'Swing'],
      swing_horizontal_mode: 'Swing',
    }),
  },
  {
    name: 'reply-1', title: 'Living Room', group: 'reply', width: 420,
    config: card([
      { type: 'climate-hvac-modes', display: 'tile', label: 'Mode', width: 100 },
      { type: 'climate-fan-modes', display: 'tile', label: 'Fan', width: 50 },
      { type: 'climate-preset-modes', display: 'tile', label: 'Preset', width: 50 },
      { type: 'sensor-list', items: [
        { entity: TEMPERATURE, label: 'Indoor temperature' },
        { entity: OUTDOOR, label: 'Outdoor temperature' },
      ] },
    ], { name: 'Living Room', dial_style: 'halo' }),
    states: {
      ...states('heat', { temperature: 22, current_temperature: 20.4,
        hvac_action: 'heating', fan_mode: 'auto',
        preset_modes: ['none', 'eco', 'comfort', 'boost'], preset_mode: 'comfort' }),
      [OUTDOOR]: { state: '11', attributes: {
        unit_of_measurement: '°C', device_class: 'temperature',
      } },
    },
  },
  {
    name: 'reply-2', title: 'Whole Home', group: 'reply', width: 420,
    config: card([
      { type: 'climate-hvac-modes', display: 'tile', label: 'Mode', width: 100 },
      { type: 'climate-fan-modes', display: 'tile', label: 'Fan', width: 50 },
      { type: 'climate-preset-modes', display: 'tile', label: 'Preset', width: 50 },
      { type: 'sensor-list', items: [
        { entity: TEMPERATURE, label: 'Indoor temperature' },
        { entity: OUTDOOR, label: 'Outdoor temperature' },
      ] },
    ], { name: 'Whole Home', dial_style: 'minimal' }),
    states: {
      ...states('heat_cool', { temperature: null, target_temp_low: 20,
        target_temp_high: 24, current_temperature: 22.2, hvac_action: 'idle',
        fan_mode: 'auto', preset_mode: 'eco' }),
      [OUTDOOR]: { state: '11', attributes: {
        unit_of_measurement: '°C', device_class: 'temperature',
      } },
    },
  },
  {
    name: 'reply-3', title: 'Bedroom AC', group: 'reply', width: 420,
    config: card([
      { type: 'climate-hvac-modes', display: 'tile', label: 'Mode', width: 100 },
      { type: 'climate-fan-modes', display: 'tile', label: 'Fan', width: 50 },
      { type: 'climate-swing-modes', display: 'tile', label: 'Swing', width: 50 },
      { type: 'sensor-list', items: [
        { entity: TEMPERATURE, label: 'Indoor temperature' },
        { entity: OUTDOOR, label: 'Outdoor temperature' },
      ] },
    ], { entity: AC, name: 'Bedroom AC', dial_style: 'google' }),
    states: {
      ...states('cool', { temperature: 21, current_temperature: 24.3,
        hvac_action: 'cooling', fan_mode: 'medium', swing_mode: 'Full Swing' }),
      [OUTDOOR]: { state: '11', attributes: {
        unit_of_measurement: '°C', device_class: 'temperature',
      } },
    },
  },
  {
    name: 'grid-1', title: 'Living Room', group: 'grid', width: 420,
    config: card([
      { type: 'climate-hvac-modes', display: 'tile', label: 'Mode', width: 100 },
      { type: 'sensor-list', items: [
        { entity: TEMPERATURE, label: 'Indoor temperature' },
        { entity: OUTDOOR, label: 'Outdoor temperature' },
      ] },
    ]),
    states: {
      ...states('heat', { temperature: 22, current_temperature: 20.4 }),
      [OUTDOOR]: { state: '11', attributes: {
        unit_of_measurement: '°C', device_class: 'temperature',
      } },
    },
  },
  {
    name: 'grid-2', title: 'Bedroom', group: 'grid', width: 420,
    config: card([
      { type: 'comfort', show_target_eta: true },
      { type: 'climate-preset-modes', display: 'tile', label: 'Preset', width: 100 },
    ], { name: 'Bedroom', dial_style: 'minimal',
      feels_like: { temperature: TEMPERATURE, humidity: HUMIDITY } }),
    states: states('heat', { temperature: 21.5, current_temperature: 19.2,
      preset_modes: ['none', 'eco', 'comfort', 'boost'], preset_mode: 'comfort' }),
    history: {
      [TEMPERATURE]: cool(17, 19.5).map((value, i, values) =>
        i === values.length - 1 ? 19.2 : value),
      [HUMIDITY]: Array(12).fill(46),
    },
  },
  {
    name: 'grid-3', title: 'Office', group: 'grid', width: 420,
    config: card([
      { type: 'climate-hvac-modes', display: 'icons' },
      { type: 'switch-group', display: 'tile', entities: presets.slice(0, 2) },
    ], { name: 'Office', dial_style: 'google' }),
    states: states('heat', { temperature: 23, current_temperature: 21.6 }),
  },
  {
    name: 'grid-4', title: 'Living Room AC', group: 'grid', width: 420,
    config: card([
      { type: 'climate-hvac-modes', display: 'tile', label: 'Mode', width: 100 },
      { type: 'climate-fan-modes', display: 'tile', label: 'Fan', width: 50 },
      { type: 'climate-swing-modes', display: 'tile', label: 'Swing', width: 50 },
    ], { entity: AC, name: 'Living Room AC' }),
    states: states('cool', { temperature: 22, current_temperature: 25.1 }),
  },
  {
    name: 'grid-5', title: 'Bedroom AC', group: 'grid', width: 420,
    config: card([
      { type: 'climate-fan-modes', display: 'dropdown', label: 'Fan speed' },
      ...sensorTiles(),
    ], { entity: AC, name: 'Bedroom AC', dial_style: 'minimal' }),
    states: states('cool', { temperature: 23, current_temperature: 26.4 }),
  },
  {
    name: 'grid-6', title: 'Office AC', group: 'grid', width: 420,
    config: card([
      { type: 'comfort', show_target_eta: true },
      { type: 'sensor-list', items: [
        { entity: TEMPERATURE, label: 'Indoor temperature' },
        { entity: HUMIDITY, label: 'Indoor humidity' },
      ] },
    ], { entity: AC, name: 'Office AC', dial_style: 'google',
      feels_like: { temperature: TEMPERATURE, humidity: HUMIDITY } }),
    states: states('cool', { temperature: 21, current_temperature: 24.3 }),
    history: {
      // Still falling toward ~18.5 °C, so the fit predicts reaching the 21 °C target.
      [TEMPERATURE]: Array.from({ length: 12 }, (_, i) =>
        Number((18.5 + 9 * Math.exp((-0.439 * i) / 11)).toFixed(1))),
      [HUMIDITY]: Array(12).fill(46),
    },
  },
  {
    name: 'grid-7', title: 'Whole Home', group: 'grid', width: 420,
    config: card([
      { type: 'climate-hvac-modes', display: 'tile', label: 'Mode', width: 100 },
      { type: 'sensor-list', items: [
        { entity: TEMPERATURE, label: 'Indoor temperature' },
        { entity: OUTDOOR, label: 'Outdoor temperature' },
      ] },
    ], { name: 'Whole Home' }),
    states: {
      ...states('heat_cool', { temperature: null, target_temp_low: 20,
        target_temp_high: 24, current_temperature: 22.2, hvac_action: 'idle' }),
      [OUTDOOR]: { state: '11', attributes: {
        unit_of_measurement: '°C', device_class: 'temperature',
      } },
    },
  },
  {
    name: 'grid-8', title: 'Kitchen', group: 'grid', width: 420,
    config: card([
      { type: 'input-select', entity: FAN, label: 'Fan speed', display: 'tile',
        options: fanOptions.map((option) => ({ ...option })) },
      { type: 'entity-tile', entity: HUMIDITY, name: 'Humidity',
        icon: 'mdi:water-percent', display: 'tile', width: 100 },
    ], { name: 'Kitchen' }),
    states: states('heat', { current_temperature: 20.8 }), drag: { value: 23.5 },
  },
  {
    name: 'grid-9', title: 'Studio', group: 'grid', width: 420,
    config: card([
      { type: 'switch-list', entities: [presets[2], presets[0]] },
      { type: 'button-list', items: [
        { entity: 'input_button.mt_showcase_restart', label: 'Restart', icon: 'mdi:restart' },
      ] },
    ], { name: 'Studio', show_current_as_primary: true }),
    states: states('heat', { temperature: 23, current_temperature: 21.4 }),
  },
  {
    name: 'forum-hero', title: 'Living Room — Google Home style',
    config: card([
      { type: 'climate-hvac-modes', display: 'tile', label: 'Mode', width: 100 },
      { type: 'climate-fan-modes', display: 'tile', label: 'Fan', width: 50 },
      { type: 'climate-preset-modes', display: 'tile', label: 'Preset', width: 50 },
      { type: 'sensor-list', items: [
        { entity: TEMPERATURE, label: 'Indoor temperature' },
        { entity: HUMIDITY, label: 'Indoor humidity' },
        { entity: 'sensor.mt_showcase_outdoor', label: 'Outdoor temperature' },
      ] },
    ]),
    states: {
      [CLIMATE]: climate('heat', {
        friendly_name: 'Living Room',
        hvac_action: 'heating', temperature: 22, current_temperature: 20.4,
        hvac_modes: ['off', 'heat', 'cool', 'auto'],
        fan_modes: ['auto', 'low', 'medium', 'high'], fan_mode: 'auto',
        preset_modes: ['none', 'eco', 'comfort', 'boost'], preset_mode: 'comfort',
        min_temp: 10, max_temp: 30, target_temp_step: 0.5,
      }),
      [TEMPERATURE]: { state: '20.4', attributes: {
        friendly_name: 'Indoor temperature', unit_of_measurement: '°C', device_class: 'temperature',
      } },
      [HUMIDITY]: { state: '48', attributes: {
        friendly_name: 'Indoor humidity', unit_of_measurement: '%', device_class: 'humidity',
      } },
      'sensor.mt_showcase_outdoor': { state: '11', attributes: {
        friendly_name: 'Outdoor temperature', unit_of_measurement: '°C', device_class: 'temperature',
      } },
    },
  },
  {
    name: 'hero', title: 'Bedroom AC — cooling',
    config: card([
      { type: 'climate-hvac-modes', display: 'tile', label: 'Mode' },
      { type: 'climate-fan-modes', display: 'dropdown', label: 'Fan speed' },
      ...sensorTiles(),
    ], { entity: AC, name: 'Bedroom AC' }),
    states: states('cool', { current_temperature: 28.9 }),
  },
  ...[
    ['dial-halo-heat', 'Active heating', 'heat', {}, {}],
    ['dial-halo-cool', 'Active cooling', 'cool', {}, { entity: AC, name: 'Bedroom AC' }],
    ['dial-idle', 'Idle heating', 'heat', { temperature: 20, current_temperature: 22, hvac_action: 'idle' }, {}],
    ['dial-off', 'Thermostat off', 'off', { hvac_action: 'off' }, {}],
    ['dial-minimal', 'Minimal dial', 'heat', {}, { dial_style: 'minimal' }],
    ['dial-google', 'Google dial', 'heat', {}, { dial_style: 'google' }],
    ['font-theme', 'Theme font', 'heat', {}, { font: 'theme' }],
  ].map(([name, title, mode, attributes, config]) => ({
    name, title, config: card([], config), states: states(mode, attributes),
  })),
  ...[
    ['drag-single', 'halo'], ['drag-google', 'google'],
  ].map(([name, style]) => ({
    name, title: `Dragging — ${style}`, config: card([], { dial_style: style }),
    states: states('heat'), drag: { value: 24.5 },
  })),
  {
    name: 'dial-heat-cool', title: 'Dual setpoint — idle range',
    config: card([], { name: 'Auto' }), states: dualStates(),
  },
  {
    name: 'drag-heat-cool', title: 'Dual setpoint — dragging high handle',
    config: card([], { name: 'Auto' }), states: dualStates(),
    drag: { low: 20, high: 25.5, active: 'high' },
  },
  {
    name: 'show-current', title: 'Current temperature as primary',
    config: card([], { show_current_as_primary: true }),
    states: states('heat', { current_temperature: 21.4 }),
  },
  {
    name: 'wide', title: 'Wide side-by-side layout', width: 760,
    config: card([
      { type: 'climate-hvac-modes', display: 'icons', width: 50 },
      { type: 'climate-fan-modes', display: 'dropdown', label: 'Fan speed', width: 50 },
      { type: 'climate-swing-modes', display: 'dropdown', label: 'Swing', width: 50 },
      { type: 'climate-preset-modes', display: 'tile', label: 'Preset', width: 50 },
    ]), states: states(),
  },
  ...['icons', 'dropdown', 'tile'].map((display) => ({
    name: `hvac-${display}`, title: `HVAC modes — ${display}`,
    config: card([{ type: 'climate-hvac-modes', display, label: 'Mode' }]), states: states(),
  })),
  ...[
    ['fan-modes', 'climate-fan-modes', 'icons', 'Fan speed'],
    ['swing-modes', 'climate-swing-modes', 'dropdown', 'Swing'],
    ['preset-modes', 'climate-preset-modes', 'tile', 'Preset'],
  ].map(([name, type, display, label]) => ({
    name, title: label, config: card([{ type, display, label }]), states: states(),
  })),
  {
    name: 'option-overrides', title: 'Option labels, icons, colors and hiding',
    config: card([
      { type: 'climate-hvac-modes', label: 'Mode', options: [
        { value: 'cool', label: 'Chill', icon: 'mdi:snowflake', color: '#00897b' },
        { value: 'heat', label: 'Cozy', icon: 'mdi:fire', color: '#ef6c00' },
        { value: 'fan_only', hide: true },
      ] },
      { type: 'climate-fan-modes', display: 'dropdown', label: 'Fan speed', options: [
        { value: 'high', label: 'Turbo', icon: 'mdi:fan-chevron-up' },
        { value: 'auto', icon: 'mdi:fan-auto' },
      ] },
      { type: 'climate-swing-modes', label: 'Swing', options: [
        { value: 'Fixed Top', label: 'Top', icon: 'mt:swing-vertical-fixed-top' },
        { value: 'Fixed Top-Middle', label: 'Upper', icon: 'mt:swing-vertical-fixed-upper-middle' },
        { value: 'Fixed Middle', label: 'Middle', icon: 'mt:swing-vertical-fixed-middle' },
        { value: 'Fixed Bottom-Middle', label: 'Lower', icon: 'mt:swing-vertical-fixed-lower-middle' },
        { value: 'Fixed Bottom', label: 'Bottom', icon: 'mt:swing-vertical-fixed-bottom' },
        { value: 'Swing Bottom', hide: true },
        { value: 'Swing Middle', hide: true },
        { value: 'Swing Top', hide: true },
        { value: 'Full Swing', label: 'Swing', icon: 'mt:swing-vertical-full' },
      ] },
    ]), states: states(),
  },
  ...['icons', 'dropdown', 'tile'].map((display) => ({
    name: `input-select-${display}`, title: `Input select — ${display}`,
    config: card([{ type: 'input-select', entity: FAN, label: 'Fan speed', display,
      options: fanOptions.map((option) => ({ ...option })) }]), states: states(),
  })),
  ...['icons', 'dropdown', 'tile'].map((display) => ({
    name: `switch-group-${display}`, title: `Switch group — ${display}`,
    config: card([{ type: 'switch-group', label: 'Preset', display,
      entities: presets.map((item) => ({ ...item })) }]), states: states(),
  })),
  {
    name: 'switch-list', title: 'Independent switches',
    config: card([{ type: 'switch-list', label: 'Accessories', entities: presets }]),
    states: states(),
  },
  {
    name: 'button-list', title: 'Quick actions',
    config: card([{ type: 'button-list', label: 'Quick actions', items: [
      { entity: 'input_button.mt_showcase_restart', label: 'Restart', icon: 'mdi:restart' },
    ] }]), states: states(),
  },
  {
    name: 'sensor-list', title: 'Read-only sensor list',
    config: card([{ type: 'sensor-list', label: 'Sensors', items: [
      { entity: TEMPERATURE, label: 'Indoor Temperature', icon: 'mdi:thermometer' },
      { entity: HUMIDITY, label: 'Indoor Humidity', icon: 'mdi:water-percent' },
    ] }]), states: states(),
  },
  ...['tile', 'icon'].map((display) => ({
    name: `entity-tile-${display}`, title: `Entity tiles — ${display}`,
    config: card(sensorTiles(display)), states: states(),
  })),
  {
    name: 'comfort', title: 'Comfort and time to target',
    config: card([{ type: 'climate-hvac-modes' }, { type: 'comfort', show_target_eta: true }], {
      feels_like: { temperature: TEMPERATURE, humidity: HUMIDITY },
    }),
    states: states('cool', { current_temperature: 28.7 }),
    // End at the current reading, not at the cooling curve's asymptote.
    history: {
      [TEMPERATURE]: cool(31, 28.4).map((value, i, values) =>
        i === values.length - 1 ? 28.7 : value),
      [HUMIDITY]: Array(12).fill(46),
    },
  },
];
