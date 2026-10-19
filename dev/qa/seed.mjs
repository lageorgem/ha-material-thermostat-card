import { DISCOVERY, RETAINED_STATES, REST_ENTITIES, MQTT_ENTITIES, INITIAL_SERVICES } from './entities.mjs';
import { credentials, flags, rest, safeError, TIMEOUT } from './ha-client.mjs';
import { SCENARIOS, AUX, checkMatrix } from './matrix.mjs';

async function main() {
  const args = flags(['--dry-run', '--cleanup']);
  checkMatrix();
  const auxCount = 1 + AUX.switches.length + AUX.buttons.length + Object.keys(AUX.sensors).length;
  const cleanup = args.has('--cleanup');
  const publications = [...DISCOVERY, ...RETAINED_STATES].map((p) => cleanup ? { ...p, payload: '' } : p);
  const plan = [
    ...publications.map((body) => ({ method: 'POST', path: '/api/services/mqtt/publish', body })),
    ...REST_ENTITIES.map(({ entity_id, body }) => ({ method: cleanup ? 'DELETE' : 'POST', path: `/api/states/${entity_id}`, ...(!cleanup ? { body } : {}) })),
    ...(!cleanup ? INITIAL_SERVICES.map(({ domain, service, data }) => ({ method: 'POST', path: `/api/services/${domain}/${service}`, body: data })) : []),
  ];
  // Guard every write even if a future fixture accidentally escapes the namespace.
  for (const { topic } of publications) {
    if (!/^mtqa\/mtqa_[a-z0-9_]+\//.test(topic) && !/^homeassistant\/(climate|water_heater|switch|button|sensor)\/mtqa_[a-z0-9_]+\/config$/.test(topic)) throw new Error('Unsafe QA MQTT topic');
  }
  for (const { entity_id } of REST_ENTITIES) if (!/^(climate|water_heater|input_select)\.mtqa_[a-z0-9_]+$/.test(entity_id)) throw new Error('Unsafe QA REST entity');
  for (const { data } of INITIAL_SERVICES) if (!/^(climate|water_heater|switch)\.mtqa_[a-z0-9_]+$/.test(data.entity_id)) throw new Error('Unsafe QA service entity');
  const summary = cleanup ? `Removed ${SCENARIOS.length} scenarios + ${auxCount} aux entities` : `Seeded ${SCENARIOS.length} scenarios + ${auxCount} aux entities`;
  if (args.has('--dry-run')) { console.log(JSON.stringify({ scenarios: SCENARIOS.length, aux: auxCount, cleanup, requests: plan }, null, 2)); console.log(summary); return; }
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
   console.log(summary);
}
main().catch((error) => { console.error(safeError(error)); process.exitCode = 1; });
