let _promise: Promise<void> | undefined;

/**
 * Ensure Home Assistant's form components (`ha-form`, `ha-entity-picker`,
 * `ha-icon-picker`, action selectors, …) are registered. In a custom card
 * editor these are sometimes not loaded yet, leaving pickers and selects
 * inert. We trigger HA's own loaders by asking the built-in entities card for
 * its config element, which pulls the whole form stack in. Idempotent.
 */
export function ensureHaComponents(): Promise<void> {
  if (_promise) return _promise;
  _promise = (async () => {
    if (
      customElements.get('ha-form') &&
      customElements.get('ha-entity-picker') &&
      customElements.get('ha-icon-picker')
    ) {
      return;
    }
    const loader = (window as any).loadCardHelpers;
    if (!loader) return;
    try {
      const helpers = await loader();
      const card = await helpers.createCardElement({ type: 'entities', entities: [] });
      const ctor = card?.constructor as any;
      if (ctor?.getConfigElement) await ctor.getConfigElement();
    } catch {
      // Best-effort: if HA internals change we simply fall back to whatever
      // components are already registered.
    }
  })();
  return _promise;
}
