import { fixture, html, expect } from '@open-wc/testing';
import { makeHass, entityState } from '../helpers';
import '../../src/editors/entity-picker';
import type { MtEntityPicker } from '../../src/editors/entity-picker';

const STATES = {
  'sensor.temp': entityState('sensor.temp', '21', {
    friendly_name: 'Temperature',
    icon: 'mdi:thermometer',
  }),
  'sensor.humid': entityState('sensor.humid', '40', { friendly_name: 'Humidity' }),
  'light.lamp': entityState('light.lamp', 'on', { friendly_name: 'Lamp' }),
  'weird.thing': entityState('weird.thing', 'x', { friendly_name: 'Weird' }),
};

/**
 * Mount the entity picker.
 * @param opts value / includeDomains / allowCustom overrides
 */
async function mount(
  opts: { value?: string; includeDomains?: string[]; allowCustom?: boolean } = {}
): Promise<MtEntityPicker> {
  const el = await fixture<MtEntityPicker>(
    html`<mt-entity-picker
      .hass=${makeHass(STATES)}
      .value=${opts.value ?? ''}
      .includeDomains=${opts.includeDomains}
      .allowCustom=${opts.allowCustom ?? false}
    ></mt-entity-picker>`
  );
  await el.updateComplete;
  return el;
}

const trigger = (el: MtEntityPicker) => el.shadowRoot!.querySelector('.trigger') as HTMLElement;
const panel = (el: MtEntityPicker) => el.shadowRoot!.querySelector('.panel');
const optButtons = (el: MtEntityPicker) =>
  [...el.shadowRoot!.querySelectorAll('.opt')] as HTMLButtonElement[];
const search = (el: MtEntityPicker) => el.shadowRoot!.querySelector('.search') as HTMLInputElement;

/** Open the dropdown. */
async function open(el: MtEntityPicker): Promise<void> {
  trigger(el).click();
  await el.updateComplete;
}

/** Type into the search box. */
async function type(el: MtEntityPicker, value: string): Promise<void> {
  const s = search(el);
  s.value = value;
  s.dispatchEvent(new Event('input'));
  await el.updateComplete;
}

/** Resolve with the next value-changed detail.value. */
function onChange(el: MtEntityPicker): Promise<string> {
  return new Promise((res) =>
    el.addEventListener('value-changed', (e) => res((e as CustomEvent).detail.value), {
      once: true,
    })
  );
}

