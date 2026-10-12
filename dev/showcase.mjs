/** README examples. State/history overrides are screenshot-only, never sent to HA. */
const CLIMATE = 'climate.living_room_ac';
const TEMPERATURE = 'sensor.tmp_1_temperature';
const HUMIDITY = 'sensor.tmp_1_humidity';

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
    features,
    ...overrides,
  };
}

function cooling(current = 26.5, target = 23) {
  return {
    [CLIMATE]: {
      state: 'cool',
      attributes: {
        temperature: target,
        current_temperature: current,
        hvac_action: 'cooling',
        fan_mode: 'auto',
      },
    },
  };
}

function sensorTiles(display = 'tile') {
  return [
    {
      type: 'entity-tile',
      entity: TEMPERATURE,
      name: 'Temperature',
      icon: 'mdi:thermometer',
      display,
      width: 50,
    },
    {
      type: 'entity-tile',
      entity: HUMIDITY,
      name: 'Humidity',
      icon: 'mdi:water-percent',
      display,
      width: 50,
    },
  ];
}

const fanOptions = [
  { value: 'low', label: 'Low', icon: 'mdi:fan-speed-1' },
  { value: 'medium', label: 'Medium', icon: 'mdi:fan-speed-2' },
  { value: 'high', label: 'High', icon: 'mdi:fan-speed-3' },
];

// Real switches, friendly demonstration labels. Dashboard controls operate these devices.
const presets = [
  { entity: 'switch.lamp', label: 'Eco', icon: 'mdi:leaf' },
  { entity: 'switch.pwr_2', label: 'Boost', icon: 'mdi:rocket-launch' },
];

