export const URL_PATH = 'mt-parity-qa';
export const CLIMATE_FEATURES = ['climate-hvac-modes', 'climate-preset-modes', 'climate-fan-modes', 'climate-swing-modes', 'climate-swing-horizontal-modes'];
const features = (display) => CLIMATE_FEATURES.map((type) => ({ type, display }));
const hvac = { type: 'climate-hvac-modes', display: 'icons' };
const operation = { type: 'water-heater-operation-modes', display: 'icons' };
const entry = (id, entity, config = {}) => ({ id, entity: `${entity.startsWith('wh:') ? 'water_heater' : 'climate'}.mtqa_${entity.replace('wh:', '')}`, config });
export const CASES = [
  entry('full-icons', 'full', { features: features('icons'), show_state_label: true }),
  entry('full-dropdown', 'full', { features: features('dropdown') }),
  entry('full-tile', 'full', { features: features('tile'), dial_style: 'google' }),
  entry('stock-yaml', 'full', { features: [
    { type: 'climate-hvac-modes', style: 'dropdown', hvac_modes: ['heat', 'cool', 'off'] },
    { type: 'climate-preset-modes', style: 'dropdown', preset_modes: ['eco', 'comfort'] },
    { type: 'climate-swing-horizontal-modes', style: 'dropdown', swing_horizontal_modes: ['left', 'right'] },
  ] }),
  entry('range-auto', 'auto_range', { show_current_as_primary: true }),
  entry('range-mqtt', 'range', { features: [hvac, { type: 'climate-preset-modes', display: 'icons' }] }),
  entry('heat', 'heat', { name: [{ type: 'text', text: 'QA' }, { type: 'entity' }] }),
  entry('reject', 'reject'), entry('fan-readonly', 'fan', { features: [hvac, { type: 'climate-fan-modes', display: 'icons' }] }),
  entry('off', 'off'), entry('climate-unavailable', 'unavailable', { features: [hvac] }),
  entry('wh-tank', 'wh:tank', { features: [operation], show_state_label: true }),
  entry('wh-tank-dropdown', 'wh:tank', { features: [{ type: operation.type, style: 'dropdown', operation_modes: ['eco', 'gas', 'off'] }] }),
  entry('wh-away', 'wh:away', { features: [{ ...operation, display: 'tile' }, { type: 'water-heater-away-mode', display: 'icons' }] }),
  entry('wh-basic', 'wh:basic'), entry('wh-readonly', 'wh:readonly'),
  entry('wh-unavailable', 'wh:unavailable', { features: [operation] }),
  entry('wh-with-aux', 'wh:tank', { features: [operation, { type: 'sensor-list', entities: ['sensor.tmp_1_temperature'] }] }),
];
const listKey = { 'climate-hvac-modes': 'hvac_modes', 'climate-preset-modes': 'preset_modes', 'climate-fan-modes': 'fan_modes', 'climate-swing-modes': 'swing_modes', 'climate-swing-horizontal-modes': 'swing_horizontal_modes', 'water-heater-operation-modes': 'operation_modes' };
export function buildDashboard(theme) {
  return { title: 'MT Parity QA', views: [{ title: 'Parity', path: '0', type: 'sections', max_columns: 2,
    sections: CASES.map(({ id, entity, config }) => {
      const { features: rows = [], ...options } = config;
      const stockFeatures = rows.filter((f) => !['sensor-list', 'water-heater-away-mode'].includes(f.type)).map(({ display, include, ...f }) => ({
        ...f, ...(display ? { style: display === 'tile' ? 'dropdown' : display } : {}), ...(include ? { [listKey[f.type]]: include } : {}),
      }));
      return { type: 'grid', column_span: 2, cards: [
        { type: 'heading', heading: `QA:${id}` },
        { type: 'custom:material-thermostat-card', entity, ...options, features: rows, ...(id === 'heat' && theme ? { theme } : {}), grid_options: { columns: 6, rows: 'auto' } },
        { type: 'thermostat', entity, features: stockFeatures, ...(options.name ? { name: options.name } : {}), ...(id === 'heat' && theme ? { theme } : {}), ...(options.show_current_as_primary ? { show_current_as_primary: true } : {}), grid_options: { columns: 6, rows: 'auto' } },
      ] };
    }),
  }] };
}
