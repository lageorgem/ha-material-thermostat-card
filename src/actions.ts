import { type ActionConfig, type HomeAssistant, fireEvent } from 'custom-card-helpers';

/**
 * The natural "primary" interaction for an entity when no explicit action is
 * configured: press for buttons/scenes/scripts, toggle for switchable domains,
 * otherwise open more-info.
 * @param node the element to fire DOM events from
 * @param hass the Home Assistant connection
 * @param entity the entity id
 */
export function pressOrToggle(node: HTMLElement, hass: HomeAssistant, entity: string): void {
  const domain = entity.split('.')[0];
  switch (domain) {
    case 'button':
      hass.callService('button', 'press', { entity_id: entity });
      break;
    case 'input_button':
      hass.callService('input_button', 'press', { entity_id: entity });
      break;
    case 'scene':
      hass.callService('scene', 'turn_on', { entity_id: entity });
      break;
    case 'script':
      hass.callService('script', 'turn_on', { entity_id: entity });
      break;
    case 'switch':
    case 'light':
    case 'fan':
    case 'input_boolean':
      hass.callService('homeassistant', 'toggle', { entity_id: entity });
      break;
    default:
      fireEvent(node, 'hass-more-info', { entityId: entity });
  }
}

/**
 * Execute a tap action for an entity tile, honoring an explicit `tap_action`
 * config and falling back to {@link pressOrToggle} for the default action.
 * @param node the element to fire DOM events from
 * @param hass the Home Assistant connection
 * @param entity the entity id
 * @param action the optional action config
 */
export function performTap(
  node: HTMLElement,
  hass: HomeAssistant,
  entity: string,
  action?: ActionConfig
): void {
  const cfg = (action ?? { action: 'default' }) as any;
  switch (cfg.action) {
    case 'none':
      return;
    case 'more-info':
      fireEvent(node, 'hass-more-info', { entityId: cfg.entity ?? entity });
      return;
    case 'toggle':
      hass.callService('homeassistant', 'toggle', { entity_id: entity });
      return;
    case 'url':
      if (cfg.url_path) window.open(cfg.url_path);
      return;
    case 'navigate':
      if (cfg.navigation_path) {
        window.history.pushState(null, '', cfg.navigation_path);
        fireEvent(node, 'location-changed', { replace: false });
      }
      return;
    case 'call-service':
    case 'perform-action': {
      const svc = cfg.perform_action ?? cfg.service;
      if (!svc || !svc.includes('.')) return;
      const [domain, service] = svc.split('.');
      hass.callService(domain, service, cfg.data ?? cfg.service_data ?? {}, cfg.target);
      return;
    }
    default:
      pressOrToggle(node, hass, entity);
  }
}
