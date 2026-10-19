import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { CASES, URL_PATH } from './dashboard.mjs';
import { credentials, safeError, TIMEOUT } from './ha-client.mjs';

// All component-internal selectors live here. CSS pierces Playwright's open shadow roots.
const S = {
  card: 'material-thermostat-card', stock: 'hui-thermostat-card', heading: 'hui-heading-card',
  shell: 'ha-card', dial: 'mt-circular-dial', slider: '[role="slider"]',
  increase: '.adjust .step:last-child', value: '.value-text',
  row: 'mt-selector-row', chip: '.chip', dropdown: 'mt-dropdown', trigger: '.trigger', option: '.opt',
};
const JOURNEYS = [
  ['J1', ['full-icons'], 'HVAC cool frame + live state, restore original mode'],
  ['J2', ['full-icons'], 'Preset/fan/swing/horizontal frames + live attributes'],
  ['J3', ['full-icons'], 'One debounced temperature frame, previous + 0.5'],
  ['J4', ['range-mqtt'], 'Range temperature frame includes low and high'],
  ['J5', ['range-auto'], 'Two sliders in auto mode'],
  ['J6', ['reject'], 'Rejected optimistic temperature returns to server value'],
  ['J7', ['fan-readonly', 'wh-readonly'], 'Read-only: no increment or sliders'],
  ['J8', ['wh-tank'], 'Water heater increment and Eco operation frame + state'],
  ['J9', ['wh-away'], 'Away toggle frame has away_mode false'],
  ['J10', ['climate-unavailable', 'wh-unavailable'], 'Unavailable label; mode interaction emits no service calls'],
  ['J11', ['stock-yaml'], 'Stock syntax offers only heat/cool/off'],
  ['J12', CASES.map((c) => c.id), 'Every selected section: no overlap or clipped ha-card'],
  ['J13', ['heat', 'full-icons', 'wh-tank'], 'German slider decimal uses comma; HVAC and water heater titles translated'],
];
function options() {
  const args = process.argv.slice(2);
  const opts = { lang: 'en', only: null, headed: false, dry: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') opts.dry = true;
    else if (arg === '--headed') opts.headed = true;
    else if (arg === '--lang' || arg === '--only') {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      if (arg === '--lang') opts.lang = value; else opts.only = value.split(',');
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]+)*$/.test(opts.lang)) throw new Error('Invalid language code');
  for (const id of opts.only ?? []) if (!CASES.some((c) => c.id === id)) throw new Error(`Unknown case: ${id}`);
  return opts;
}
function assert(ok, message) { if (!ok) throw new Error(message); }
async function pollUntil(fn, description, timeout = 5000) {
  const end = Date.now() + timeout;
  do {
    const value = await fn();
    if (value) return value;
    // Bounded condition polling, never a readiness sleep.
    await new Promise((resolve) => setTimeout(resolve, 50));
  } while (Date.now() < end);
  throw new Error(`Timeout: ${description} (${timeout} ms)`);
}
async function observeFor(fn, duration = 1200) {
  const end = Date.now() + duration;
  do {
    await fn();
    await new Promise((resolve) => setTimeout(resolve, 50));
  } while (Date.now() < end);
}

