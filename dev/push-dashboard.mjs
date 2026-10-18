/**
 * HA_URL=… HA_TOKEN=… node dev/push-dashboard.mjs publishes only /mt-showcase/0.
 * --dry-run needs no credentials. Overrides are client-side only: this saves
 * the shared card configs, not screenshot state/history/drag overrides.
 */
import { isDeepStrictEqual } from 'node:util';
import { SHOTS } from './showcase.mjs';

const TIMEOUT = 30000;
const config = {
  title: 'Material Thermostat',
  views: [
    {
      title: 'Showcase',
      path: '0',
      type: 'sections',
      max_columns: 4,
      sections: SHOTS.map((shot) => ({
        type: 'grid',
        cards: [{ type: 'heading', heading: `${shot.name}: ${shot.title}` }, shot.config],
      })),
    },
  ],
};

async function timed(promise) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Home Assistant request timed out')), TIMEOUT);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function connect(url, token) {
  if (!globalThis.WebSocket) {
    const library = await import('home-assistant-js-websocket');
    const auth = library.createLongLivedTokenAuth(url.origin, token);
    const connection = await timed(library.createConnection({ auth }));
    return {
      request: (message) => timed(connection.sendMessagePromise(message)),
      close: () => connection.close(),
    };
  }

  const endpoint = new URL('/api/websocket', url);
  endpoint.protocol = 'wss:';
  const socket = new WebSocket(endpoint);
  const pending = new Map();
  let nextId = 1;
  let authenticated = false;
  let resolveAuth;
  let rejectAuth;
  const auth = new Promise((resolve, reject) => {
    resolveAuth = resolve;
    rejectAuth = reject;
  });

  function fail(error) {
    rejectAuth(error);
    for (const waiter of pending.values()) waiter.reject(error);
    pending.clear();
  }

  socket.addEventListener('error', () => fail(new Error('Home Assistant WebSocket error')));
  socket.addEventListener('close', () => fail(new Error('Home Assistant WebSocket closed')));
  socket.addEventListener('message', ({ data }) => {
    try {
      const message = JSON.parse(data);
      if (message.type === 'auth_required') {
        socket.send(JSON.stringify({ type: 'auth', access_token: token }));
      } else if (message.type === 'auth_ok') {
        authenticated = true;
        resolveAuth();
      } else if (message.type === 'auth_invalid') {
        fail(new Error('Home Assistant authentication rejected'));
      } else if (message.type === 'result') {
        const waiter = pending.get(message.id);
        if (!waiter) return;
        pending.delete(message.id);
        if (message.success) waiter.resolve(message.result);
        else waiter.reject(new Error(`Home Assistant command failed: ${message.error?.code}`));
      }
    } catch {
      fail(new Error('Invalid Home Assistant WebSocket message'));
    }
  });

  try {
    await timed(auth);
  } catch (error) {
    socket.close();
    throw error;
  }

  return {
    async request(message) {
      if (!authenticated || socket.readyState !== WebSocket.OPEN) {
        throw new Error('Home Assistant WebSocket is not connected');
      }
      const id = nextId++;
      try {
        return await timed(
          new Promise((resolve, reject) => {
            pending.set(id, { resolve, reject });
            socket.send(JSON.stringify({ ...message, id }));
          })
        );
      } finally {
        pending.delete(id);
      }
    },
    close: () => socket.close(),
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--dry-run')) {
    throw new Error('Usage: node dev/push-dashboard.mjs [--dry-run]');
  }
  if (args.includes('--dry-run')) {
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  const { HA_URL, HA_TOKEN } = process.env;
  if (!HA_URL || !HA_TOKEN) throw new Error('Set HA_URL and HA_TOKEN env vars.');
  let url;
  try {
    url = new URL(HA_URL);
  } catch {
    throw new Error('HA_URL must be a valid HTTPS URL');
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('HA_URL must be HTTPS without embedded credentials');
  }

  const connection = await connect(url, HA_TOKEN);
  try {
    const dashboards = await connection.request({ type: 'lovelace/dashboards/list' });
    if (!Array.isArray(dashboards)) throw new Error('Invalid dashboard list response');
    const existing = dashboards.find((dashboard) => dashboard.url_path === 'mt-showcase');
    if (existing && existing.mode !== 'storage') {
      throw new Error('Refusing to overwrite a non-storage showcase dashboard');
    }
    if (!existing) {
      await connection.request({
        type: 'lovelace/dashboards/create',
        url_path: 'mt-showcase',
        title: 'Material Thermostat',
        icon: 'mdi:thermostat',
        show_in_sidebar: false,
        require_admin: true,
        mode: 'storage',
      });
    }
    await connection.request({
      type: 'lovelace/config/save',
      url_path: 'mt-showcase',
      config,
    });
    const saved = await connection.request({
      type: 'lovelace/config',
      url_path: 'mt-showcase',
    });
    if (!isDeepStrictEqual(saved, config)) throw new Error('Dashboard read-back did not match');
    console.log(`saved ${SHOTS.length} cards to /mt-showcase/0 (live entities; screenshot overrides not applied)`);
  } finally {
    connection.close();
  }
}

main().catch(() => {
  // Never echo server/library errors: they can contain credentials or URL details.
  console.error('Dashboard publish failed. Check environment, auth and dashboard access.');
  process.exitCode = 1;
});
