import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';
import { SCENARIOS, AUX } from './matrix.mjs';
import { buildCases } from './cases.mjs';
import { URL_PATH } from './dashboard.mjs';
import { credentials, safeError, rest, TIMEOUT } from './ha-client.mjs';

// Component internals: keep all CSS knowledge in this block, including browser-side scans.
const S = {
  card: 'material-thermostat-card', stock: 'hui-thermostat-card', shell: 'ha-card',
  ha: 'home-assistant', error: 'hui-error-card', section: 'hui-grid-section, hui-section',
  heading: 'hui-heading-card', icon: 'ha-icon', svgIcon: 'ha-svg-icon', path: 'path[d]',
  dial: 'mt-circular-dial', slider: '[role="slider"]',
  increase: 'button[aria-label="Increase temperature"]', decrease: 'button[aria-label="Decrease temperature"]',
  stateLabel: '.center .mode', modeIcon: 'ha-icon.preset-icon', current: '.num.current, .current-primary, .current-marker',
  value: '.value-text', accessibleText: '.sr-only', center: '.center',
  selector: 'mt-climate-selector', row: 'mt-selector-row', chip: '.chip[title]',
  dropdown: 'mt-dropdown', trigger: 'button[aria-haspopup="listbox"]', option: '[role="option"]',
  away: 'mt-water-heater-away', awayButton: 'button[aria-pressed]',
  controls: '.chip, button[aria-haspopup="listbox"], button[aria-pressed]',
  active: '.active, [aria-pressed="true"], [aria-selected="true"]',
  excludedLayout: '[role="listbox"], [role="menu"], [role="dialog"], [popover], .menu, .popover',
  orbit: '.orbit', scrollRow: '.chips',
  aux: { 'input-select': 'mt-input-select', 'switch-group': 'mt-switch-group',
    'switch-list': 'mt-switch-list', 'button-list': 'mt-button-list', 'sensor-list': 'mt-sensor-list',
    'entity-tile': 'mt-entity-tile', comfort: 'mt-comfort' },
  stockOption: 'option, ha-dropdown-item, ha-list-item, mwc-list-item, [role="option"], [value], [data-value], button[title]',
};
const CHECKS = ['sliders', 'plus-minus', 'unavailable', 'state-label', 'mode-icon', 'selectors', 'labels', 'away', 'aux', 'text', 'layout', 'values'];
const SERVICES = {
  hvac: ['climate', 'set_hvac_mode', 'hvac_mode', 'state'],
  preset: ['climate', 'set_preset_mode', 'preset_mode', 'preset_mode'],
  fan: ['climate', 'set_fan_mode', 'fan_mode', 'fan_mode'],
  swing: ['climate', 'set_swing_mode', 'swing_mode', 'swing_mode'],
  swing_horizontal: ['climate', 'set_swing_horizontal_mode', 'swing_horizontal_mode', 'swing_horizontal_mode'],
  operation: ['water_heater', 'set_operation_mode', 'operation_mode', 'state'],
};
const kindOf = (type) => ({ 'climate-hvac-modes': 'hvac', 'climate-preset-modes': 'preset',
  'climate-fan-modes': 'fan', 'climate-swing-modes': 'swing',
  'climate-swing-horizontal-modes': 'swing_horizontal', 'water-heater-operation-modes': 'operation' })[type] ?? type;
const slug = (s) => String(s).replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'section';
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function options() {
  const opts = { lang: null, scheme: 'light', quick: false, headed: false, dry: false, only: null };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') opts.dry = true;
    else if (arg === '--headed') opts.headed = true;
    else if (arg === '--quick') opts.quick = true;
    else if (['--lang', '--scheme', '--only'].includes(arg)) {
      const value = args[++i];
      assert(value && !value.startsWith('--'), `${arg} requires a value`);
      if (arg === '--lang') opts.lang = value;
      else if (arg === '--scheme') opts.scheme = value;
      else opts.only = value.split(',');
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  assert(!opts.lang || /^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]+)*$/.test(opts.lang), 'Invalid language code');
  assert(['light', 'dark'].includes(opts.scheme), '--scheme must be light or dark');
  return opts;
}
function scenarioFor(c) {
  const scenario = typeof c.scenario === 'object' ? c.scenario : SCENARIOS.find((s) => s.id === c.scenario);
  assert(scenario, `Unknown scenario for ${c.id}`);
  return scenario;
}
function journeys(c, opts) {
  if (c.kind !== 'ours' || !c.expect) return [];
  const s = scenarioFor(c), e = c.expect, result = [];
  if (e.interactive && ['features-climate', 'features-wh'].includes(c.view)) {
    for (const selector of e.selectors) {
      const values = selector.items.filter((v) => v !== selector.active);
      for (const value of opts.quick ? values.slice(0, 1) : values) result.push({ type: 'J-select', selector, value });
    }
  }
  const optionsSection = /options/i.test(c.section);
  if (e.interactive && optionsSection && ['s-c-mqtt-full', 's-c-mqtt-range', 's-w-mqtt-tank'].includes(c.view)
       && c.config.show_current_as_primary === false) result.push({ type: 'J-dial' });
  if (c.view === 'features-wh' && /^(?:s-)?w-away-(on|off)$/.test(s.id) && e.away) result.push({ type: 'J-away' });
  if (/^(?:s-)?[cw]-unavailable$/.test(s.id)) result.push({ type: 'J-unavailable' });
  // Reject/REST-away/unavailable journeys intentionally exercise guarded controls
  // even though these fixtures do not echo service calls (interactive=false).
  if (optionsSection && c.view === 's-c-mqtt-reject' && c.config.show_current_as_primary === false
       && (c.config.dial_style ?? c.config.dial?.style) === 'halo') result.push({ type: 'J-reject' });
  if (e.interactive && c.view === 'aux') for (const feature of e.aux) {
    if (['input-select', 'switch-group', 'switch-list', 'button-list'].includes(feature)) result.push({ type: 'J-aux', feature });
  }
  if (c.view.startsWith('s-') && (!opts.lang || !/^en(?:-GB)?$/i.test(opts.lang))) result.push({ type: 'J-locale' });
  return result;
}

