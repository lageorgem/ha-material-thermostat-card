/**
 * README screenshot generator.
 *
 * Drives a REAL Home Assistant frontend (so `ha-icon`/MDI glyphs and the active
 * theme render for real), injects the locally-built card bundle, then renders a
 * set of configs against a *doctored copy* of the live `hass` — overriding the
 * test thermostat's state/attributes purely in-page so we can show cool / heat /
 * heat_cool / comfort without touching the real device or dashboard.
 *
 * Usage:
 *   npm run build
 *   HA_URL=https://your.ui.nabu.casa HA_TOKEN=<long-lived-token> node dev/ha-shots.mjs
 *
 * Outputs PNGs to assets/.
 */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const HA_URL = process.env.HA_URL;
const HA_TOKEN = process.env.HA_TOKEN;
if (!HA_URL || !HA_TOKEN) {
  console.error('Set HA_URL and HA_TOKEN env vars.');
  process.exit(1);
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist/material-thermostat-card.js');
const OUT = resolve(ROOT, 'assets');
mkdirSync(OUT, { recursive: true });

const CLIMATE = 'climate.test_thermostat';
const T_SENSOR = 'sensor.tmp_1_temperature';
const H_SENSOR = 'sensor.tmp_1_humidity';

/** Compact recorder history (value-changes) for one sensor: [{s,lu}] in epoch seconds. */
function hist(values, sinceMinAgo = 30) {
  const startSec = Math.floor(Date.now() / 1000) - sinceMinAgo * 60;
  const stepSec = ((sinceMinAgo * 60) / (values.length - 1)) | 0;
  return values.map((v, i) => ({ s: String(v), lu: startSec + i * stepSec }));
}
/** A gentle cooling curve from `from`→`to` over n points (for the comfort ETA). */
function cool(from, to, n = 12) {
  return Array.from({ length: n }, (_, i) => +(to + (from - to) * Math.exp(-2.2 * (i / (n - 1)))).toFixed(1));
}

const SHOTS = [
  {
    file: 'hero.png',
    width: 420,
    thermostat: { state: 'cool', attributes: { temperature: 23, current_temperature: 28.9, hvac_action: 'cooling' } },
    config: {
      type: 'custom:material-thermostat-card',
      entity: CLIMATE,
      name: 'Living Room',
      features: [
        { type: 'climate-hvac-modes' },
        { type: 'climate-fan-modes', display: 'dropdown' },
        { type: 'entity-tile', entity: T_SENSOR, name: 'Temperature', icon: 'mdi:thermometer', width: 50 },
        { type: 'entity-tile', entity: H_SENSOR, name: 'Humidity', icon: 'mdi:water-percent', width: 50 },
      ],
    },
  },
  {
    file: 'dial-heat.png',
    width: 360,
    thermostat: { state: 'heat', attributes: { temperature: 23, current_temperature: 19.4, hvac_action: 'heating' } },
    config: { type: 'custom:material-thermostat-card', entity: CLIMATE, name: 'Bedroom', features: [{ type: 'climate-hvac-modes' }] },
  },
  {
    file: 'dial-heat-cool.png',
    width: 360,
    thermostat: {
      state: 'heat_cool',
      attributes: { target_temp_low: 20, target_temp_high: 24, current_temperature: 26.2, hvac_action: 'cooling' },
    },
    config: { type: 'custom:material-thermostat-card', entity: CLIMATE, name: 'Auto', features: [{ type: 'climate-hvac-modes' }] },
  },
  {
    file: 'comfort.png',
    width: 420,
    thermostat: { state: 'cool', attributes: { temperature: 23, current_temperature: 28.7, hvac_action: 'cooling' } },
    extraStates: {
      [T_SENSOR]: (s) => ({ ...s, state: '28.7', last_changed: new Date().toISOString() }),
      [H_SENSOR]: (s) => ({ ...s, state: '46' }),
    },
    history: { [T_SENSOR]: hist(cool(31, 28.7)), [H_SENSOR]: hist(Array(12).fill(46)) },
    config: {
      type: 'custom:material-thermostat-card',
      entity: CLIMATE,
      name: 'Living Room',
      feels_like: { temperature: T_SENSOR, humidity: H_SENSOR },
      features: [{ type: 'climate-hvac-modes' }, { type: 'comfort', show_target_eta: true }],
    },
  },
  {
    file: 'features.png',
    width: 420,
    thermostat: { state: 'cool', attributes: { temperature: 23, current_temperature: 26.5, hvac_action: 'cooling' } },
    extraStates: {
      'switch.eco': () => ({ entity_id: 'switch.eco', state: 'on', attributes: { friendly_name: 'Eco' } }),
      'switch.boost': () => ({ entity_id: 'switch.boost', state: 'off', attributes: { friendly_name: 'Boost' } }),
      'switch.purifier': () => ({ entity_id: 'switch.purifier', state: 'on', attributes: { friendly_name: 'Purifier' } }),
      'switch.lamp': () => ({ entity_id: 'switch.lamp', state: 'off', attributes: { friendly_name: 'Lamp' } }),
    },
    config: {
      type: 'custom:material-thermostat-card',
      entity: CLIMATE,
      name: 'Living Room',
      features: [
        { type: 'climate-hvac-modes' },
        {
          type: 'switch-group',
          label: 'Preset',
          entities: [
            { entity: 'switch.eco', label: 'Eco', icon: 'mdi:leaf' },
            { entity: 'switch.boost', label: 'Boost', icon: 'mdi:rocket-launch' },
          ],
        },
        { type: 'switch-list', entities: [{ entity: 'switch.purifier', icon: 'mdi:air-purifier' }, { entity: 'switch.lamp', icon: 'mdi:lamp' }] },
        { type: 'entity-tile', entity: T_SENSOR, name: 'Temp', icon: 'mdi:thermometer', width: 50 },
        { type: 'entity-tile', entity: H_SENSOR, name: 'Humidity', icon: 'mdi:water-percent', width: 50 },
      ],
    },
  },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 2 });
