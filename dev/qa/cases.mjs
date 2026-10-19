import { pathToFileURL } from 'node:url';
import { SCENARIOS, AUX } from './matrix.mjs';

// Highest risk: capability/domain filtering and option transformations. Expectations
// are derived from the fixture contract, never from the rendered implementation.
const SELECTORS = [
  ['climate-hvac-modes', 'hvac', 'hvac_modes'],
  ['climate-preset-modes', 'preset', 'preset_modes'],
  ['climate-fan-modes', 'fan', 'fan_modes'],
  ['climate-swing-modes', 'swing', 'swing_modes'],
  ['climate-swing-horizontal-modes', 'swing_horizontal', 'swing_horizontal_modes'],
  ['water-heater-operation-modes', 'operation', 'operation_modes'],
];
const DISPLAYS = ['icons', 'dropdown', 'tile'];
const VARIANTS = ['plain', 'include', 'order', 'overrides', 'label-width', 'stock'];
const OPERATION_ORDER = ['electric', 'gas', 'heat_pump', 'eco', 'performance', 'high_demand', 'off'];
const AWAY = 'water-heater-away-mode';
const items = (entities) => entities.map((entity) => ({ entity }));
const feelsLike = () => ({ temperature: AUX.sensors.temperature, humidity: AUX.sensors.humidity });
const applicable = (scenario, type) => scenario.domain === 'water_heater'
  ? type.startsWith('water-heater-')
  : type.startsWith('climate-');

function visibleValues(scenario, feature, key, stockKey) {
  let values = [...scenario.expect.values[key]];
  if (key === 'operation') {
    values = [...OPERATION_ORDER.filter((v) => values.includes(v)), ...values.filter((v) => !OPERATION_ORDER.includes(v))];
  }
  const include = feature.include ?? feature[stockKey];
  if (include?.length) values = include.filter((v) => values.includes(v));
  if (feature.order?.length) {
    values = [...feature.order.filter((v) => values.includes(v)), ...values.filter((v) => !feature.order.includes(v))];
  }
  return values.filter((v) => !feature.options?.some((o) => o.value === v && o.hide));
}

function expectation(scenario, config) {
  const { expect: e } = scenario;
  const selectors = [];
  const aux = [];
  let away = null;
  for (const feature of config.features ?? []) {
    const descriptor = SELECTORS.find(([type]) => type === feature.type);
    if (descriptor) {
      const [type, key, stockKey] = descriptor;
      if (!applicable(scenario, type) || !Object.hasOwn(e.values, key)) continue;
      const values = visibleValues(scenario, feature, key, stockKey);
      if (!values.length) continue;
      const active = e.active[key];
      selectors.push({
        type, display: feature.display ?? (feature.style === 'dropdown' ? 'dropdown' : 'icons'),
        items: values,
        ordered: Boolean(feature.include || feature.order || feature[stockKey]),
        labels: Object.fromEntries((feature.options ?? []).filter((o) => o.label !== undefined && values.includes(o.value)).map((o) => [o.value, o.label])),
        disabled: e.unavailable, active: values.includes(active) ? active : null,
      });
    } else if (feature.type === AWAY) {
      if (scenario.domain === 'water_heater' && e.away !== null) {
        away = { display: feature.display ?? 'icons', state: e.away, label: feature.label ?? null, disabled: e.unavailable };
      }
    } else if (feature.type !== 'comfort' || scenario.domain === 'climate') {
      aux.push(feature.type);
    }
  }
  return {
    sliders: e.model === 'none' ? 0 : e.model === 'dual' ? 2 : 1,
    plusMinus: e.model !== 'none', unavailable: e.unavailable,
    stateLabel: Boolean(config.show_state_label && !e.unavailable),
    selectors, away, aux: [...new Set(aux)], interactive: scenario.interactive,
  };
}

function allFeatures(scenario, display = 'icons') {
  const features = SELECTORS.filter(([type, key]) => applicable(scenario, type) && Object.hasOwn(scenario.expect.values, key))
    .map(([type]) => ({ type, display }));
  if (scenario.domain === 'water_heater' && scenario.expect.away !== null) {
    features.push({ type: AWAY, display: display === 'dropdown' ? 'tile' : display });
  }
  return features;
}

