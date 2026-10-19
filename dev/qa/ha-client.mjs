export const TIMEOUT = 30000;
export function credentials() {
  const { HA_URL, HA_TOKEN } = process.env;
  if (!HA_URL || !HA_TOKEN) throw new Error('Set HA_URL and HA_TOKEN');
  const url = new URL(HA_URL);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('HA_URL must be HTTP(S) without embedded credentials');
  return { url: url.origin, token: HA_TOKEN };
}
export function safeError(error) {
  return String(error?.message ?? error).split(process.env.HA_TOKEN || '\0').join('[REDACTED]');
}
export async function rest(auth, path, method = 'GET', body) {
  let response;
  try {
    response = await fetch(new URL(path, auth.url), { method, headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(TIMEOUT) });
    if (method === 'DELETE' && response.status === 404) return;
    if (!response.ok) throw new Error(`HA REST ${method} ${path}: HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') throw new Error(`HA REST ${method} ${path}: timeout (30 s)`);
    throw new Error(safeError(error));
  }
}
export async function connect(auth) {
  const endpoint = new URL('/api/websocket', auth.url);
  endpoint.protocol = endpoint.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(endpoint);
  const pending = new Map();
  let nextId = 1;
  let readyResolve, readyReject;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  const authTimer = setTimeout(() => { readyReject(new Error('HA WebSocket auth timeout (30 s)')); socket.close(); }, TIMEOUT);
  const fail = (message) => {
    clearTimeout(authTimer);
    readyReject(new Error(message));
    for (const { reject, timer } of pending.values()) { clearTimeout(timer); reject(new Error(message)); }
    pending.clear();
  };
  socket.addEventListener('error', () => fail('HA WebSocket error'));
  socket.addEventListener('close', () => fail('HA WebSocket closed'));
  socket.addEventListener('message', ({ data }) => {
    let msg;
    try { msg = JSON.parse(data); } catch { fail('Invalid HA WebSocket JSON'); return; }
    if (msg.type === 'auth_required') socket.send(JSON.stringify({ type: 'auth', access_token: auth.token }));
    if (msg.type === 'auth_invalid') { fail('HA authentication rejected'); socket.close(); }
    if (msg.type === 'auth_ok') { clearTimeout(authTimer); readyResolve(); }
    if (msg.type === 'result' && pending.has(msg.id)) {
      const waiter = pending.get(msg.id); pending.delete(msg.id); clearTimeout(waiter.timer);
      if (msg.success) waiter.resolve(msg.result);
      else waiter.reject(new Error(`HA WS command rejected: ${msg.error?.code || 'unknown'}`));
    }
  });
  await ready;
  return {
    request(message) {
      return new Promise((resolve, reject) => {
        if (socket.readyState !== WebSocket.OPEN) { reject(new Error('HA WebSocket not open')); return; }
        const id = nextId++;
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`HA WS ${message.type}: timeout (30 s)`)); }, TIMEOUT);
        pending.set(id, { resolve, reject, timer });
        socket.send(JSON.stringify({ ...message, id }));
      });
    },
    close() { fail('HA WebSocket closed'); socket.close(); },
  };
}
export function flags(allowed) {
  const args = process.argv.slice(2);
  for (const arg of args) if (!allowed.includes(arg)) throw new Error(`Unknown argument: ${arg}`);
  return new Set(args);
}