export const SHOTS = [
  {
    name: 'hero',
    title: 'Living Room — cooling',
    config: card([
      { type: 'climate-hvac-modes' },
      { type: 'climate-fan-modes', display: 'dropdown', label: 'Fan speed' },
      ...sensorTiles(),
    ]),
    states: cooling(28.9),
  },
  {
    name: 'dial-heat-cool',
    title: 'Dual setpoint dial',
    config: card([{ type: 'climate-hvac-modes' }], { name: 'Auto' }),
    states: {
      [CLIMATE]: {
        state: 'heat_cool',
        attributes: {
          hvac_modes: ['off', 'auto', 'cool', 'heat', 'dry', 'fan_only', 'heat_cool'],
          supported_features: 3,
          target_temp_low: 20,
          target_temp_high: 24,
          current_temperature: 26.2,
          hvac_action: 'cooling',
        },
      },
    },
  },
  {
    name: 'show-current',
    title: 'Current temperature as primary',
    config: card([{ type: 'climate-hvac-modes' }], { show_current_as_primary: true }),
    states: cooling(26.5),
  },
  {
    name: 'comfort',
    title: 'Comfort and time to target',
    config: card([{ type: 'climate-hvac-modes' }, { type: 'comfort', show_target_eta: true }], {
      feels_like: { temperature: TEMPERATURE, humidity: HUMIDITY },
    }),
    states: {
      ...cooling(28.7),
      [TEMPERATURE]: { state: '28.7' },
      [HUMIDITY]: { state: '46' },
    },
    // End at the current sensor reading, not at the cooling curve's asymptote.
    history: {
      [TEMPERATURE]: cool(31, 28.4).map((value, i, values) =>
        i === values.length - 1 ? 28.7 : value
      ),
      [HUMIDITY]: Array(12).fill(46),
    },
  },
  ...['icons', 'dropdown', 'tile'].map((display) => ({
    name: `hvac-${display}`,
    title: `HVAC modes — ${display}`,
    config: card([{ type: 'climate-hvac-modes', display, label: 'Mode' }]),
    states: cooling(),
  })),
  {
    name: 'option-overrides',
    title: 'Option labels, icons, colors and hiding',
    config: card([
      {
        type: 'climate-hvac-modes',
        label: 'Mode',
        options: [
          { value: 'cool', label: 'Chill', icon: 'mdi:snowflake', color: '#00897b' },
          { value: 'heat', label: 'Cozy', icon: 'mdi:fire', color: '#ef6c00' },
          { value: 'fan_only', hide: true },
        ],
      },
      {
        type: 'climate-fan-modes',
        display: 'dropdown',
        label: 'Fan speed',
        options: [
          { value: 'high', label: 'Turbo', icon: 'mdi:fan-chevron-up' },
          { value: 'auto', icon: 'mdi:fan-auto' },
        ],
      },
      {
        type: 'climate-swing-modes',
        label: 'Swing',
        options: [
          { value: 'Fixed Top', label: 'Top', icon: 'mt:swing-vertical-fixed-top' },
          {
            value: 'Fixed Top-Middle',
            label: 'Upper',
            icon: 'mt:swing-vertical-fixed-upper-middle',
          },
          { value: 'Fixed Middle', label: 'Middle', icon: 'mt:swing-vertical-fixed-middle' },
          {
            value: 'Fixed Bottom-Middle',
            label: 'Lower',
            icon: 'mt:swing-vertical-fixed-lower-middle',
          },
          { value: 'Fixed Bottom', label: 'Bottom', icon: 'mt:swing-vertical-fixed-bottom' },
          { value: 'Swing Bottom', hide: true },
          { value: 'Swing Middle', hide: true },
          { value: 'Swing Top', hide: true },
          { value: 'Full Swing', label: 'Swing', icon: 'mt:swing-vertical-full' },
        ],
      },
    ]),
    states: {
      [CLIMATE]: {
        ...cooling()[CLIMATE],
        attributes: { ...cooling()[CLIMATE].attributes, swing_mode: 'Full Swing' },
      },
    },
  },
  ...['icons', 'dropdown', 'tile'].map((display) => ({
    name: `input-select-${display}`,
    title: `Input select — ${display}`,
    config: card([
      {
        type: 'input-select',
        entity: 'input_select.bedroom_fan_speed',
        label: 'Fan speed',
        display,
        options: fanOptions.map((option) => ({ ...option })),
      },
    ]),
    states: { ...cooling(), 'input_select.bedroom_fan_speed': { state: 'medium' } },
  })),
  ...['icons', 'dropdown', 'tile'].map((display) => ({
    name: `switch-group-${display}`,
    title: `Switch group — ${display}`,
    config: card([
      {
        type: 'switch-group',
        label: 'Preset',
        display,
        entities: presets.map((item) => ({ ...item })),
      },
    ]),
    states: { ...cooling(), 'switch.lamp': { state: 'on' }, 'switch.pwr_2': { state: 'off' } },
  })),
  {
    name: 'switch-list',
    title: 'Independent switches',
    config: card([
      {
        type: 'switch-list',
        label: 'Accessories',
        entities: [
          { entity: 'switch.lamp', label: 'Lamp', icon: 'mdi:lamp' },
          { entity: 'switch.pwr_2', label: 'Purifier', icon: 'mdi:air-purifier' },
        ],
      },
    ]),
    states: { ...cooling(), 'switch.lamp': { state: 'on' }, 'switch.pwr_2': { state: 'on' } },
  },
  {
    name: 'button-list',
    title: 'Independent buttons and scripts',
    config: card([
      {
        type: 'button-list',
        label: 'Quick actions',
        items: [
          {
            entity: 'button.zigbee2mqtt_bridge_restart',
            label: 'Restart bridge',
            icon: 'mdi:restart',
          },
          { entity: 'script.bedroom_fan_set_power', label: 'Fan power', icon: 'mdi:fan' },
          { entity: 'script.bedroom_fan_set_mode', label: 'Fan mode', icon: 'mdi:fan-auto' },
        ],
      },
    ]),
    states: cooling(),
  },
  {
    name: 'sensor-list',
    title: 'Read-only sensor list',
    config: card([
      {
        type: 'sensor-list',
        label: 'Sensors',
        items: [
          { entity: TEMPERATURE, label: 'Indoor Temperature', icon: 'mdi:thermometer' },
          { entity: HUMIDITY, label: 'Indoor Humidity', icon: 'mdi:water-percent' },
          { entity: 'sensor.tmp_3_temperature', label: 'Outdoor', icon: 'mdi:thermometer' },
        ],
      },
    ]),
    states: cooling(),
  },
  ...['icon', 'tile'].map((display) => ({
    name: `entity-tile-${display}`,
    title: `Entity tiles — ${display}`,
    config: card(sensorTiles(display)),
    states: cooling(),
  })),
];