await ctx.addInitScript(([url, token]) => {
  localStorage.setItem(
    'hassTokens',
    JSON.stringify({
      hassUrl: url,
      clientId: url + '/',
      access_token: token,
      token_type: 'Bearer',
      expires_in: 315360000,
      expires: Date.now() + 315360000000,
      refresh_token: 'x',
    })
  );
}, [HA_URL, HA_TOKEN]);

const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && console.log('PAGE ERR:', m.text().slice(0, 160)));
// Navigate to a real, stable dashboard (a bare /lovelace/0 redirects to the
// configured default and would wipe our injected overlay mid-run).
const DASHBOARD = process.env.HA_DASHBOARD || '/home/overview';
await page.goto(HA_URL + DASHBOARD, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForFunction(
  () => {
    const ha = document.querySelector('home-assistant');
    return ha && ha.hass && ha.hass.states && Object.keys(ha.hass.states).length > 0;
  },
  { timeout: 40000 }
);
await page.addScriptTag({ path: DIST, type: 'module' });
await page.waitForFunction(() => !!customElements.get('material-thermostat-card'), { timeout: 15000 });

/** Inject (or re-inject) the overlay for one shot against a doctored hass copy. */
async function inject(shot) {
  await page.evaluate(
    async (shot) => {
      const ha = document.querySelector('home-assistant');
      const real = ha.hass;
      const states = { ...real.states };
      const climate = states['climate.test_thermostat'];
      states['climate.test_thermostat'] = {
        ...climate,
        state: shot.thermostat.state,
        last_changed: new Date(Date.now() - 30 * 60000).toISOString(),
        attributes: { ...climate.attributes, ...shot.thermostat.attributes },
      };
      for (const [id, fn] of Object.entries(shot.extraStates || {})) {
        const make = new Function('s', 'return (' + fn + ')(s)');
        states[id] = make(states[id]);
      }
      const hass = { ...real, states, callWS: async () => shot.history || {} };

      const prev = document.getElementById('__shot');
      if (prev) prev.remove();
      const wrap = document.createElement('div');
      wrap.id = '__shot';
      Object.assign(wrap.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        zIndex: '999999',
        width: shot.width + 'px',
        padding: '20px',
        boxSizing: 'content-box',
        background: '#15151a', // consistent dark frame so the card reads clearly
        borderRadius: '20px',
      });
      // Append to <html>, not <body>: HA re-renders/clears body, which would
      // clobber the overlay mid-run. Custom props inherit from :root regardless.
      document.documentElement.appendChild(wrap);

      const card = document.createElement('material-thermostat-card');
      card.setConfig(shot.config);
      wrap.appendChild(card);
      card.hass = hass;
      if (card.updateComplete) await card.updateComplete.catch(() => {});
    },
    { ...shot, extraStates: Object.fromEntries(Object.entries(shot.extraStates || {}).map(([k, v]) => [k, v.toString()])) }
  );
}

/** True once the overlay exists and every MDI glyph in the card has resolved. */
function iconsReady() {
  const card = document.querySelector('#__shot material-thermostat-card');
  if (!card) return false;
  function* walk(root) {
    for (const e of root.querySelectorAll('*')) {
      yield e;
      if (e.shadowRoot) yield* walk(e.shadowRoot);
    }
  }
  const icons = [...walk(card)].filter((e) => e.tagName === 'HA-SVG-ICON');
  // ha-icon creates ha-svg-icon lazily, so an early length===0 must NOT pass.
  return icons.length > 0 && icons.every((e) => e.shadowRoot && e.shadowRoot.querySelector('path'));
}

for (const shot of SHOTS) {
  let ok = false;
  for (let attempt = 1; attempt <= 4 && !ok; attempt++) {
    await inject(shot);
    await page.waitForFunction(iconsReady, { timeout: 12000 }).catch(() => {});
    await page.waitForTimeout(500);
    const handle = await page.evaluateHandle(() => {
      const w = document.getElementById('__shot');
      return w && w.querySelector('material-thermostat-card') ? w : null;
    });
    const el = handle.asElement();
    if (el) {
      await el.screenshot({ path: resolve(OUT, shot.file) });
      ok = true;
    }
  }
  console.log(ok ? 'shot: ' + shot.file : 'FAILED: ' + shot.file);
}

await browser.close();
console.log('done');
