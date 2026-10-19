import { DISCOVERY, RETAINED_STATES, REST_ENTITIES, MQTT_ENTITIES, INITIAL_SERVICES } from './entities.mjs';
import { credentials, flags, rest, safeError, TIMEOUT } from './ha-client.mjs';

async function main() {
  const args = flags(['--dry-run', '--cleanup']);
  const cleanup = args.has('--cleanup');
  const publications = [...DISCOVERY, ...RETAINED_STATES].map((p) => cleanup ? { ...p, payload: '' } : p);
  const plan = [
    ...publications.map((body) => ({ method: 'POST', path: '/api/services/mqtt/publish', body })),
    ...REST_ENTITIES.map(({ entity_id, body }) => ({ method: cleanup ? 'DELETE' : 'POST', path: `/api/states/${entity_id}`, ...(!cleanup ? { body } : {}) })),
    ...(!cleanup ? INITIAL_SERVICES.map(({ domain, service, data }) => ({ method: 'POST', path: `/api/services/${domain}/${service}`, body: data })) : []),
  ];
  if (args.has('--dry-run')) { console.log(JSON.stringify({ entities: 13, cleanup, requests: plan }, null, 2)); return; }
  const auth = credentials();
  for (const request of plan) {
    // Discovery is asynchronous: wait for all entities before initializing optimistic targets.
    if (!cleanup && request === plan[publications.length + REST_ENTITIES.length]) {
      const deadline = Date.now() + TIMEOUT;
      while (true) {
        const states = await rest(auth, '/api/states');
        if (MQTT_ENTITIES.every(({ domain, id }) => states.some((s) => s.entity_id === `${domain}.${id}`))) break;
        if (Date.now() >= deadline) throw new Error('MQTT discovery timeout (30 s); check entity ID collisions and MQTT logs');
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    await rest(auth, request.path, request.method, request.body);
  }
  console.log(cleanup ? 'Removed QA discovery, retained state topics and REST entities' : 'Seeded 13 QA entities');
}
main().catch((error) => { console.error(safeError(error)); process.exitCode = 1; });