describe('mt-entity-picker', () => {
  it('renders a closed trigger showing the placeholder label when no value', async () => {
    const el = await mount({ value: '' });
    expect(trigger(el)).to.not.equal(null);
    expect(panel(el)).to.equal(null);
    expect(el.shadowRoot!.querySelector('.text.muted')!.textContent!.trim()).to.equal('Entity');
  });

  it('shows the selected entity name + its own icon in the trigger', async () => {
    const el = await mount({ value: 'sensor.temp' });
    expect(el.shadowRoot!.querySelector('.text')!.textContent!.trim()).to.equal('Temperature');
    expect(el.shadowRoot!.querySelector('.lead')!.getAttribute('icon')).to.equal('mdi:thermometer');
  });

  it('falls back to a domain icon for a selected entity without its own icon', async () => {
    const el = await mount({ value: 'light.lamp' });
    expect(el.shadowRoot!.querySelector('.lead')!.getAttribute('icon')).to.equal('mdi:lightbulb');
  });

  it('shows the raw id (and a default icon) for an unknown selected entity', async () => {
    const el = await mount({ value: 'nonexistent.thing' });
    expect(el.shadowRoot!.querySelector('.text')!.textContent!.trim()).to.equal('nonexistent.thing');
    expect(el.shadowRoot!.querySelector('.lead')!.getAttribute('icon')).to.equal('mdi:tag');
  });

  it('opens on click, focuses the search box, and lists all entities sorted by name', async () => {
    const el = await mount();
    await open(el);
    expect(panel(el)).to.not.equal(null);
    expect(el.shadowRoot!.activeElement).to.equal(search(el));
    const names = optButtons(el).map((b) => b.querySelector('.opt-name')!.textContent);
    expect(names).to.deep.equal(['Humidity', 'Lamp', 'Temperature', 'Weird']);
  });

  it('restricts candidates to includeDomains', async () => {
    const el = await mount({ includeDomains: ['sensor'] });
    await open(el);
    const names = optButtons(el).map((b) => b.querySelector('.opt-name')!.textContent);
    expect(names).to.deep.equal(['Humidity', 'Temperature']);
  });

  it('uses domain/default icons for rows without their own icon', async () => {
    const el = await mount();
    await open(el);
    const iconFor = (name: string) =>
      optButtons(el)
        .find((b) => b.querySelector('.opt-name')!.textContent === name)!
        .querySelector('ha-icon')!
        .getAttribute('icon');
    expect(iconFor('Humidity')).to.equal('mdi:gauge'); // domain default
    expect(iconFor('Weird')).to.equal('mdi:tag'); // unknown-domain fallback
    expect(iconFor('Temperature')).to.equal('mdi:thermometer'); // its own
  });

  it('filters by name and by entity id as you type', async () => {
    const el = await mount();
    await open(el);
    await type(el, 'humid');
    expect(optButtons(el).map((b) => b.querySelector('.opt-name')!.textContent)).to.deep.equal([
      'Humidity',
    ]);
    await type(el, 'light.');
    expect(optButtons(el).map((b) => b.querySelector('.opt-name')!.textContent)).to.deep.equal([
      'Lamp',
    ]);
  });

  it('emits value-changed and closes when a result is picked', async () => {
    const el = await mount();
    await open(el);
    const p = onChange(el);
    optButtons(el)
      .find((b) => b.querySelector('.opt-name')!.textContent === 'Lamp')!
      .click();
    expect(await p).to.equal('light.lamp');
    await el.updateComplete;
    expect(panel(el)).to.equal(null);
  });

  it('marks the current value as the active option', async () => {
    const el = await mount({ value: 'sensor.temp' });
    await open(el);
    const active = el.shadowRoot!.querySelector('.opt.active')!;
    expect(active.querySelector('.opt-name')!.textContent).to.equal('Temperature');
  });

  it('handles a missing hass with no candidates', async () => {
    const el = await mount();
    (el as unknown as { hass: unknown }).hass = undefined;
    await el.updateComplete;
    expect((el as unknown as { _entities(): unknown[] })._entities()).to.deep.equal([]);
  });

  it('clicking the trigger again closes the dropdown', async () => {
    const el = await mount();
    await open(el);
    trigger(el).click();
    await el.updateComplete;
    expect(panel(el)).to.equal(null);
  });

  describe('empty + custom values', () => {
    it('shows "No matching entities" when nothing matches and custom is off', async () => {
      const el = await mount();
      await open(el);
      await type(el, 'zzzzz');
      expect(optButtons(el).length).to.equal(0);
      expect(el.shadowRoot!.querySelector('.empty')).to.not.equal(null);
    });

    it('offers a "Use …" row for a custom value and commits it on click', async () => {
      const el = await mount({ allowCustom: true });
      await open(el);
      await type(el, 'sensor.custom');
      const custom = el.shadowRoot!.querySelector('.opt.custom') as HTMLButtonElement;
      expect(custom).to.not.equal(null);
      const p = onChange(el);
      custom.click();
      expect(await p).to.equal('sensor.custom');
    });

    it('does not offer a custom row when the query exactly matches an entity id', async () => {
      const el = await mount({ allowCustom: true });
      await open(el);
      await type(el, 'sensor.temp');
      expect(el.shadowRoot!.querySelector('.opt.custom')).to.equal(null);
    });
  });

  describe('keyboard', () => {
    it('Escape closes the dropdown', async () => {
      const el = await mount();
      await open(el);
      search(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(panel(el)).to.equal(null);
    });

    it('Enter commits the typed value when custom is allowed', async () => {
      const el = await mount({ allowCustom: true });
      await open(el);
      await type(el, 'sensor.x');
      const p = onChange(el);
      search(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(await p).to.equal('sensor.x');
    });

    it('Enter does nothing when custom is not allowed', async () => {
      const el = await mount();
      await open(el);
      await type(el, 'sensor.x');
      let fired = false;
      el.addEventListener('value-changed', () => (fired = true));
      search(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise((r) => setTimeout(r, 10));
      expect(fired).to.be.false;
      expect(panel(el)).to.not.equal(null);
    });

    it('Enter with an empty query does nothing even when custom is allowed', async () => {
      const el = await mount({ allowCustom: true });
      await open(el);
      let fired = false;
      el.addEventListener('value-changed', () => (fired = true));
      search(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise((r) => setTimeout(r, 10));
      expect(fired).to.be.false;
    });

    it('other keys are ignored', async () => {
      const el = await mount();
      await open(el);
      search(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      await el.updateComplete;
      expect(panel(el)).to.not.equal(null);
    });
  });

  describe('outside-click', () => {
    it('a document click outside closes the dropdown', async () => {
      const el = await mount();
      await open(el);
      document.body.click();
      await el.updateComplete;
      expect(panel(el)).to.equal(null);
    });

    it('a click inside keeps it open', async () => {
      const el = await mount();
      await open(el);
      search(el).click();
      await el.updateComplete;
      expect(panel(el)).to.not.equal(null);
    });

    it('a document click while closed is a no-op', async () => {
      const el = await mount();
      document.body.click();
      await el.updateComplete;
      expect(panel(el)).to.equal(null);
    });
  });
});
