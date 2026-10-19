import { buildDashboard, URL_PATH, CASES } from './dashboard.mjs';
import { credentials, flags, connect, safeError } from './ha-client.mjs';
const create = { type: 'lovelace/dashboards/create', url_path: URL_PATH, title: 'MT Parity QA', icon: 'mdi:test-tube', require_admin: true, show_in_sidebar: true, mode: 'storage' };
async function main() {
  const args = flags(['--dry-run', '--delete']);
  if (args.has('--dry-run')) {
    console.log(JSON.stringify(args.has('--delete') ? [{ type: 'lovelace/dashboards/list' }, { type: 'lovelace/dashboards/delete', dashboard_id: '<existing dashboard id>' }] : [
      { type: 'lovelace/dashboards/list' }, create, { type: 'frontend/get_themes' },
      { type: 'lovelace/config/save', url_path: URL_PATH, config: buildDashboard() },
    ], null, 2)); return;
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
    const themes = await ws.request({ type: 'frontend/get_themes' });
    await ws.request({ type: 'lovelace/config/save', url_path: URL_PATH, config: buildDashboard(Object.keys(themes.themes ?? {})[0]) });
    console.log(`Published ${CASES.length} parity cases at /${URL_PATH}/0`);
  } finally { ws.close(); }
}
main().catch((error) => { console.error(safeError(error)); process.exitCode = 1; });