// Executed in a bounded evaluation. No token, network calls or mutations here.
function inspect(host, S) {
  function deep(root, selector) {
    const found = [...root.querySelectorAll(selector)];
    for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deep(el.shadowRoot, selector));
    if (root.shadowRoot) found.push(...deep(root.shadowRoot, selector));
    return found;
  }
  function text(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (['STYLE', 'SCRIPT'].includes(node.nodeName)) return '';
    return [...node.childNodes, ...(node.shadowRoot?.childNodes ?? [])].map(text).join(' ');
  }
  const visible = (el) => {
    const style = getComputedStyle(el), r = el.getBoundingClientRect();
    return style.display !== 'none' && !['hidden', 'collapse'].includes(style.visibility) && Number(style.opacity) !== 0 && r.width > 0 && r.height > 0;
  };
  const disabled = (el) => el.disabled === true || el.getAttribute('aria-disabled') === 'true';
  const dial = deep(host, S.dial)[0], shell = deep(host, S.shell)[0];
  const rowInfo = (feature) => {
    const row = deep(feature, S.row)[0];
    const controls = row ? deep(row, S.chip + ', ' + S.option).filter(visible) : [];
    return { kind: feature.kind, display: row?.display, items: (row?.items ?? []).map((i) => ({ ...i })),
      controls: controls.map((el, i) => ({ value: row?.items?.[i]?.value,
        label: el.title || text(el).trim(), active: el.matches(S.active), disabled: disabled(el) })),
      triggerDisabled: row && deep(row, S.trigger).map(disabled) };
  };
  const bounds = shell?.getBoundingClientRect(), overflow = [], scroll = [];
  function layout(root, clipped = false) {
    for (const el of root.children) {
      if (el.matches(S.excludedLayout)) continue;
      const style = getComputedStyle(el);
      if (style.display === 'none' || Number(style.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      const scrolling = el.matches(S.scrollRow) && el.scrollWidth > el.clientWidth + 2;
      if (scrolling) scroll.push({ width: el.clientWidth, scrollWidth: el.scrollWidth });
      if (visible(el) && !el.matches(S.orbit) && bounds && !clipped &&
          (r.left < bounds.left - 2 || r.right > bounds.right + 2 || r.top < bounds.top - 2 || r.bottom > bounds.bottom + 2)) {
        overflow.push({ tag: el.localName, class: el.className?.baseVal ?? el.className,
          left: r.left, right: r.right, top: r.top, bottom: r.bottom });
      }
      layout(el, clipped || scrolling);
      if (el.shadowRoot) layout(el.shadowRoot, clipped || scrolling);
    }
  }
  if (shell) { layout(shell); if (shell.shadowRoot) layout(shell.shadowRoot); }
  const away = deep(host, S.away).map((el) => ({ display: el.display, label: el.label,
    text: text(el).trim(), buttons: deep(el, S.awayButton).map((b) => ({ pressed: b.getAttribute('aria-pressed'), disabled: disabled(b) })) }));
  const current = dial ? deep(dial, S.current).filter(visible).map(text) : [];
  // Read-only/current-primary center has no separate current marker.
  if (dial && dial.current != null && (dial.readonly || dial.showCurrentAsPrimary)) current.push(...deep(dial, S.value).filter(visible).map(text));
  return { text: text(host), dial: dial && { disabled: dial.disabled, step: dial.step, current: dial.current },
    sliders: dial ? deep(dial, S.slider).map((el) => ({ value: Number(el.getAttribute('aria-valuenow')),
      min: Number(el.getAttribute('aria-valuemin')), max: Number(el.getAttribute('aria-valuemax')), text: el.getAttribute('aria-valuetext'), disabled: disabled(el) })) : [],
    increase: dial ? deep(dial, S.increase).length : 0, decrease: dial ? deep(dial, S.decrease).length : 0,
    stateLabels: dial ? deep(dial, S.stateLabel).filter(visible).map(text) : [],
    modeIcons: dial ? [...(dial.shadowRoot?.querySelectorAll(S.modeIcon) ?? [])].map((el) => {
      const numbers = deep(dial, S.value).filter(visible), bounds = el.getBoundingClientRect();
      return { icon: el.getAttribute('icon'), color: el.style.color, visible: visible(el),
        belowNumber: numbers.length > 0 && numbers.every((n) => bounds.top >= n.getBoundingClientRect().bottom - 2) };
    }) : [],
    controls: deep(host, S.controls).map(disabled), selectors: deep(host, S.selector).map(rowInfo), away,
    aux: Object.fromEntries(Object.entries(S.aux).map(([k, v]) => [k, deep(host, v).map((el) => text(el).trim() || (deep(el, `${S.controls}, ${S.icon}`).some(visible) ? 'controls/icon' : ''))])),
    current, overflow, scroll, bounds: bounds?.toJSON(),
  };
}

async function main() {
  const opts = options();
  const allCases = buildCases({ theme: undefined });
  const views = [...new Set(allCases.map((c) => c.view))];
  for (const view of opts.only ?? []) assert(views.includes(view), `Unknown view: ${view}`);
  let cases = allCases.filter((c) => !opts.only || opts.only.includes(c.view));
  assert(new Set(cases.map((c) => c.id)).size === cases.length, 'Case IDs must be unique');
  const selectedViews = views.filter((v) => cases.some((c) => c.view === v));
  if (opts.dry) {
    for (const view of selectedViews) {
      const vc = cases.filter((c) => c.view === view);
      const plan = vc.flatMap((c) => journeys(c, opts).map((j) => `${c.id}: ${j.type}${j.selector ? ` ${j.selector.type}=${j.value}` : ''}${j.feature ? ` ${j.feature}` : ''}`));
      console.log(`view ${view}: ${vc.length} cases (${vc.filter((c) => c.kind === 'ours').length} ours); ${1 + vc.filter((c) => c.expect).length * CHECKS.length} invariant checks; ${plan.length} journeys`);
      console.log(`  cases: ${vc.map((c) => c.id).join(', ')}`);
      for (const j of plan) console.log(`  ${j}`);
    }
    console.log(`Checks per our case: ${CHECKS.join(', ')}`);
    console.log('Stock: render only. Every view: all cases, error-card scan, icons, section screenshots.');
    console.log(`TOTAL: ${selectedViews.length} views; ${cases.length} cases; ${selectedViews.length + cases.filter((c) => c.expect).length * CHECKS.length} invariant checks; ${cases.flatMap((c) => journeys(c, opts)).length} journeys`);
    console.log(`Language: ${opts.lang ?? 'user session (J-locale conditional)'}; scheme: ${opts.scheme}; quick: ${opts.quick}; OFFLINE (no credentials/browser/build required)`);
    return;
  }
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const bundle = await readFile(resolve(root, 'dist/material-thermostat-card.js'), 'utf8').catch(() => { throw new Error('Missing local dist build; run npm run build in this worktree'); });
  const auth = credentials();
  const clean = (value) => JSON.parse(JSON.stringify(value).split(auth.token).join('[REDACTED]'));
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ channel: 'chrome', headless: !opts.headed, timeout: TIMEOUT });
  const report = { language: opts.lang, scheme: opts.scheme, cases, checks: [], frames: [], restores: [], consoleErrors: [], bundleRouteHit: 0 };
  let context, page, fatal, originViolation, out, currentView = 'setup';
  const journal = new Set();
  const viewScope = new AsyncLocalStorage();
  let activeScope;
  const closeContext = async () => {
    const previous = context;
    context = undefined;
    let timer;
    try {
      await Promise.race([previous?.close().catch(() => {}), new Promise((r) => { timer = setTimeout(r, 10000); })]);
    } finally { clearTimeout(timer); }
  };
  const abort = (error) => {
    const scope = viewScope.getStore();
    if (scope) scope.cancelled ??= error;
    if (!scope || scope === activeScope) {
      fatal ??= error;
      void context?.close().catch(() => {});
    }
    return scope?.cancelled ?? fatal ?? error;
  };
  const bounded = async (fn, description, timeout = TIMEOUT) => {
    if (viewScope.getStore()?.cancelled) throw viewScope.getStore().cancelled;
    if (fatal) throw fatal;
    let timer;
    try {
      return await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => {
        timer = setTimeout(() => reject(abort(new Error(`Deadline: ${description} (${timeout} ms); context closed`))), timeout);
      })]);
    } catch (error) {
      if (/context.*closed|page.*closed|browser.*closed|Target crashed/i.test(String(error))) throw abort(error);
      throw error;
    } finally { clearTimeout(timer); }
  };
  const evaluate = (target, fn, arg) => bounded(() => target.evaluate(fn, arg), 'frontend evaluation');
  const poll = (fn, description, timeout = 5000) => bounded(async () => {
    const end = Date.now() + timeout;
    do {
      const value = await fn();
      if (value) return value;
      await new Promise((r) => setTimeout(r, 50));
    } while (Date.now() < end);
    throw abort(new Error(`Timeout: ${description} (${timeout} ms); context closed`));
  }, description, timeout + 100);
  // Observation windows are deliberate negative assertions, not readiness sleeps.
  const observe = (fn, duration = 1200) => bounded(async () => {
    const end = Date.now() + duration;
    do { await fn(); await new Promise((r) => setTimeout(r, 25)); } while (Date.now() < end);
    await fn();
  }, 'negative observation', duration + 1000);
  const check = async (name, fn, timeout = 120000) => {
    const start = report.frames.length, view = currentView;
    try { report.checks.push({ name, view, status: 'PASS', evidence: clean(await bounded(fn, name, timeout) ?? {}), frames: [start, report.frames.length] }); }
    catch (error) {
      report.checks.push({ name, view, status: 'FAIL', error: safeError(error), frames: [start, report.frames.length] });
      if (viewScope.getStore()?.cancelled || fatal) throw viewScope.getStore()?.cancelled ?? fatal;
    }
  };
  const warn = (name, evidence) => report.checks.push({ name, view: currentView, status: 'WARN', evidence: clean(evidence) });
  const card = (c) => page.locator(`[data-mtqa-id=${JSON.stringify(c.id)}]`);
  const snapshot = (c) => evaluate(card(c), inspect, S);
  const state = (id) => evaluate(page, ({ id, S }) => document.querySelector(S.ha).hass.states[id], { id, S });
  const stateValue = (s, key) => key === 'state' ? s?.state : s?.attributes?.[key];
  const waitState = (id, key, value, timeout = 5000) => poll(async () => equal(stateValue(await state(id), key), value), `${id}.${key} restore/convergence`, Math.max(1, timeout));
  const matching = (start, id) => report.frames.slice(start).filter((f) => {
    const ids = f.target?.entity_id ?? f.service_data?.entity_id;
    return Array.isArray(ids) ? ids.includes(id) : ids === id;
  });
  const exactFrame = async (start, id, domain, service, data = {}) => {
    await poll(() => matching(start, id).length > 0, `${domain}.${service} frame`);
    await observe(() => assert(matching(start, id).length === 1, `Expected exactly one call for ${id}; got ${matching(start, id).length}`));
    const [f] = matching(start, id);
    const target = f.target?.entity_id ?? f.service_data?.entity_id;
    assert(equal(Array.isArray(target) ? target : [target], [id]), `Unexpected entity targets: ${JSON.stringify(target)}`);
    assert(f.domain === domain && f.service === service && Object.entries(data).every(([k, v]) => equal(f.service_data?.[k], v)), `Wrong frame: ${JSON.stringify(f)}; expected ${domain}.${service} ${JSON.stringify(data)}`);
    return f;
  };
  const recordRestore = (id, domain, service, data, verify) => {
    if (viewScope.getStore()?.cancelled) throw viewScope.getStore().cancelled;
    assert(![...journal].some((entry) => entry.data.entity_id === id), `Pending restore for ${id}; refusing another mutation`);
    const entry = { domain, service, data: { ...data, entity_id: id }, verify, view: currentView };
    journal.add(entry);
    return entry;
  };
  // Independent of page/context/fatal: every request has ha-client's 30 s bound.
  const performRestore = async (entry) => {
    const id = entry.data.entity_id;
    const backoff = [1000, 3000, 6000];
    entry.retries = 0;
    entry.lastError = null;
    const restoreRequest = async (...args) => {
      for (;;) {
        try { return await rest(auth, ...args); }
        catch (error) {
          const message = safeError(error);
          entry.lastError = message;
          const status = message.match(/\bHTTP (\d{3})\b/);
          const transient = status ? [429, 502, 503, 504].includes(Number(status[1]))
            : /fetch failed|\b(?:ECONNRESET|ETIMEDOUT|ECONNREFUSED|EPIPE|EAI_AGAIN|ENETUNREACH|EHOSTUNREACH|UND_ERR_[A-Z_]+)\b|timeout \(30 s\)|network|socket (?:hang up|closed)/i.test(message);
          if (!transient || entry.retries >= backoff.length) throw error;
          const delay = backoff[entry.retries++];
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    };
    await restoreRequest(`/api/services/${entry.domain}/${entry.service}`, 'POST', entry.data);
    const end = Date.now() + 5000;
    do {
      const actual = await restoreRequest(`/api/states/${encodeURIComponent(id)}`);
      if (Object.entries(entry.verify).every(([key, value]) => equal(stateValue(actual, key), value))) return;
      await new Promise((r) => setTimeout(r, 50));
    } while (Date.now() < end);
    throw new Error(`REST restoration did not converge: ${id}`);
  };
  let restoreWork = Promise.resolve(), drainWork = Promise.resolve();
  const restore = (entry) => {
    const task = restoreWork.then(() => performRestore(entry));
    restoreWork = task.catch(() => {});
    return task;
  };
  const drainJournal = () => {
    const task = drainWork.then(async () => {
      const restored = [];
      for (const entry of [...journal]) {
        try {
          await restore(entry);
          journal.delete(entry);
          restored.push(entry);
          report.restores.push(clean({ ...entry, status: 'PASS' }));
        } catch (error) {
          report.restores.push(clean({ ...entry, status: 'FAIL', error: safeError(error) }));
          report.checks.push({ name: `restore: ${entry.data.entity_id}`, view: entry.view, status: 'FAIL', error: safeError(error) });
        }
      }
      return restored;
    });
    drainWork = task.catch(() => {});
    return task;
  };
  const selectorHost = async (c, type) => {
    const hosts = card(c).locator(S.selector), kind = kindOf(type);
    for (let i = 0; i < await hosts.count(); i++) if (await evaluate(hosts.nth(i), (el) => el.kind) === kind) return hosts.nth(i);
    throw new Error(`Missing ${type}`);
  };
  const pick = async (host, display, value) => {
    const row = host.locator(S.row).first();
    const items = await evaluate(row, (el) => el.items.map((i) => ({ value: i.value, label: i.label })));
    const index = items.findIndex((i) => i.value === value);
    assert(index >= 0, `Missing option ${value}`);
    if (display === 'icons') await row.locator(S.chip).nth(index).click();
    else {
      await row.locator(S.trigger).click();
      await row.locator(S.option).nth(index).click();
    }
  };
  const openView = async (view) => {
    context = await browser.newContext({ viewport: { width: 1600, height: 1200 }, colorScheme: opts.scheme, serviceWorkers: 'block' });
    context.setDefaultTimeout(TIMEOUT); context.setDefaultNavigationTimeout(60000);
    await context.addInitScript(({ url, token }) => {
      if (window !== window.top || location.origin !== new URL(url).origin) return;
      localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: url, clientId: `${url}/`, access_token: token,
        token_type: 'Bearer', expires_in: 315360000, expires: Date.now() + 315360000000, refresh_token: 'x' }));
    }, auth);
    page = await context.newPage();
    const requireOrigin = (url) => {
      if (new URL(url).origin !== new URL(auth.url).origin) {
        originViolation = new Error('Unexpected top-level origin; only HA origin allowed; context closed');
        throw abort(originViolation);
      }
    };
    page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) { try { requireOrigin(frame.url()); } catch { /* abort recorded */ } } });
    await page.route('**/*', async (route) => {
      if (route.request().isNavigationRequest() && route.request().frame() === page.mainFrame()) {
        try { requireOrigin(route.request().url()); } catch { await route.abort().catch(() => {}); return; }
      }
      await route.continue();
    });
    await page.route('**/material-thermostat-card*.js*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/javascript', body: bundle }); report.bundleRouteHit++;
    });
    page.on('websocket', (ws) => ws.on('framesent', ({ payload }) => {
      try {
        const f = JSON.parse(String(payload));
        if (f.type === 'call_service') report.frames.push(clean({ at: Date.now(), view: currentView, type: f.type,
          domain: f.domain, service: f.service, service_data: f.service_data, target: f.target }));
      } catch { /* Never retain authentication/non-service frames. */ }
    }));
    page.on('console', (msg) => { if (msg.type() === 'error') report.consoleErrors.push(clean({ text: msg.text(), location: msg.location().url })); });
    page.on('pageerror', (e) => report.consoleErrors.push(clean({ text: e.message, location: e.stack ?? '' })));
    const hitsBefore = report.bundleRouteHit;
    await bounded(() => page.goto(`${auth.url}/${URL_PATH}/${view}`, { waitUntil: 'domcontentloaded' }), 'initial navigation', 60000);
    requireOrigin(page.url());
    await poll(() => evaluate(page, (S) => !!document.querySelector(S.ha)?.hass?.states, S), 'HA ready', TIMEOUT);
    await poll(() => report.bundleRouteHit > hitsBefore, 'fresh context local bundle route', TIMEOUT);
    if (opts.lang) {
      await evaluate(page, async ({ lang, S }) => {
        const ha = document.querySelector(S.ha);
        if (typeof ha._selectLanguage !== 'function') throw new Error('In-session language switch unavailable');
        await ha._selectLanguage(lang, false); // Never save to the real user's profile.
      }, { lang: opts.lang, S });
      await poll(() => evaluate(page, ({ lang, S }) => document.querySelector(S.ha).hass.language === lang, { lang: opts.lang, S }), 'session language');
    }
    report.language = await evaluate(page, (S) => document.querySelector(S.ha).hass.language, S);
    assert(/^[a-zA-Z0-9-]+$/.test(report.language), 'Unsafe session language');
    out = resolve(root, 'dev/qa/out', `${report.language}-${opts.scheme}`);
    await mkdir(out, { recursive: true });
    const theme = await evaluate(page, (S) => Object.keys(document.querySelector(S.ha).hass.themes?.themes ?? {})[0], S);
    cases = buildCases({ theme }).filter((c) => selectedViews.includes(c.view));
    report.cases = cases;
  };
  try {
    for (const view of selectedViews) {
      currentView = view;
      try {
      activeScope = {};
      await viewScope.run(activeScope, async () => {
      if (!context || fatal || page?.isClosed()) {
        fatal = undefined;
        await openView(view);
      }
      const vc = cases.filter((c) => c.view === view);
      // Large matrix views get a finite budget proportional to their declared work.
      const viewBudget = 120000 + vc.length * 12000 + vc.flatMap((c) => journeys(c, opts)).length * 120000;
      await bounded(async () => {
        if (new URL(page.url()).pathname !== `/${URL_PATH}/${view}`) {
          // SPA navigation keeps the in-session language; a reload would reset it.
          await evaluate(page, (path) => { history.pushState(null, '', path); window.dispatchEvent(new CustomEvent('location-changed')); }, `/${URL_PATH}/${view}`);
        }
        let ready = false;
        await check(`view ${view}: all cases rendered`, async () => {
          await poll(() => evaluate(page, ({ vc, S }) => {
            function deep(root, selector) {
              const found = [...root.querySelectorAll(selector)];
              for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deep(el.shadowRoot, selector));
    if (root.shadowRoot) found.push(...deep(root.shadowRoot, selector));
              return found;
            }
            const cards = deep(document, `${S.card}, ${S.stock}`);
            // Surface a configuration error immediately instead of timing out on
            // the missing card and losing its section/message evidence.
            if (deep(document, S.error).length) return true;
            for (const c of vc) {
              const matches = cards.filter((el) => el._config?.qa_id === c.config.qa_id && el.matches(c.kind === 'ours' ? S.card : S.stock));
              if (matches.length !== 1 || !deep(matches[0], S.shell).some((el) => el.getBoundingClientRect().width)) return false;
              matches[0].setAttribute('data-mtqa-id', c.id);
            }
            return true;
          }, { vc, S }), `${view}: every declared card`, TIMEOUT);
          assert(report.bundleRouteHit > 0, 'Local dist route was never hit; refusing to test installed HACS bundle');
          const errors = await evaluate(page, (S) => {
            function deep(root, selector) {
              const found = [...root.querySelectorAll(selector)];
              for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deep(el.shadowRoot, selector));
    if (root.shadowRoot) found.push(...deep(root.shadowRoot, selector));
              return found;
            }
            return deep(document, S.error).map((el) => {
              let section = el;
              while (section && !section.matches?.(S.section)) section = section.parentElement ?? section.getRootNode().host;
              const heading = section && deep(section, S.heading)[0];
              return { section: heading?._config?.heading ?? '(unknown section)', message: el._config?.error ?? el.shadowRoot?.textContent ?? el.textContent };
            });
          }, S);
          assert(!errors.length, JSON.stringify(errors));
          await poll(() => evaluate(page, ({ ids, S }) => {
            function deep(root, selector) {
              const found = [...root.querySelectorAll(selector)];
              for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deep(el.shadowRoot, selector));
    if (root.shadowRoot) found.push(...deep(root.shadowRoot, selector));
              return found;
            }
            return deep(document, `${S.card}, ${S.stock}`).filter((el) => ids.includes(el.getAttribute('data-mtqa-id'))).every((host) =>
              deep(host, S.icon).every((icon) => deep(icon, S.svgIcon).length) &&
              deep(host, S.svgIcon).every((svg) => deep(svg, S.path).length));
          }, { ids: vc.map((c) => c.id), S }), `${view}: icons ready`, TIMEOUT);
          ready = true;
          return { cases: vc.length, errors };
        });
        if (!ready) return;
        for (const section of [...new Set(vc.map((c) => c.section))]) await check(`view ${view}: screenshot ${section}`, async () => {
          const first = vc.find((c) => c.section === section);
          const tag = `${view}-${slug(section)}`;
          const hasSection = await evaluate(card(first), (host, { tag, S }) => {
            let el = host;
            while (el && !el.matches?.(S.section)) el = el.parentElement ?? el.getRootNode().host;
            if (!el) return false; // Masonry has no section element.
            el.setAttribute('data-mtqa-section', tag);
            return true;
          }, { tag, S });
          await mkdir(resolve(out, view), { recursive: true });
          const path = `${view}/${slug(section)}.png`;
          if (hasSection) await page.locator(`[data-mtqa-section=${JSON.stringify(tag)}]`).screenshot({ path: resolve(out, path), timeout: TIMEOUT });
          else {
            // The masonry view is one declared section. Full-page capture also
            // preserves headings and avoids a viewport-clipped union rectangle.
            await page.screenshot({ path: resolve(out, path), fullPage: true, timeout: TIMEOUT });
          }
          return { screenshot: path };
        });

        for (const c of vc.filter((c) => c.kind === 'ours')) {
          const e = c.expect, scenario = scenarioFor(c);
          assert(e, `${c.id}: missing our expectations`);
          await check(`${c.id}: sliders`, async () => { const a = await snapshot(c); assert(a.sliders.length === e.sliders, `Expected ${e.sliders}; got ${a.sliders.length}`); return a.sliders; });
          await check(`${c.id}: plus-minus`, async () => { const a = await snapshot(c); assert(a.increase === Number(e.plusMinus) && a.decrease === Number(e.plusMinus), `Expected ± ${e.plusMinus}; got +${a.increase}/-${a.decrease}`); });
          await check(`${c.id}: unavailable`, async () => {
            const a = await snapshot(c); assert(a.dial && a.dial.disabled === e.unavailable, `Dial disabled ${a.dial?.disabled}; expected ${e.unavailable}`);
            assert(a.controls.every((d) => d === e.unavailable), `Control disabled flags ${a.controls}`);
          });
          await check(`${c.id}: state-label`, async () => {
            // Unavailable/unknown retain their disabled label; available cards never
            // show a dial status line.
            const a = await snapshot(c);
            if (!e.unavailable) assert(e.stateLabel === false && a.stateLabels.length === 0, `State labels ${JSON.stringify(a.stateLabels)}`);
          });
          await check(`${c.id}: mode-icon`, async () => {
            // Climate preset behaviour is unchanged; this oracle covers water heaters only.
            if (!Object.hasOwn(e, 'modeIcon')) return { applicable: false };
            const a = await snapshot(c), expected = e.modeIcon;
            assert(a.modeIcons.length === (expected ? 1 : 0), `Mode icons ${JSON.stringify(a.modeIcons)}; expected ${JSON.stringify(expected)}`);
            if (expected) {
              const color = await evaluate(page, (value) => {
                const el = document.createElement('span'); el.style.color = value; return el.style.color;
              }, expected.color);
              const [icon] = a.modeIcons;
              assert(icon.icon === expected.icon && icon.color === color && icon.visible && icon.belowNumber,
                `Mode icon ${JSON.stringify(icon)}; expected ${JSON.stringify(expected)} below dial number`);
            }
            return a.modeIcons;
          });
          await check(`${c.id}: selectors`, async () => {
            let a = await snapshot(c);
            const expectedKinds = e.selectors.map((s) => kindOf(s.type));
            assert(a.selectors.filter((s) => s.items.length).every((s) => expectedKinds.includes(s.kind)), 'Unexpected rendered selector');
            for (const ex of e.selectors) {
              const host = await selectorHost(c, ex.type);
              const before = a.selectors.find((s) => s.kind === kindOf(ex.type));
              assert(before && before.display === ex.display, `Missing/wrong display ${ex.type}`);
              const disabled = ex.disabled;
              // Disabled dropdowns cannot expose a menu. Their item model is checked,
              // and the disabled trigger must prevent opening it (J-unavailable).
              const open = ex.display !== 'icons' && !disabled;
              if (open) await host.locator(S.trigger).click();
              try {
                a = await snapshot(c);
                const actual = a.selectors.find((s) => s.kind === kindOf(ex.type));
                const values = actual.items.map((i) => i.value);
                assert(equal(ex.ordered ? values : [...values].sort(), ex.ordered ? ex.items : [...ex.items].sort()), `${ex.type}: values ${JSON.stringify(values)}; expected ${JSON.stringify(ex.items)}`);
                const controls = actual.controls;
                if (!disabled || ex.display === 'icons') assert(controls.length === ex.items.length, `${ex.type}: missing visible options`);
                for (let i = 0; i < actual.items.length; i++) {
                  const item = actual.items[i], rendered = controls[i];
                  const active = ex.active === item.value && ex.items.includes(ex.active);
                  assert(!!item.active === active && (!rendered || rendered.active === active), `${ex.type}/${item.value}: wrong active marker`);
                  assert(!!item.disabled === disabled && (!rendered || rendered.disabled === disabled), `${ex.type}/${item.value}: wrong disabled state`);
                  if (ex.labels[item.value] !== undefined) assert(item.label === ex.labels[item.value] && (!rendered || rendered.label === ex.labels[item.value]), `${item.value}: label override ignored`);
                  if (rendered) assert(rendered.label === item.label, `${item.value}: DOM/model label mismatch`);
                }
                if (ex.display !== 'icons') assert(actual.triggerDisabled.every((d) => d === disabled), 'Wrong dropdown disabled state');
              } finally { if (open) await host.locator(S.trigger).click(); }
            }
            return { selectors: a.selectors };
          });
          await check(`${c.id}: labels`, async () => {
            const a = await snapshot(c);
            for (const ex of e.selectors) for (const item of a.selectors.find((s) => s.kind === kindOf(ex.type))?.items ?? []) {
              assert(ex.labels[item.value] !== undefined || !/^[a-z]+(?:_[a-z]+)*$/.test(item.label.trim()) || item.label.trim() !== item.value,
                `Raw label ${ex.type}/${item.value}: ${item.label}`);
            }
          });
          await check(`${c.id}: away`, async () => {
            const a = await snapshot(c), rendered = a.away.filter((v) => v.buttons.length);
            if (!e.away) assert(!rendered.length, 'Unexpected away control');
            else {
              assert(rendered.length === 1, 'Missing/duplicate away control');
              const [away] = rendered;
              assert(away.display === e.away.display && away.buttons.length === 1 && away.buttons[0].pressed === String(e.away.state === 'on') && away.buttons[0].disabled === e.away.disabled, `Wrong away state ${JSON.stringify(away)}`);
              if (e.away.label) assert(away.text.includes(e.away.label), `Missing away label ${e.away.label}`);
            }
          });
          await check(`${c.id}: aux`, async () => { const a = await snapshot(c); for (const type of e.aux) assert(a.aux[type]?.some(Boolean), `Missing/empty aux ${type}`); });
          await check(`${c.id}: text`, async () => { const a = await snapshot(c); assert(!/NaN|undefined|\[object Object\]|\bnull\b/.test(a.text), 'Invalid deep text'); });
          await check(`${c.id}: layout`, async () => {
            const a = await snapshot(c); assert(a.bounds && !a.overflow.length, `Overflow: ${JSON.stringify(a.overflow)}`);
            const neighbours = await evaluate(page, ({ id, S }) => {
              function deep(root, selector) {
                const found = [...root.querySelectorAll(selector)];
                for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deep(el.shadowRoot, selector));
    if (root.shadowRoot) found.push(...deep(root.shadowRoot, selector));
                return found;
              }
              return deep(document, `${S.card}, ${S.stock}`).filter((el) => el.getAttribute('data-mtqa-id') !== id).map((el) => el.getBoundingClientRect().toJSON());
            }, { id: c.id, S });
            assert(!neighbours.some((b) => Math.min(a.bounds.right, b.right) - Math.max(a.bounds.left, b.left) > 2 && Math.min(a.bounds.bottom, b.bottom) - Math.max(a.bounds.top, b.top) > 2), 'Card overlaps neighbour');
            if (a.scroll.length) warn(`${c.id}: scrolling chip rows (known)`, a.scroll);
            return { bounds: a.bounds, measuredNeighbours: neighbours.length };
          });
          await check(`${c.id}: values`, async () => {
            const a = await snapshot(c), expected = scenario.expect;
            const values = expected.model === 'single' ? [expected.target] : expected.model === 'dual' ? [expected.low, expected.high] : [];
            assert(equal(a.sliders.map((s) => s.value), values), `Slider values ${JSON.stringify(a.sliders)}; expected ${JSON.stringify(values)}`);
            const current = a.current.filter((t) => t.trim() && !(t.includes('—') && !/\d/.test(t)));
            assert((current.length > 0) === (expected.current !== null), `Current visibility ${JSON.stringify(a.current)}; expected ${expected.current}`);
            if (expected.current !== null) {
              const digits = (v) => String(v).replace(/\D/g, '');
              // Text mixes the visible number (integer + superscript fraction tokens) with
              // sr-only text ("Current 21.3 °C"): match a token or an integer+fraction pair.
              const want = digits(expected.current);
              const hit = (t) => {
                const tokens = t.split(/\s+/).map(digits).filter(Boolean);
                return tokens.some((tok, i) => tok === want || tok + (tokens[i + 1] ?? '') === want);
              };
              // feels_like.show_as_current on climate replaces the reading with the computed
              // feels-like value, so only presence is asserted (above) in that case.
              const feelsLike = c.config.feels_like?.show_as_current && scenario.domain === 'climate';
              if (!feelsLike) assert(current.some(hit), `Current temperature ${expected.current} not visible: ${a.current}`);
            }
          });
        }

        for (const c of vc) for (const j of journeys(c, { ...opts, lang: report.language })) {
          try {
          await check(`${c.id}: ${j.type}${j.selector ? ` ${j.selector.type}=${j.value}` : ''}${j.feature ? ` ${j.feature}` : ''}`, async () => {
            const s = scenarioFor(c), id = s.entity_id;
            if (j.type === 'J-select') {
              const [domain, service, key, attribute] = SERVICES[kindOf(j.selector.type)] ?? [];
              assert(domain, `Unknown selector service ${j.selector.type}`);
              const original = stateValue(await state(id), attribute);
              assert(typeof original === 'string', `Cannot restore unset ${attribute}; no mutation performed`);
              recordRestore(id, domain, service, { [key]: original }, { [attribute]: original });
              const start = report.frames.length, began = Date.now();
              await pick(await selectorHost(c, j.selector.type), j.selector.display, j.value);
              const sent = await exactFrame(start, id, domain, service, { [key]: j.value });
              await waitState(id, attribute, j.value, 5000 - (Date.now() - began));
              return sent;
            }
            if (j.type === 'J-dial') {
              const previous = await state(id), domain = s.domain;
              const dual = s.expect.model === 'dual';
              const original = dual ? { target_temp_low: previous.attributes.target_temp_low, target_temp_high: previous.attributes.target_temp_high } : { temperature: previous.attributes.temperature };
               assert(Object.values(original).every(Number.isFinite), 'Cannot restore missing temperature');
               const entry = recordRestore(id, domain, 'set_temperature', original, original);
               const sliders = card(c).locator(S.dial).locator(S.slider);
                for (let handle = 0; handle < (dual ? 2 : 1); handle++) {
                  for (const key of ['Increase', 'Decrease', 'ArrowUp', 'PageUp', 'Home', 'End']) {
                    if (dual && ['Increase', 'Decrease'].includes(key)) {
                      // Keyboard selection sets the handle used by +/-. Restore
                      // immediately, leaving only selection (not a target edit).
                      const prep = await snapshot(c), start = report.frames.length;
                      const data = { ...original, [handle === 0 ? 'target_temp_low' : 'target_temp_high']: prep.sliders[handle].min };
                      await sliders.nth(handle).press('Home');
                      await exactFrame(start, id, domain, 'set_temperature', data);
                      for (const [attribute, v] of Object.entries(data)) await waitState(id, attribute, v);
                       await restore(entry);
                       for (const [attribute, v] of Object.entries(original)) await waitState(id, attribute, v);
                    }
                    const a = await snapshot(c), slider = a.sliders[handle], step = a.dial.step;
                    assert(Number.isFinite(step) && step > 0, 'Missing positive dial step');
                    // Home/End must respect the other handle as well as absolute limits.
                    const min = dual && handle === 1 ? Math.max(slider.min, a.sliders[0].value) : slider.min;
                    const max = dual && handle === 0 ? Math.min(slider.max, a.sliders[1].value) : slider.max;
                    const value = key === 'Home' ? min : key === 'End' ? max : Math.min(max, Math.max(min, slider.value + step * (key === 'PageUp' ? 10 : key === 'Decrease' ? -1 : 1)));
                    const data = dual ? { target_temp_low: handle === 0 ? value : a.sliders[0].value, target_temp_high: handle === 1 ? value : a.sliders[1].value } : { temperature: value };
                    await sliders.nth(handle).focus();
                    const start = report.frames.length;
                    let began;
                    if (key === 'Increase' || key === 'Decrease') {
                      const button = card(c).locator(key === 'Increase' ? S.increase : S.decrease);
                      await evaluate(button, (el) => el.addEventListener('click', () => el.setAttribute('data-mtqa-click-at', String(Date.now())), { capture: true, once: true }));
                      await button.click();
                      began = Number(await button.getAttribute('data-mtqa-click-at'));
                      assert(Number.isFinite(began) && began > 0, 'Missing click timestamp');
                    } else {
                      began = Date.now();
                      await sliders.nth(handle).press(key);
                    }
                    if (key === 'Increase' || key === 'Decrease') await observe(() => {
                      const early = matching(start, id).filter((f) => f.at - began < 600);
                      assert(!early.length, 'Temperature sent before 600 ms debounce');
                    }, 600);
                    await exactFrame(start, id, domain, 'set_temperature', data);
                    for (const [attribute, v] of Object.entries(data)) await waitState(id, attribute, v);
                    // Reset between keys so PageUp/Home/End each exercise a change.
                     await restore(entry);
                     for (const [attribute, v] of Object.entries(original)) await waitState(id, attribute, v);
                  }
                }
              return { original, handles: dual ? 2 : 1, keys: ['Increase', 'Decrease', 'ArrowUp', 'PageUp', 'Home', 'End'] };
            }
            if (j.type === 'J-away') {
              const original = (await state(id)).attributes.away_mode;
              assert(['on', 'off'].includes(original), 'Cannot safely restore away mode');
              const button = card(c).locator(S.away).locator(S.awayButton);
              const start = report.frames.length;
              try {
                if (c.expect.away.disabled) {
                  await button.dispatchEvent('click');
                  await observe(() => assert(!matching(start, id).length, 'Disabled away sent a frame'));
                } else {
                  await button.click();
                  await exactFrame(start, id, 'water_heater', 'set_away_mode', { away_mode: original !== 'on' });
                }
              } finally {
                // REST fixtures have no service implementation. Assert unchanged;
                // never issue a meaningless restore service to these entities.
                await waitState(id, 'away_mode', original);
              }
              return { original, restFixture: true };
            }
            if (j.type === 'J-unavailable') {
              const start = report.frames.length;
              const controls = card(c).locator(S.controls);
              for (let i = 0; i < await controls.count(); i++) await controls.nth(i).dispatchEvent('click');
              await observe(() => assert(!matching(start, id).length, 'Unavailable control sent service frame'));
              return { controls: await controls.count(), calls: 0 };
            }
            if (j.type === 'J-reject') {
              const slider = card(c).locator(S.slider).first(), original = Number(await slider.getAttribute('aria-valuenow'));
              const step = (await snapshot(c)).dial.step, start = report.frames.length;
              const server = (await state(id)).attributes.temperature;
              assert(Number.isFinite(server) && server === original, 'Reject fixture is not at its server value');
              const began = Date.now();
              try {
                await card(c).locator(S.increase).click();
                await poll(async () => Number(await slider.getAttribute('aria-valuenow')) !== original, 'optimistic change', 2000);
                await exactFrame(start, id, s.domain, 'set_temperature', { temperature: original + step });
                await poll(async () => Number(await slider.getAttribute('aria-valuenow')) === original, 'rejected target rollback', Math.max(1, 8000 - (Date.now() - began)));
              } finally {
                // Reject fixture cannot accept a restore command: server state
                // must be unchanged even when the UI/frame assertion fails.
                await waitState(id, 'temperature', server);
              }
              return { original, rollback: true };
            }
            if (j.type === 'J-aux') {
              const host = card(c).locator(S.aux[j.feature]);
              assert(await host.count() === 1, `Missing/duplicate ${j.feature}`);
              const row = host.locator(S.row);
              const items = await evaluate(row, (el) => el.items.map((i) => ({ value: i.value, active: !!i.active })));
              const display = await evaluate(row, (el) => el.display);
              if (j.feature === 'input-select') {
                const entity = typeof AUX.input_select === 'string' ? AUX.input_select : AUX.input_select.entity_id;
                const original = (await state(entity)).state;
                const options = items.filter((i) => i.value !== original);
                assert(options.length, 'No alternate input-select option');
                for (const item of opts.quick ? options.slice(0, 1) : options) {
                  const start = report.frames.length;
                  await pick(host, display, item.value);
                  await exactFrame(start, entity, 'input_select', 'select_option', { option: item.value });
                }
              } else if (j.feature === 'button-list') {
                for (const item of items) {
                  assert(AUX.buttons.some((b) => (typeof b === 'string' ? b : b.entity_id) === item.value), `Non-fixture button ${item.value}; refusing click`);
                  const start = report.frames.length;
                  await pick(host, display, item.value);
                  await exactFrame(start, item.value, 'button', 'press');
                }
              } else {
                const originals = {};
                for (const item of items) {
                  assert(AUX.switches.some((b) => (typeof b === 'string' ? b : b.entity_id) === item.value), `Non-fixture switch ${item.value}; refusing click`);
                  originals[item.value] = (await state(item.value)).state;
                  assert(['on', 'off'].includes(originals[item.value]), 'Cannot restore unavailable switch');
                }
                 for (const [entity, original] of Object.entries(originals)) recordRestore(entity, 'homeassistant', `turn_${original}`, {}, { state: original });
                   for (const item of items) {
                    const before = Object.fromEntries(await Promise.all(items.map(async (i) => [i.value, (await state(i.value)).state])));
                    const start = report.frames.length;
                    await pick(host, display, item.value);
                    const target = j.feature === 'switch-group' ? 'on' : before[item.value] === 'on' ? 'off' : 'on';
                     const selectedFrame = await exactFrame(start, item.value, 'homeassistant', j.feature === 'switch-group' ? 'turn_on' : 'toggle');
                    await waitState(item.value, 'state', target);
                     // The card turns off only the other switches that were on.
                     if (j.feature === 'switch-group') for (const other of items.filter((i) => i.value !== item.value && before[i.value] === 'on')) {
                       const offFrame = await exactFrame(start, other.value, 'homeassistant', 'turn_off');
                       assert(report.frames.indexOf(offFrame) < report.frames.indexOf(selectedFrame), 'Switch group must turn others off before turning selected on');
                      await waitState(other.value, 'state', 'off');
                    }
                  }
              }
              return { feature: j.feature, items };
            }
            if (j.type === 'J-locale') {
              const a = await snapshot(c);
              const decimal = new Intl.NumberFormat(report.language).formatToParts(1.5).find((p) => p.type === 'decimal')?.value;
              for (const slider of a.sliders.filter((v) => v.value % 1 !== 0)) assert(slider.text?.includes(decimal), `Wrong locale decimal in ${slider.text}`);
              const stock = vc.filter((other) => other.kind === 'stock' && scenarioFor(other).id === s.id);
              const comparisons = [];
              for (const ex of c.expect.selectors.filter((v) => ['hvac', 'operation'].includes(kindOf(v.type)))) {
                const labels = {};
                for (const other of stock) Object.assign(labels, await evaluate(card(other), (host, { S, values }) => {
                  function deep(root, selector) {
                    const found = [...root.querySelectorAll(selector)];
                    for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deep(el.shadowRoot, selector));
    if (root.shadowRoot) found.push(...deep(root.shadowRoot, selector));
                    return found;
                  }
                  // Stock features render ha-control-select / ha-control-select-menu whose
                  // `options` property carries the localized {value, label} pairs.
                  const fromProps = deep(host, 'ha-control-select, ha-control-select-menu')
                    .flatMap((el) => (Array.isArray(el.options) ? el.options : []))
                    .filter((o) => o && values.includes(o.value) && typeof o.label === 'string')
                    .map((o) => [o.value, o.label.trim()]);
                  if (fromProps.length) return Object.fromEntries(fromProps);
                  return Object.fromEntries(deep(host, S.stockOption).filter((el) => values.includes(el.value ?? el.getAttribute('value') ?? el.getAttribute('data-value'))).map((el) => [el.value ?? el.getAttribute('value') ?? el.getAttribute('data-value'), (el.getAttribute('title') || el.getAttribute('aria-label') || el.textContent).trim()]));
                }, { S, values: ex.items }));
                const actual = a.selectors.find((v) => v.kind === kindOf(ex.type));
                // HA's localize has no locale argument: use stable English names only
                // to identify values whose stock option actually differs in this locale.
                const english = { heat: 'Heat', cool: 'Cool', off: 'Off', auto: 'Auto', heat_cool: 'Heat/Cool', electric: 'Electric', gas: 'Gas', performance: 'Performance', high_demand: 'High demand', heat_pump: 'Heat pump' };
                for (const item of actual?.items ?? []) if (labels[item.value] && english[item.value] && labels[item.value] !== english[item.value] && ex.labels[item.value] === undefined) {
                  assert(item.label === labels[item.value] && item.label !== english[item.value], `Locale title ${item.value}: ours ${item.label}; stock ${labels[item.value]}`);
                  comparisons.push({ value: item.value, ours: item.label, stock: labels[item.value] });
                }
                if (ex.items.some((v) => english[v]) && stock.length) assert(comparisons.length, `No translated stock option evidence for ${ex.type}; cannot claim locale parity`);
                assert(stock.length > 0, `${c.id}: cannot verify ${ex.type} locale parity: no stock counterpart for ${s.id} in view ${view}`);
              }
              return { decimal, fractionalSliders: a.sliders.filter((v) => v.value % 1 !== 0).length, stockComparisons: comparisons };
            }
          }, j.type === 'J-dial' ? 120000 : 60000);
          } finally {
            const restored = await drainJournal();
            // REST convergence may precede the browser's WebSocket state update.
            // Do not snapshot a stale "original" for the following journey.
            if (!fatal && !viewScope.getStore()?.cancelled) {
              for (const entry of restored) for (const [key, value] of Object.entries(entry.verify)) {
                await waitState(entry.data.entity_id, key, value);
              }
            }
          }
        }
      }, `view ${view}`, viewBudget);
      });
      } catch (error) {
        activeScope.cancelled ??= error;
        report.checks.push({ name: `view ${view}: runtime`, view, status: 'FAIL', error: safeError(fatal ?? error) });
        await drainJournal();
        await closeContext();
        if (originViolation) throw originViolation;
        fatal = undefined;
      }
    }
  } catch (error) {
    report.checks.push({ name: 'setup/runtime', view: currentView, status: 'FAIL', error: safeError(fatal ?? error) });
  } finally {
    await drainJournal();
    let timer;
    const closed = await Promise.race([browser.close().then(() => true, () => false), new Promise((r) => { timer = setTimeout(() => r(false), 10000); })]);
    clearTimeout(timer);
    if (!closed) report.checks.push({ name: 'browser shutdown', view: 'setup', status: 'FAIL', error: 'Shutdown deadline (10 s)' });
    report.checks.push({ name: 'bundle route hit', view: 'setup', status: report.bundleRouteHit ? 'PASS' : 'FAIL', evidence: { served: report.bundleRouteHit } });
    const bundleErrors = report.consoleErrors.filter((e) => /material-thermostat/i.test(`${e.text} ${e.location}`));
    report.checks.push({ name: 'bundle console errors', view: 'setup', status: bundleErrors.length ? 'FAIL' : 'PASS', evidence: bundleErrors });
    out ??= resolve(root, 'dev/qa/out', `${opts.lang ?? 'session'}-${opts.scheme}`);
    await mkdir(out, { recursive: true });
    await writeFile(resolve(out, 'report.json'), JSON.stringify(clean(report), null, 2));
    for (const view of ['setup', ...selectedViews]) {
      const checks = report.checks.filter((c) => c.view === view);
      console.log(`${view}: ${checks.filter((c) => c.status === 'PASS').length} PASS / ${checks.filter((c) => c.status === 'FAIL').length} FAIL / ${checks.filter((c) => c.status === 'WARN').length} WARN`);
    }
    for (const failure of report.checks.filter((c) => c.status === 'FAIL')) console.log(safeError(`FAIL ${failure.name}: ${failure.error ?? JSON.stringify(failure.evidence)}`));
    const counts = ['PASS', 'FAIL', 'WARN'].map((status) => `${report.checks.filter((c) => c.status === status).length} ${status}`).join(' / ');
    console.log(`TOTAL: ${counts}; ${resolve(out, 'report.json')}`);
    if (report.checks.some((c) => c.status === 'FAIL')) process.exitCode = 1;
    if (!closed) process.exit(1);
  }
}
main().catch((error) => { console.error(safeError(error)); process.exitCode = 1; });