async function main() {
  const opts = options();
  const cases = CASES.filter((c) => !opts.only || opts.only.includes(c.id));
  const enabled = (id) => cases.some((c) => c.id === id);
  const plan = JOURNEYS.filter(([id, ids]) => (id !== 'J13' || opts.lang === 'de') && ids.some(enabled));
  if (opts.dry) {
    console.log(JSON.stringify({ language: opts.lang, cases, checks: [
      { id: 'render', cases: cases.map((c) => c.id), description: 'ha-card, no missing entity, dial, section screenshot' },
      ...plan.map(([id, ids, description]) => ({ id, cases: ids.filter(enabled), description })),
      { id: 'bundle', description: 'Local dist resource route hit' },
      { id: 'console', description: 'No bundle-related console errors/pageerrors' },
    ] }, null, 2)); return;
  }
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const bundlePath = resolve(root, 'dist/material-thermostat-card.js');
  let bundle;
  try { bundle = await readFile(bundlePath, 'utf8'); } catch { throw new Error('Missing dist/material-thermostat-card.js; run npm run build in this worktree'); }
  const auth = credentials();
  const out = resolve(root, 'dev/qa/out', opts.lang);
  await mkdir(out, { recursive: true });
  // Lazy import: dry-run has no browser/dependency/network requirements.
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ channel: 'chrome', headless: !opts.headed, timeout: TIMEOUT });
  const report = { language: opts.lang, cases: cases.map(({ id, entity }) => ({ id, entity })), checks: [], frames: [], consoleErrors: [] };
  const clean = (value) => JSON.parse(JSON.stringify(value).split(auth.token).join('[REDACTED]'));
  let context, fatal;
  const abort = (error) => {
    fatal ??= error;
    // Closing the context cancels evaluations/actions, including a wedged renderer.
    void context?.close().catch(() => {});
    return fatal;
  };
  const bounded = async (fn, description, timeout = TIMEOUT) => {
    if (fatal) throw fatal;
    let timer;
    try {
      return await Promise.race([
        Promise.resolve().then(fn),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(abort(new Error(`Deadline: ${description} (${timeout} ms); context closed`))), timeout);
        }),
      ]);
    } finally { clearTimeout(timer); }
  };
  const evaluate = (target, fn, arg) => bounded(() => target.evaluate(fn, arg), 'frontend evaluation');
  const poll = (fn, description, timeout = 5000) => bounded(async () => {
    try { return await pollUntil(fn, description, timeout); }
    catch (error) {
      if (String(error.message).startsWith('Timeout:')) throw abort(error);
      throw error;
    }
  }, description, timeout);
  const observe = (fn, duration = 1200) => bounded(() => observeFor(fn, duration), 'negative observation', duration + 1000);
  const check = async (name, fn) => {
    const start = report.frames.length;
    try {
      const evidence = await bounded(fn, name, 120000);
      report.checks.push({ name, status: 'PASS', evidence: clean(evidence ?? {}), frames: [start, report.frames.length] });
    } catch (error) {
      report.checks.push({ name, status: 'FAIL', error: safeError(error), frames: [start, report.frames.length] });
      if (fatal) throw fatal;
    }
  };
  let served = 0;
  try {
    context = await browser.newContext({ viewport: { width: 1600, height: 1200 }, serviceWorkers: 'block' });
    context.setDefaultTimeout(TIMEOUT);
    context.setDefaultNavigationTimeout(TIMEOUT);
    await context.addInitScript(({ url, token }) => {
      if (window !== window.top || location.origin !== new URL(url).origin) return;
      localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: url, clientId: `${url}/`, access_token: token, token_type: 'Bearer', expires_in: 315360000, expires: Date.now() + 315360000000, refresh_token: 'x' }));
    }, auth);
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(60000);
    const requireHAOrigin = (url) => {
      if (new URL(url).origin !== new URL(auth.url).origin) {
        // Do not include the redirect URL: an SSO URL may contain credentials.
        throw abort(new Error('Unexpected top-level origin; only the HA origin is allowed; context closed'));
      }
    };
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        try { requireHAOrigin(frame.url()); } catch { /* abort recorded; pending work is cancelled. */ }
      }
    });
    await page.route('**/*', async (route) => {
      const request = route.request();
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
        try { requireHAOrigin(request.url()); } catch { await route.abort().catch(() => {}); return; }
      }
      await route.continue();
    });
    page.on('websocket', (ws) => ws.on('framesent', ({ payload }) => {
      try {
        const msg = JSON.parse(String(payload));
        if (msg.type === 'call_service') report.frames.push(clean({ type: msg.type, domain: msg.domain, service: msg.service, service_data: msg.service_data, target: msg.target }));
      } catch { /* Binary and non-JSON transport frames are not service evidence. */ }
    }));
    const bundleError = (text, location = '') => {
      if (/material-thermostat/i.test(`${text} ${location}`)) report.consoleErrors.push(clean({ text, location }));
    };
    page.on('console', (msg) => { if (msg.type() === 'error') bundleError(msg.text(), msg.location().url); });
    page.on('pageerror', (error) => bundleError(error.message, error.stack ?? ''));
    await page.route('**/material-thermostat-card*.js*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/javascript', body: bundle }); served++;
    });
    await bounded(() => page.goto(`${auth.url}/${URL_PATH}/0`, { waitUntil: 'domcontentloaded', timeout: 60000 }), 'HA navigation', 60000);
    requireHAOrigin(page.url());
    await bounded(() => page.waitForFunction(() => document.querySelector('home-assistant')?.hass?.states && customElements.get('material-thermostat-card'), null, { timeout: TIMEOUT }), 'HA readiness');
    assert(served > 0, 'Local dist route was never hit; refusing to test installed HACS bundle');
    if (opts.lang !== 'en') {
      await evaluate(page, async (language) => {
        const ha = document.querySelector('home-assistant');
        if (typeof ha._selectLanguage !== 'function') throw new Error('HA in-session language switching is unavailable');
        // false is essential: never save a QA language to the real user's profile.
        await ha._selectLanguage(language, false);
      }, opts.lang);
      // HA loads component translation chunks asynchronously after switching.
      // This bounded settling window is separate from the language assertion.
      await bounded(() => page.waitForTimeout(8000), 'HA translation settling', 10000);
    }
    const actualLanguage = await evaluate(page, () => document.querySelector('home-assistant').hass.language);
    assert(actualLanguage === opts.lang, `HA language mismatch: requested ${opts.lang}, got ${actualLanguage}; refusing localization checks`);
    report.checks.push({ name: 'HA session language', status: 'PASS', evidence: { requested: opts.lang, actual: actualLanguage, savedToProfile: false } });

    const state = (entity) => evaluate(page, (id) => document.querySelector('home-assistant').hass.states[id], entity);
    const waitState = async (entity, key, value) => poll(async () => {
      const s = await state(entity);
      return (key === 'state' ? s?.state : s?.attributes?.[key]) === value && s;
    }, `${entity}.${key}=${value}`);
    const sections = new Map();
    const card = (id) => {
      assert(sections.has(id), `Section ${id} did not render`);
      return sections.get(id).locator(S.card);
    };
    const dial = (id) => card(id).locator(S.dial);
    const cardText = (id) => evaluate(card(id), (host) => {
      const text = (node) => {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent;
        if (node.nodeType === Node.ELEMENT_NODE && ['STYLE', 'SCRIPT'].includes(node.tagName)) return '';
        // Keep light DOM too: ha-card projects its content through a shadow slot.
        return [...node.childNodes, ...(node.shadowRoot?.childNodes ?? [])].map(text).join(' ');
      };
      return text(host);
    });
    const increment = (id) => dial(id).locator(S.increase);
    const entity = (id) => CASES.find((c) => c.id === id).entity;
    const calls = (start, id, domain, service) => report.frames.slice(start).filter((f) => {
      const target = f.target?.entity_id ?? f.service_data?.entity_id;
      return f.domain === domain && f.service === service && (Array.isArray(target) ? target.includes(entity(id)) : target === entity(id));
    });
    const frame = async (start, id, domain, service, data = {}) => poll(() => calls(start, id, domain, service).find((f) => Object.entries(data).every(([k, v]) => f.service_data?.[k] === v)), `${id}: ${domain}.${service} ${JSON.stringify(data)}`);
    const restore = async (id, domain, service, data, expected) => {
      const start = report.frames.length;
      await evaluate(page, ({ domain, service, data, entity_id }) => document.querySelector('home-assistant').hass.callService(domain, service, { ...data, entity_id }), { domain, service, data, entity_id: entity(id) });
      await frame(start, id, domain, service, data);
      for (const [key, value] of Object.entries(expected)) await waitState(entity(id), key, value);
    };
    // Select the rendered item by value, then click its localized title. No English-only journeys.
    const rowFor = async (id, value, rowIndex) => {
      const rows = card(id).locator(S.row);
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        if (rowIndex !== undefined && rowIndex !== i) continue;
        const item = await evaluate(rows.nth(i), (row, v) => row.items?.find((item) => item.value === v), value);
        if (item) return { row: rows.nth(i), item };
      }
      throw new Error(`${id}: no selector item ${value}`);
    };
    const select = async (id, value, rowIndex) => {
      const { row, item } = await rowFor(id, value, rowIndex);
      // Use CSS title matching (shadow-piercing), not XPath into a shadow root.
      const button = row.locator(`${S.chip}[title=${JSON.stringify(item.label)}]`);
      await button.click();
      return { value, title: item.label };
    };
    for (const c of cases) await check(`render:${c.id}`, async () => {
      const heading = page.locator(S.heading).filter({ hasText: new RegExp(`QA:${c.id}(?![\\w-])`) });
      await heading.waitFor({ state: 'visible' });
      await evaluate(heading, (heading, { id, S }) => {
        function deep(root, selector) {
          const found = [...root.querySelectorAll(selector)];
          for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deep(el.shadowRoot, selector));
          return found;
        }
        let el = heading;
        while (el) {
          if (deep(el, S.card).length === 1 && deep(el, S.stock).length === 1) { el.setAttribute('data-mtqa-section', id); return; }
          el = el.parentElement ?? el.getRootNode().host;
        }
        throw new Error(`No paired section for QA:${id}`);
      }, { id: c.id, S });
      const section = page.locator(`[data-mtqa-section="${c.id}"]`);
      sections.set(c.id, section);
      await card(c.id).locator(S.shell).waitFor({ state: 'visible' });
      await dial(c.id).waitFor({ state: 'visible' });
      assert(!/Entity not found/i.test(await cardText(c.id)), 'Entity not found');
      await poll(() => evaluate(card(c.id), (host) => {
        function* walk(root) {
          for (const element of root.querySelectorAll('*')) {
            yield element;
            if (element.shadowRoot) yield* walk(element.shadowRoot);
          }
        }
        if (!host.shadowRoot) return false;
        const elements = [...walk(host.shadowRoot)];
        const icons = elements.filter((element) => element.tagName === 'HA-ICON');
        const svgs = elements.filter((element) => element.tagName === 'HA-SVG-ICON');
        return icons.every((icon) => icon.shadowRoot &&
          [...walk(icon.shadowRoot)].some((element) => element.tagName === 'HA-SVG-ICON')) &&
          svgs.every((svg) => svg.shadowRoot?.querySelector('path[d]'));
      }), `${c.id}: screenshot icons ready`, TIMEOUT);
      await section.screenshot({ path: resolve(out, `${c.id}.png`), timeout: TIMEOUT });
      return { screenshot: `${c.id}.png`, entity: c.entity };
    });

    if (enabled('full-icons')) {
      await check('J1: HVAC mode round trip', async () => {
        const previous = (await state(entity('full-icons'))).state;
        const start = report.frames.length;
        try {
          await select('full-icons', 'cool', 0);
          const sent = await frame(start, 'full-icons', 'climate', 'set_hvac_mode', { hvac_mode: 'cool' });
          await waitState(entity('full-icons'), 'state', 'cool'); return sent;
        } finally {
          await restore('full-icons', 'climate', 'set_hvac_mode', { hvac_mode: previous }, { state: previous });
        }
      });
      for (const [index, value, key, service] of [[1, 'eco', 'preset_mode', 'set_preset_mode'], [2, 'high', 'fan_mode', 'set_fan_mode'], [3, 'both', 'swing_mode', 'set_swing_mode'], [4, 'left', 'swing_horizontal_mode', 'set_swing_horizontal_mode']]) {
        await check(`J2: ${service}`, async () => {
          const previous = (await state(entity('full-icons'))).attributes[key];
          assert(typeof previous === 'string', `Cannot safely restore ${key}: original value is unset; initialize it before running J2`);
          const start = report.frames.length;
          try {
            const selected = await select('full-icons', value, index);
            const sent = await frame(start, 'full-icons', 'climate', service, { [key]: value });
            await waitState(entity('full-icons'), key, value); return { previous, selected, sent };
          } finally {
            await restore('full-icons', 'climate', service, { [key]: previous }, { [key]: previous });
          }
        });
      }
      await check('J3: exactly one debounced increment', async () => {
        const previous = Number((await state(entity('full-icons'))).attributes.temperature);
        assert(Number.isFinite(previous), 'Initial temperature missing');
        const start = report.frames.length;
        try {
          await increment('full-icons').click();
          const sent = await frame(start, 'full-icons', 'climate', 'set_temperature', { temperature: previous + 0.5 });
          await waitState(entity('full-icons'), 'temperature', previous + 0.5);
          await observe(() => assert(calls(start, 'full-icons', 'climate', 'set_temperature').length === 1, 'Duplicate temperature call'));
          return { previous, sent, observationMs: 1200 };
        } finally {
          await restore('full-icons', 'climate', 'set_temperature', { temperature: previous }, { temperature: previous });
        }
      });
    }
    if (enabled('range-mqtt')) await check('J4: range increment', async () => {
      const previous = await state(entity('range-mqtt'));
      const targets = { target_temp_low: previous.attributes.target_temp_low, target_temp_high: previous.attributes.target_temp_high };
      assert(Object.values(targets).every(Number.isFinite), 'Initial range bounds missing');
      try {
        if (previous.state !== 'heat_cool') {
          await select('range-mqtt', 'heat_cool', 0);
          await waitState(entity('range-mqtt'), 'state', 'heat_cool');
        }
        const start = report.frames.length;
        await increment('range-mqtt').click();
        const sent = await frame(start, 'range-mqtt', 'climate', 'set_temperature');
        assert(Number.isFinite(sent.service_data.target_temp_low) && Number.isFinite(sent.service_data.target_temp_high), 'Both range bounds required');
        await waitState(entity('range-mqtt'), 'target_temp_low', sent.service_data.target_temp_low);
        await waitState(entity('range-mqtt'), 'target_temp_high', sent.service_data.target_temp_high);
        return sent;
      } finally {
        try { await restore('range-mqtt', 'climate', 'set_temperature', targets, targets); }
        finally { await restore('range-mqtt', 'climate', 'set_hvac_mode', { hvac_mode: previous.state }, { state: previous.state }); }
      }
    });
    if (enabled('range-auto')) await check('J5: auto has two sliders', async () => {
      const count = await dial('range-auto').locator(S.slider).count(); assert(count === 2, `Expected two sliders, got ${count}`); return { count };
    });
    if (enabled('reject')) await check('J6: rejected target reverts', async () => {
      const slider = dial('reject').locator(S.slider);
      const previous = Number(await slider.getAttribute('aria-valuenow'));
      const start = report.frames.length;
      await increment('reject').click();
      // Prove an optimistic change occurred: an unchanged value cannot falsely pass rollback.
      await poll(async () => Number(await slider.getAttribute('aria-valuenow')) !== previous, 'optimistic display change', 2000);
      const sent = await frame(start, 'reject', 'climate', 'set_temperature', { temperature: previous + 0.5 });
      await poll(async () => Number(await slider.getAttribute('aria-valuenow')) === previous, 'server rollback', 8000);
      return { previous, sent, returned: await slider.getAttribute('aria-valuenow') };
    });
    for (const id of ['fan-readonly', 'wh-readonly'].filter(enabled)) await check(`J7: ${id}`, async () => {
      const buttons = await increment(id).count(), sliders = await dial(id).locator(S.slider).count();
      assert(buttons === 0 && sliders === 0, `Read-only controls present: ${buttons} increment, ${sliders} sliders`); return { buttons, sliders };
    });
    if (enabled('wh-tank')) {
      await check('J8: water heater increment', async () => {
        const previous = Number((await state(entity('wh-tank'))).attributes.temperature);
        assert(Number.isFinite(previous), 'Initial water temperature missing');
        const start = report.frames.length;
        try {
          await increment('wh-tank').click();
          const sent = await frame(start, 'wh-tank', 'water_heater', 'set_temperature', { temperature: previous + 0.5 });
          await waitState(entity('wh-tank'), 'temperature', previous + 0.5);
          return { previous, sent };
        } finally {
          await restore('wh-tank', 'water_heater', 'set_temperature', { temperature: previous }, { temperature: previous });
        }
      });
      await check('J8: water heater operation', async () => {
        const previous = (await state(entity('wh-tank'))).state;
        const start = report.frames.length;
        try {
          await select('wh-tank', 'eco', 0);
          const sent = await frame(start, 'wh-tank', 'water_heater', 'set_operation_mode', { operation_mode: 'eco' });
          await waitState(entity('wh-tank'), 'state', 'eco'); return { previous, sent };
        } finally {
          await restore('wh-tank', 'water_heater', 'set_operation_mode', { operation_mode: previous }, { state: previous });
        }
      });
    }
    if (enabled('wh-away')) await check('J9: away off frame', async () => {
      const previous = (await state(entity('wh-away'))).attributes.away_mode;
      assert(previous === 'on', 'J9 requires initial away_mode on; no mutation performed');
      const start = report.frames.length;
      const row = card('wh-away').locator(S.row).last();
      try {
        await row.locator(S.chip).click();
        return await frame(start, 'wh-away', 'water_heater', 'set_away_mode', { away_mode: false });
      } finally {
        // REST-only fixture has no service implementation; verify it remained unchanged.
        await waitState(entity('wh-away'), 'away_mode', previous);
      }
    });
    for (const id of ['climate-unavailable', 'wh-unavailable'].filter(enabled)) await check(`J10: ${id} inert`, async () => {
      const unavailable = await evaluate(page, () => document.querySelector('home-assistant').hass.localize('state.default.unavailable'));
      assert(unavailable, 'HA unavailable translation missing');
      assert((await cardText(id)).includes(unavailable), `Missing localized label: ${unavailable}`);
      const chips = card(id).locator(S.chip);
      assert(await chips.count() > 0, 'No unavailable mode chips');
      const start = report.frames.length;
      for (let i = 0; i < await chips.count(); i++) {
        const chip = chips.nth(i);
        if (await chip.isDisabled()) await chip.dispatchEvent('click'); else await chip.click();
      }
      await observe(() => assert(report.frames.length === start, 'Unavailable interaction sent call_service'));
      return { label: unavailable, serviceCalls: 0, observationMs: 1200 };
    });
    if (enabled('stock-yaml')) await check('J11: included HVAC modes only', async () => {
      const row = card('stock-yaml').locator(S.row).first();
      const values = await evaluate(row, (el) => el.items.map((item) => item.value));
      assert(JSON.stringify([...values].sort()) === JSON.stringify(['cool', 'heat', 'off']), `Unexpected HVAC items ${values}`);
      const dropdown = row.locator(S.dropdown);
      await dropdown.locator(S.trigger).click();
      const count = await dropdown.locator(S.option).count();
      assert(count === 3, `Expected three rendered options, got ${count}`);
      await page.keyboard.press('Escape'); return { values, renderedOptions: count };
    });
    for (const c of cases) await check(`J12: layout:${c.id}`, async () => {
      const our = await card(c.id).boundingBox();
      const stock = await sections.get(c.id)?.locator(S.stock).boundingBox();
      assert(our && stock, 'Missing card bounds');
      const overlap = Math.min(our.x + our.width, stock.x + stock.width) > Math.max(our.x, stock.x) && Math.min(our.y + our.height, stock.y + stock.height) > Math.max(our.y, stock.y);
      assert(!overlap, 'Our card overlaps stock card');
      const layout = await evaluate(card(c.id).locator(S.shell), (shell) => {
        const bottom = shell.getBoundingClientRect().bottom;
        const overflow = [];
        let measured = 0;
        function walk(root) {
          for (const el of root.children) {
            // Floating menus are allowed outside the card; exclude their subtree.
            if (el.matches('[role="listbox"], [role="menu"], [role="dialog"], [popover], .menu, .popover')) continue;
            const style = getComputedStyle(el);
            if (style.display === 'none' || Number(style.opacity) === 0) continue;
            const rect = el.getBoundingClientRect();
            // Orbit boxes rotate around the full dial: only their children paint.
            // Still descend so visible marker dots/labels remain checked.
            if (!el.matches('.orbit') && style.visibility !== 'hidden' && style.visibility !== 'collapse' && rect.width > 0 && rect.height > 0) {
              measured++;
              if (rect.bottom > bottom + 2) overflow.push({ tag: el.localName, class: el.getAttribute('class'), bottom: rect.bottom });
            }
            walk(el);
            if (el.shadowRoot) walk(el.shadowRoot);
          }
        }
        walk(shell);
        if (shell.shadowRoot) walk(shell.shadowRoot);
        return { bottom, measured, overflow };
      });
      assert(layout.overflow.length === 0, `Content below ha-card: ${JSON.stringify(layout)}`);
      return { our, stock, ...layout };
    });
    if (opts.lang === 'de') {
      if (enabled('heat')) await check('J13: German target decimal', async () => {
        const target = Number((await state(entity('heat'))).attributes.temperature);
        assert(Number.isFinite(target) && target % 1 !== 0, 'Fractional heat target required; rerun seed (21.5)');
        const text = await dial('heat').locator(S.slider).getAttribute('aria-valuetext');
        assert(/\d,\d/.test(text ?? ''), `Slider aria-valuetext lacks comma decimal: ${text}`); return { target, text };
      });
      for (const [id, kind, values, english] of [
        ['full-icons', 'HVAC', ['heat', 'off'], ['Heat', 'Off']],
        ['wh-tank', 'water heater operation', ['electric', 'off'], ['Electric', 'Off']],
      ]) if (enabled(id)) await check(`J13: German ${kind} titles`, async () => {
        const stockLabels = await evaluate(sections.get(id).locator(S.stock), (host, values) => {
          const labels = {};
          const text = (el) => {
            if (el.nodeType === Node.TEXT_NODE) return el.textContent;
            if (['STYLE', 'SCRIPT', 'HA-ICON', 'HA-SVG-ICON'].includes(el.nodeName)) return '';
            return [...el.childNodes, ...(el.shadowRoot?.childNodes ?? [])].map(text).join(' ');
          };
          function walk(root) {
            for (const el of root.querySelectorAll('*')) {
              const value = el.value ?? el.getAttribute('value');
              if (values.includes(value) && el.matches('option, ha-dropdown-item, ha-list-item, mwc-list-item, [role="option"]')) {
                const label = text(el).replace(/\s+/g, ' ').trim();
                if (label) labels[value] = label;
              }
              if (el.shadowRoot) walk(el.shadowRoot);
            }
          }
          walk(host);
          if (host.shadowRoot) walk(host.shadowRoot);
          return labels;
        }, values);
        const titles = {};
        for (const value of values) {
          const { row, item } = await rowFor(id, value, 0);
          const title = await row.locator(`${S.chip}[title=${JSON.stringify(item.label)}]`).getAttribute('title');
          assert(title && !english.some((word) => word.toLowerCase() === title.trim().toLowerCase()), `English or missing ${kind} title for ${value}: ${title}`);
          if (stockLabels[value]) assert(title === stockLabels[value], `${kind} title for ${value}: ${title}; stock: ${stockLabels[value]}`);
          titles[value] = { title, stock: stockLabels[value] ?? null, comparison: stockLabels[value] ? 'stock option' : 'non-English fallback' };
        }
        return { titles };
      });
    }
  } catch (error) {
    report.checks.push({ name: 'setup/runtime', status: 'FAIL', error: safeError(fatal ?? error) });
  } finally {
    let closeTimer;
    const closed = await Promise.race([
      browser.close().then(() => true, (error) => {
        report.checks.push({ name: 'browser shutdown', status: 'FAIL', error: safeError(error) });
        return false;
      }),
      new Promise((resolve) => { closeTimer = setTimeout(() => resolve(false), 10000); }),
    ]);
    clearTimeout(closeTimer);
    if (!closed) report.checks.push({ name: 'browser shutdown deadline', status: 'FAIL', error: 'Browser did not close cleanly; exiting to terminate Playwright' });
    report.checks.push({ name: 'bundle route hit', status: served ? 'PASS' : 'FAIL', evidence: { served } });
    report.checks.push({ name: 'bundle console errors', status: report.consoleErrors.length ? 'FAIL' : 'PASS', evidence: { count: report.consoleErrors.length } });
    await writeFile(resolve(out, 'report.json'), JSON.stringify(clean(report), null, 2));
    console.table(report.checks.map(({ name, status, error }) => ({ check: name, result: status, error: error ?? '' })));
    const failures = report.checks.filter((c) => c.status === 'FAIL').length;
    console.log(`${report.checks.length - failures} PASS / ${failures} FAIL; dev/qa/out/${opts.lang}/report.json`);
    if (failures) process.exitCode = 1;
    if (!closed) process.exit(1);
  }
}
main().catch((error) => { console.error(safeError(error)); process.exitCode = 1; });
