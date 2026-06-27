import type { HomeAssistant } from 'custom-card-helpers';

/** A recorded `hass.callService` invocation. */
export interface ServiceCall {
  domain: string;
  service: string;
  data?: Record<string, unknown>;
  target?: unknown;
}

/** A recorded DOM/HASS event fired via `fireEvent`. */
export interface FiredEvent {
  type: string;
  detail: unknown;
}

export interface TestHass extends HomeAssistant {
  __calls: ServiceCall[];
}

/**
 * Build a minimal fake `hass` whose `callService` records its arguments.
 * @param states the entity states map
 * @param overrides extra fields to merge onto the hass object
 */
export function makeHass(
  states: Record<string, any> = {},
  overrides: Partial<HomeAssistant> = {}
): TestHass {
  const calls: ServiceCall[] = [];
  const hass = {
    states,
    config: { unit_system: { temperature: '°C' } },
    themes: {},
    language: 'en',
    localize: (k: string) => k,
    callService: (domain: string, service: string, data?: any, target?: any) => {
      calls.push({ domain, service, data, target });
      return Promise.resolve();
    },
    // Default: no history. Tests that exercise the comfort feature override this.
    callWS: () => Promise.resolve({}),
    __calls: calls,
  } as unknown as TestHass;
  return Object.assign(hass, overrides) as TestHass;
}

/**
 * Build a climate entity state object.
 * @param attributes attribute overrides
 * @param state the entity state (hvac mode)
 */
export function climateState(attributes: Record<string, any> = {}, state = 'cool') {
  return {
    entity_id: 'climate.test',
    state,
    attributes: {
      friendly_name: 'Test AC',
      hvac_modes: ['off', 'cool', 'heat', 'heat_cool', 'auto', 'dry', 'fan_only'],
      fan_modes: ['auto', 'low', 'medium', 'high'],
      swing_modes: ['off', 'vertical', 'horizontal', 'both'],
      fan_mode: 'low',
      swing_mode: 'vertical',
      hvac_action: 'cooling',
      current_temperature: 24,
      temperature: 21,
      min_temp: 16,
      max_temp: 30,
      target_temp_step: 0.5,
      ...attributes,
    },
  };
}

/**
 * Build a generic entity state object.
 * @param entity_id the entity id (its domain drives behavior)
 * @param state the state string
 * @param attributes attribute overrides
 */
export function entityState(entity_id: string, state = 'on', attributes: Record<string, any> = {}) {
  return { entity_id, state, attributes: { ...attributes } };
}

/**
 * Wait for the next custom event of `type` dispatched from `el`.
 * @param el the element to listen on
 * @param type the event name
 */
export function oncePromise<T = any>(el: EventTarget, type: string): Promise<CustomEvent<T>> {
  return new Promise((resolve) => {
    el.addEventListener(type, (e) => resolve(e as CustomEvent<T>), { once: true });
  });
}

/**
 * Capture every `fireEvent`/CustomEvent of `type` bubbling to `document`.
 * Returns the captured list plus a stop() to remove the listener.
 * @param type the event name
 */
export function captureEvents(type: string): { events: FiredEvent[]; stop: () => void } {
  const events: FiredEvent[] = [];
  const handler = (e: Event): void => {
    events.push({ type: e.type, detail: (e as CustomEvent).detail });
  };
  document.addEventListener(type, handler);
  return { events, stop: () => document.removeEventListener(type, handler) };
}
