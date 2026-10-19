import { buildDashboard, URL_PATH } from './dashboard.mjs';
import { buildCases } from './cases.mjs';
import { credentials, flags, connect, safeError } from './ha-client.mjs';
const create = { type: 'lovelace/dashboards/create', url_path: URL_PATH, title: 'MT Parity QA', icon: 'mdi:test-tube', require_admin: true, show_in_sidebar: true, mode: 'storage' };
function summary(config, theme) {
  const cases = buildCases({ theme });
  console.log(`Published ${config.views.length} views, ${cases.filter((c) => c.kind === 'ours').length} our cards, ${cases.filter((c) => c.kind === 'stock').length} stock cards at /${URL_PATH}`);
}
async function main() {
  const args = flags(['--dry-run', '--delete']);
  if (args.has('--dry-run')) {
    const config = buildDashboard();
    console.log(JSON.stringify(args.has('--delete') ? [{ type: 'lovelace/dashboards/list' }, { type: 'lovelace/dashboards/delete', dashboard_id: '<existing dashboard id>' }] : [
      { type: 'lovelace/dashboards/list' }, create, { type: 'frontend/get_themes' },
      { type: 'lovelace/config/save', url_path: URL_PATH, config },
    ], null, 2));
    if (!args.has('--delete')) summary(config);
    return;
  }
  const ws = await connect(credentials());
  try {
    const dashboards = await ws.request({ type: 'lovelace/dashboards/list' });
    const existing = dashboards.find((d) => d.url_path === URL_PATH);
    if (existing && existing.mode !== 'storage') throw new Error('Refusing to modify non-storage QA dashboard');
    if (args.has('--delete')) {
      if (existing) await ws.request({ type: 'lovelace/dashboards/delete', dashboard_id: existing.id });
      console.log('QA dashboard removed (or already absent)'); return;
    }
    if (!existing) await ws.request(create);
    else await ws.request({ type: 'lovelace/dashboards/update', dashboard_id: existing.id, require_admin: true });
    const themes = await ws.request({ type: 'frontend/get_themes' });
    const theme = Object.keys(themes.themes ?? {}).find((name) => name.toLowerCase() !== 'default');
    const config = buildDashboard({ theme });
    await ws.request({ type: 'lovelace/config/save', url_path: URL_PATH, config });
    summary(config, theme);
  } finally { ws.close(); }
}
main().catch((error) => { console.error(safeError(error)); process.exitCode = 1; });