function variantFeature(scenario, descriptor, display, variant) {
  const [type, key, stockKey] = descriptor;
  const values = scenario.expect.values[key];
  const subset = values.slice(0, 2).reverse();
  const feature = { type, display };
  if (variant === 'include') feature.include = subset;
  if (variant === 'order') feature.order = [...values].reverse();
  if (variant === 'overrides') feature.options = [
    { value: values[0], label: 'QA override', icon: 'mdi:star', color: '#e91e63' },
    ...(values.length > 1 ? [{ value: values[1], hide: true }] : []),
  ];
  if (variant === 'label-width') Object.assign(feature, { label: 'QA selector', width: 50 });
  if (variant === 'stock') {
    delete feature.display;
    // Stock accepts only icons/dropdown; tile coverage uses its icons fallback.
    feature.style = display === 'tile' ? 'icons' : display;
    feature[stockKey] = subset;
  }
  return feature;
}

export function buildCases({ theme } = {}) {
  const cases = [];
  const scenarioById = (id) => {
    const result = SCENARIOS.find((s) => s.id === id);
    if (!result) throw new Error(`Required scenario missing: ${id}`);
    return result;
  };
  const add = (id, view, section, scenario, options = {}, kind = 'ours') => {
    const config = {
      type: kind === 'ours' ? 'custom:material-thermostat-card' : 'thermostat',
      entity: scenario.entity_id,
      ...(kind === 'ours' ? { grid_options: { columns: 6, rows: 'auto' } } : {}),
      ...options, qa_id: id,
    };
    cases.push({ id, view, section, kind, scenario: scenario.id, config, expect: kind === 'ours' ? expectation(scenario, config) : null });
  };
  for (const scenario of SCENARIOS) {
    const view = `s-${scenario.id}`;
    for (const dial_style of ['halo', 'minimal', 'google']) {
      for (const show_current_as_primary of [false, true]) {
        for (const show_state_label of [false, true]) {
          add(`${view}-${dial_style}-current-${show_current_as_primary}-state-${show_state_label}`, view, 'Options', scenario,
            { dial_style, show_current_as_primary, show_state_label, features: allFeatures(scenario) });
        }
      }
    }
    for (const display of DISPLAYS) add(`${view}-${display}`, view, 'Displays', scenario, { features: allFeatures(scenario, display) });
    add(`${view}-stock`, view, 'Stock', scenario, {
      features: allFeatures(scenario).filter((f) => f.type !== AWAY).map(({ type }) => ({ type, style: 'icons' })),
    }, 'stock');
  }
  const full = scenarioById('c-mqtt-full');
  const tank = scenarioById('w-mqtt-tank');
  for (const [view, scenario, descriptors] of [
    ['features-climate', full, SELECTORS.slice(0, 5)],
    ['features-wh', tank, SELECTORS.slice(5)],
  ]) {
    for (const descriptor of descriptors) for (const display of DISPLAYS) for (const variant of VARIANTS) {
      add(`${view}-${descriptor[1]}-${display}-${variant}`, view, `${descriptor[0]} / ${display}`, scenario,
        { features: [variantFeature(scenario, descriptor, display, variant)] });
    }
  }
  add('features-climate-mismatch', 'features-climate', 'Domain mismatch', full, { features: [{ type: SELECTORS[5][0], display: 'icons' }] });
  add('features-wh-mismatch', 'features-wh', 'Domain mismatch', tank, { features: [{ type: SELECTORS[0][0], display: 'icons' }, { type: 'comfort' }], feels_like: feelsLike() });
  for (const id of ['w-away-on', 'w-away-off']) for (const display of ['icons', 'tile']) for (const label of [undefined, 'Holiday']) {
    add(`away-${id}-${display}-${label ?? 'default'}`, 'features-wh', 'Away states and labels', scenarioById(id),
      { features: [{ type: AWAY, display, ...(label ? { label } : {}) }] });
  }
  for (const id of ['w-no-away', 'w-legacy', 'w-unavailable']) {
    add(`away-${id}`, 'features-wh', 'Away capability guards', scenarioById(id), { features: [{ type: AWAY, display: 'icons' }] });
  }
  for (const scenario of [full, tank]) {
    const addAux = (suffix, feature, options = {}) => add(`aux-${scenario.id}-${suffix}`, 'aux', scenario.title, scenario, { features: [feature], ...options });
    for (const display of DISPLAYS) {
      for (const override of [false, true]) addAux(`input-select-${display}-${override ? 'overrides' : 'plain'}`,
        { type: 'input-select', entity: AUX.input_select, display,
          ...(override ? { options: [{ value: 'low', label: 'Low QA', icon: 'mdi:star', color: '#e91e63' }, { value: 'medium', hide: true }] } : {}) });
      addAux(`switch-group-${display}`, { type: 'switch-group', display, entities: items(AUX.switches) });
    }
    addAux('switch-list', { type: 'switch-list', entities: items(AUX.switches) });
    addAux('button-list', { type: 'button-list', items: items(AUX.buttons) });
    for (const display of ['icon', 'tile']) for (const width of [50, 100]) {
      addAux(`entity-tile-${display}-${width}`, { type: 'entity-tile', entity: AUX.sensors.power, display, width });
    }
    addAux('sensor-list', { type: 'sensor-list', items: items(Object.values(AUX.sensors)) });
    if (scenario.domain === 'climate') addAux('comfort', { type: 'comfort' }, { feels_like: feelsLike() });
  }
  const layouts = [];
  for (const columns of [3, 6, 9, 12]) layouts.push([`columns-${columns}`, { grid_options: { columns, rows: 'auto' }, features: allFeatures(full) }]);
  layouts.push(['wide', { grid_options: { columns: 12, rows: 'auto' }, features: allFeatures(full).map((f) => ({ ...f, width: 50 })) }]);
  layouts.push(['aux', { features: [
    { type: 'entity-tile', entity: AUX.sensors.temperature, width: 50 },
    { type: 'entity-tile', entity: AUX.sensors.humidity, width: 50 },
    { type: 'sensor-list', items: items(Object.values(AUX.sensors)) },
  ] }]);
  for (const [suffix, options] of layouts) add(`layout-${suffix}`, 'layout', 'Section widths', full, options);
  for (const [suffix, options] of [layouts[0], layouts[4], layouts[5]]) add(`masonry-${suffix}`, 'layout-masonry', 'Masonry layouts', full, options);

  const heat = scenarioById('c-mqtt-heat');
  const names = [undefined, 'Custom name', [{ type: 'entity' }], [{ type: 'device' }], [{ type: 'area' }], [{ type: 'text', text: 'QA' }, { type: 'entity' }]];
  for (const [index, name] of names.entries()) add(`name-${index}`, 'names-themes', 'Names', heat, name === undefined ? {} : { name });
  for (const font of [undefined, 'theme']) for (const themed of theme ? [false, true] : [false]) {
    add(`font-${font ?? 'default'}-${themed ? 'themed' : 'default'}`, 'names-themes', 'Fonts and themes', heat,
      { ...(font ? { font } : {}), ...(themed ? { theme } : {}) });
  }
  for (const scenario of [heat, tank]) add(`feels-like-${scenario.id}`, 'names-themes', 'Feels-like domain handling', scenario,
    { feels_like: { ...feelsLike(), show_as_current: true } });
  return cases;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Mirror the declared feature shapes; stock aliases are checked as the explicit
// normalizeConfig compatibility input, not mistaken for native feature keys.
function checkFeature(feature) {
  const descriptor = SELECTORS.find(([type]) => type === feature.type);
  const common = ['type', 'width'];
  const selectorKeys = ['display', 'label', 'include', 'order', 'options'];
  let allowed;
  if (descriptor) allowed = [...common, ...selectorKeys, 'style', descriptor[2]];
  else {
    const keys = {
      [AWAY]: ['display', 'label'],
      'input-select': [...selectorKeys, 'entity'],
      'switch-group': ['display', 'label', 'entities'],
      'switch-list': ['label', 'entities'],
      'button-list': ['label', 'items'],
      'sensor-list': ['label', 'items'],
      'entity-tile': ['entity', 'name', 'icon', 'color', 'display', 'tap_action', 'compact'],
      comfort: ['show_target_eta'],
    };
    assert(Object.hasOwn(keys, feature.type), `Unknown feature: ${feature.type}`);
    allowed = [...common, ...keys[feature.type]];
  }
  for (const key of Object.keys(feature)) assert(allowed.includes(key), `${feature.type}: unexpected ${key}`);
  if (feature.width !== undefined) assert(Number.isInteger(feature.width) && feature.width >= 10 && feature.width <= 100 && feature.width % 10 === 0, 'Invalid feature width');
  if (feature.display !== undefined) assert((feature.type === 'entity-tile' ? ['icon', 'tile'] : feature.type === AWAY ? ['icons', 'tile'] : DISPLAYS).includes(feature.display), 'Invalid feature display');
  if (feature.style !== undefined) assert(['icons', 'dropdown'].includes(feature.style), 'Invalid stock style');
  for (const key of ['label', 'entity', 'name', 'icon', 'color']) if (feature[key] !== undefined) assert(typeof feature[key] === 'string', `Invalid ${key}`);
  for (const key of ['compact', 'show_target_eta']) if (feature[key] !== undefined) assert(typeof feature[key] === 'boolean', `Invalid ${key}`);
  for (const key of ['include', 'order', ...(descriptor ? [descriptor[2]] : [])]) {
    if (feature[key] !== undefined) assert(Array.isArray(feature[key]) && feature[key].every((v) => typeof v === 'string'), `Invalid ${key}`);
  }
  if (feature.options !== undefined) {
    assert(Array.isArray(feature.options), 'Invalid options');
    for (const option of feature.options) {
      assert(option && typeof option.value === 'string', 'Invalid option value');
      for (const [key, value] of Object.entries(option)) assert(['value', 'label', 'icon', 'color'].includes(key) ? typeof value === 'string' : key === 'hide' && typeof value === 'boolean', `Invalid option ${key}`);
    }
  }
  const list = ['switch-group', 'switch-list'].includes(feature.type) ? 'entities' : ['button-list', 'sensor-list'].includes(feature.type) ? 'items' : null;
  if (list) {
    assert(Array.isArray(feature[list]) && feature[list].length > 0, `${feature.type}: missing ${list}`);
    for (const item of feature[list]) {
      assert(item && typeof item.entity === 'string', `${feature.type}: invalid entity item`);
      for (const [key, value] of Object.entries(item)) assert(['entity', 'label', 'icon', 'color'].includes(key) && typeof value === 'string', `${feature.type}: invalid item ${key}`);
    }
  }
  if (['entity-tile', 'input-select'].includes(feature.type)) assert(typeof feature.entity === 'string', `${feature.type}: missing entity`);
}

function selfCheck() {
  const cases = buildCases();
  assert(new Set(cases.map((c) => c.id)).size === cases.length, 'Duplicate case IDs');
  for (const entry of cases) {
    assert(entry.config.qa_id === entry.id, `Missing qa_id: ${entry.id}`);
    assert(entry.kind === 'stock' ? entry.expect === null : entry.expect !== null, `Invalid expectation: ${entry.id}`);
    for (const feature of entry.config.features ?? []) checkFeature(feature);
  }
  for (const scenario of SCENARIOS) {
    const entries = cases.filter((c) => c.view === `s-${scenario.id}`);
    assert(entries.length === 16 && entries.filter((c) => c.kind === 'ours').length === 15, `Incomplete scenario view: ${scenario.id}`);
  }
  assert(cases.filter((c) => c.view === 'features-climate').length === 91, 'Incomplete climate feature matrix');
  assert(cases.filter((c) => c.view === 'features-wh').length === 30, 'Incomplete water-heater feature matrix');
  console.log(`Validated ${cases.length} cases: ${cases.filter((c) => c.kind === 'ours').length} ours, ${cases.filter((c) => c.kind === 'stock').length} stock; ${SCENARIOS.length} scenario views; unique IDs and feature shapes OK`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { selfCheck(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
