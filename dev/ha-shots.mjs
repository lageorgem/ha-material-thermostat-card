/**
 * Render shared showcase examples in the real HA frontend, without writing to HA.
 * Build the local bundle first, then run:
 *   HA_URL=https://your.ui.nabu.casa HA_TOKEN=<token> node dev/ha-shots.mjs
 */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';
import { SHOTS } from './showcase.mjs';

const HA_URL = process.env.HA_URL;
const HA_TOKEN = process.env.HA_TOKEN;
if (!HA_URL || !HA_TOKEN) {
  console.error('Set HA_URL and HA_TOKEN env vars.');
  process.exit(1);
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'assets');
const bundle = readFileSync(resolve(ROOT, 'dist/material-thermostat-card.js'), 'utf8');
mkdirSync(OUT, { recursive: true });

/** Compact recorder samples, evenly spaced across the preceding 30 minutes. */
function hist(values) {
  const end = Math.floor(Date.now() / 1000);
  return values.map((value, index) => ({
    s: String(value),
    lu: end - 1800 + Math.round((1800 * index) / Math.max(1, values.length - 1)),
  }));
}

/** Wait for every HA icon, including icons whose SVG element is created lazily. */
function iconsReady() {
  const card = document.querySelector('#__shot material-thermostat-card');
  if (!card) return false;
  function* walk(root) {
    for (const element of root.querySelectorAll('*')) {
      yield element;
      if (element.shadowRoot) yield* walk(element.shadowRoot);
    }
  }
  if (!card.shadowRoot) return false;
  const elements = [...walk(card.shadowRoot)];
  const icons = elements.filter((element) => element.tagName === 'HA-ICON');
  const svgs = elements.filter((element) => element.tagName === 'HA-SVG-ICON');
  return (
    svgs.length > 0 &&
    icons.every(
      (icon) =>
        icon.shadowRoot &&
        [...walk(icon.shadowRoot)].some((element) => element.tagName === 'HA-SVG-ICON')
    ) &&
    svgs.every((svg) => svg.shadowRoot?.querySelector('path[d]'))
  );
}

async function inject(page, shot) {
  const history = Object.fromEntries(
    Object.entries(shot.history || {}).map(([id, values]) => [id, hist(values)])
  );
  await page.evaluate(
    async ({ shot, history }) => {
      const ha = document.querySelector('home-assistant');
      const real = ha.hass;
      const states = { ...real.states };
      for (const [id, override] of Object.entries(shot.states || {})) {
        const live = states[id];
        states[id] = {
          ...live,
          entity_id: id,
          last_changed: new Date().toISOString(),
          ...override,
          attributes: { ...live?.attributes, ...override.attributes },
        };
      }
      if (shot.history) {
        const id = shot.config.entity;
        states[id] = {
          ...states[id],
          last_changed: new Date(Date.now() - 30 * 60000).toISOString(),
        };
      }
      const hass = {
        ...real,
        states,
        callWS: async (message) => {
          if (message.type === 'history/history_during_period') return history;
          throw new Error(`Unexpected screenshot WS request: ${message.type}`);
        },
        callService: async () => {
          throw new Error('Service calls are disabled during screenshots');
        },
      };

      document.getElementById('__shot')?.remove();
      const wrap = document.createElement('div');
      wrap.id = '__shot';
      // Preserve the applied HA theme without attaching to its live render tree.
      const theme = getComputedStyle(ha);
      for (const property of theme) {
        if (property.startsWith('--'))
          wrap.style.setProperty(property, theme.getPropertyValue(property));
      }
      Object.assign(wrap.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        zIndex: '999999',
        width: '420px',
        padding: '16px',
        boxSizing: 'content-box',
        background: 'var(--primary-background-color)',
        fontFamily: theme.fontFamily,
        color: theme.color,
      });
      document.documentElement.appendChild(wrap);
      const card = document.createElement('material-thermostat-card');
      card.setConfig(shot.config);
      wrap.appendChild(card);
      card.hass = hass;
      await card.updateComplete;
      await document.fonts.ready;
      if (!card.shadowRoot?.querySelector('ha-card')) throw new Error('Card did not render');
    },
    { shot, history }
  );
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
let failures = 0;
const backgrounds = {};
try {
  for (const mode of ['light', 'dark']) {
    // HA can restore a profile theme without its `dark` flag; keep the browser
    // preference aligned too, without changing the user's server-side settings.
    const ctx = await browser.newContext({
      viewport: { width: 1400, height: 1600 },
      deviceScaleFactor: 2,
      colorScheme: mode,
    });
    try {
      await ctx.addInitScript(
        ({ url, token, dark }) => {
          localStorage.setItem('selectedTheme', JSON.stringify({ theme: 'Material You', dark }));
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
        },
        { url: HA_URL, token: HA_TOKEN, dark: mode === 'dark' }
      );
      const page = await ctx.newPage();
      let served = 0;
      await page.route(
        '**/hacsfiles/ha-material-thermostat-card/material-thermostat-card.js*',
        async (route) => {
          await route.fulfill({ status: 200, contentType: 'text/javascript', body: bundle });
          served++;
          console.log(`${mode}: served local dist bundle via HACS route intercept`);
        }
      );
      await page.goto(new URL('/material-thermostat/showcase', HA_URL).href, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await page.waitForFunction(
        (dark) => {
          const ha = document.querySelector('home-assistant');
          return (
            ha?.hass?.states &&
            Object.keys(ha.hass.states).length > 0 &&
            ha.hass.themes?.darkMode === dark &&
            customElements.get('material-thermostat-card')
          );
        },
        mode === 'dark',
        { timeout: 60000 }
      );
      if (!served) throw new Error('Local bundle route was not used');
      // Material You applies its generated palette asynchronously after HA loads.
      await page.waitForTimeout(2000);
      backgrounds[mode] = await page.evaluate(() =>
        getComputedStyle(document.querySelector('home-assistant'))
          .getPropertyValue('--primary-background-color')
          .trim()
      );
      console.log(`${mode} background: ${backgrounds[mode]}`);
      if (!backgrounds[mode] || (mode === 'dark' && backgrounds.dark === backgrounds.light)) {
        throw new Error('Theme mode did not change the background');
      }
      for (const shot of SHOTS) {
        try {
          await inject(page, shot);
          await page.waitForFunction(iconsReady, null, { timeout: 20000 });
          await page.waitForTimeout(700);
          await page.locator('#__shot').screenshot({
            path: resolve(OUT, `${shot.name}-${mode}.png`),
          });
          console.log(`${shot.name} ${mode} ok`);
        } catch (error) {
          failures++;
          console.error(`${shot.name} ${mode} FAILED: ${error.message}`);
        }
      }
    } finally {
      await ctx.close();
    }
  }
  console.log(`backgrounds: light=${backgrounds.light}; dark=${backgrounds.dark}`);
  console.log(
    `done: ${SHOTS.length * 2 - failures}/${SHOTS.length * 2} screenshots; ${failures} failures`
  );
} catch (error) {
  failures++;
  console.error(error.message);
} finally {
  await browser.close();
}
if (failures) process.exitCode = 1;
