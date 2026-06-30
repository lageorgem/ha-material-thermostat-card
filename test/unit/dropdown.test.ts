import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { oncePromise, captureEvents } from '../helpers';
import '../../src/features/dropdown';
import type { MtDropdown } from '../../src/features/dropdown';
import type { SelectorItem } from '../../src/types';

const items: SelectorItem[] = [
  { value: 'a', label: 'Alpha', icon: 'mdi:a', active: true },
  { value: 'b', label: 'Beta' }, // no icon -> dot
  { value: 'c', label: 'Gamma', icon: 'mdi:c' },
];

/**
 * Get the trigger button of a mounted dropdown.
 * @param el the dropdown element
 */
function trigger(el: MtDropdown): HTMLButtonElement {
  return el.shadowRoot!.querySelector('.trigger') as HTMLButtonElement;
}

describe('mt-dropdown', () => {
  describe('trigger / _active', () => {
    it('shows the active item icon + label', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${items}></mt-dropdown>`
      );
      const lead = el.shadowRoot!.querySelector('.trigger .lead');
      expect(lead).to.not.equal(null);
      expect(lead!.getAttribute('icon')).to.equal('mdi:a');
      expect(el.shadowRoot!.querySelector('.trigger .label')!.textContent).to.equal('Alpha');
      // chevron always present
      expect(el.shadowRoot!.querySelector('.trigger .chev')).to.not.equal(null);
    });

    it('falls back to items[0] when no item is active', async () => {
      const noActive: SelectorItem[] = [
        { value: 'a', label: 'Alpha' }, // no icon -> dot
        { value: 'b', label: 'Beta', icon: 'mdi:b' },
      ];
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${noActive}></mt-dropdown>`
      );
      // first item has no icon -> dot in the trigger
      expect(el.shadowRoot!.querySelector('.trigger .dot')).to.not.equal(null);
      expect(el.shadowRoot!.querySelector('.trigger .lead')).to.equal(null);
      expect(el.shadowRoot!.querySelector('.trigger .label')!.textContent).to.equal('Alpha');
    });

    it('shows placeholder + dot when there are no items', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${[]} placeholder="Choose"></mt-dropdown>`
      );
      expect(el.shadowRoot!.querySelector('.trigger .dot')).to.not.equal(null);
      expect(el.shadowRoot!.querySelector('.trigger .lead')).to.equal(null);
      expect(el.shadowRoot!.querySelector('.trigger .label')!.textContent).to.equal('Choose');
    });
  });

  describe('open / close via trigger', () => {
    it('opens the menu and sets aria-expanded; closes on second click', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${items}></mt-dropdown>`
      );
      expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
      expect(trigger(el).getAttribute('aria-expanded')).to.equal('false');

      trigger(el).click();
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.menu')).to.not.equal(null);
      expect(trigger(el).getAttribute('aria-expanded')).to.equal('true');
      expect(trigger(el).classList.contains('open')).to.be.true;

      trigger(el).click();
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
      expect(trigger(el).getAttribute('aria-expanded')).to.equal('false');
    });

    it('dispatches document-level mt-dropdown-open with detail = element when opening', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${items}></mt-dropdown>`
      );
      const cap = captureEvents('mt-dropdown-open');
      trigger(el).click();
      await el.updateComplete;
      expect(cap.events.length).to.equal(1);
      expect(cap.events[0].detail).to.equal(el);
      cap.stop();
    });

    it('does not dispatch mt-dropdown-open when closing', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${items}></mt-dropdown>`
      );
      trigger(el).click();
      await el.updateComplete;
      const cap = captureEvents('mt-dropdown-open');
      trigger(el).click(); // close
      await el.updateComplete;
      expect(cap.events.length).to.equal(0);
      cap.stop();
    });
  });

  describe('menu rendering', () => {
    it('renders one option per item with correct decorations', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${items}></mt-dropdown>`
      );
      trigger(el).click();
      await el.updateComplete;
      const opts = el.shadowRoot!.querySelectorAll('.opt');
      expect(opts.length).to.equal(3);

      // active option (a) -> .active class + a .check ha-icon
      expect(opts[0].classList.contains('active')).to.be.true;
      expect(opts[0].getAttribute('aria-selected')).to.equal('true');
      expect(opts[0].querySelector('.check')).to.not.equal(null);
      // leading icon ha-icon present for an item with an icon
      expect(opts[0].querySelector('ha-icon[icon="mdi:a"]')).to.not.equal(null);

      // option b -> no icon, so a .dot; not active so no .check
      expect(opts[1].classList.contains('active')).to.be.false;
      expect(opts[1].getAttribute('aria-selected')).to.equal('false');
      expect(opts[1].querySelector('.dot')).to.not.equal(null);
      expect(opts[1].querySelector('.check')).to.equal(null);

      // option c -> has icon, not active
      expect(opts[2].querySelector('ha-icon[icon="mdi:c"]')).to.not.equal(null);
      expect(opts[2].querySelector('.check')).to.equal(null);
    });
  });

  describe('selecting an option', () => {
    it('dispatches item-selected {value} and closes the menu', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${items}></mt-dropdown>`
      );
      trigger(el).click();
      await el.updateComplete;
      const opts = el.shadowRoot!.querySelectorAll('.opt');

      const listener = oncePromise(el, 'item-selected');
      (opts[2] as HTMLButtonElement).click();
      const ev = await listener;
      expect(ev.detail).to.deep.equal({ value: 'c' });

      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
    });

    it('item-selected does not bubble (non-bubbling)', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${items}></mt-dropdown>`
      );
      trigger(el).click();
      await el.updateComplete;
      const opts = el.shadowRoot!.querySelectorAll('.opt');
      setTimeout(() => (opts[0] as HTMLButtonElement).click());
      const ev = await oneEvent(el, 'item-selected');
      expect(ev.bubbles).to.be.false;
    });
  });

  describe('_onDocClick (outside-click handler)', () => {
    // The outside-click → close path is covered by the real-event test below
    // ('closes on a real document click outside'), which also exercises the
    // connectedCallback listener wiring; the stubbed-composedPath cases here cover
    // only the branches a real event can't easily reach (inside / not-open).
    it('stays open when a document click is inside the element', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${items}></mt-dropdown>`
      );
      trigger(el).click();
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.menu')).to.not.equal(null);

      (el as any)._onDocClick({ composedPath: () => [el] });
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.menu')).to.not.equal(null);
    });

    it('does nothing when not open', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${items}></mt-dropdown>`
      );
      // not open; an outside click must not throw / open it
      (el as any)._onDocClick({ composedPath: () => [document.body] });
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
    });

    it('closes on a real document click outside the element', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${items}></mt-dropdown>`
      );
      trigger(el).click();
      await el.updateComplete;
      // a real click on the body dispatches a bubbling click whose composedPath
      // does not include the dropdown
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
    });
  });

  describe('_onOtherOpen', () => {
    it('closes when another dropdown opens (detail is a different object)', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${items}></mt-dropdown>`
      );
      trigger(el).click();
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.menu')).to.not.equal(null);

      document.dispatchEvent(new CustomEvent('mt-dropdown-open', { detail: {} }));
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
    });

    it('stays open when the event detail is itself', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${items}></mt-dropdown>`
      );
      trigger(el).click();
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.menu')).to.not.equal(null);

      document.dispatchEvent(new CustomEvent('mt-dropdown-open', { detail: el }));
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.menu')).to.not.equal(null);
    });
  });

  describe('tile variant', () => {
    /** Grab the tile trigger button of a tile-variant dropdown. */
    function tile(el: MtDropdown): HTMLButtonElement {
      return el.shadowRoot!.querySelector('.tile') as HTMLButtonElement;
    }

    it('renders a .tile trigger (not the pill .trigger) with title, value, and icon', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown variant="tile" .items=${items} label="Mode"></mt-dropdown>`
      );
      expect(el.shadowRoot!.querySelector('.trigger')).to.equal(null);
      const t = tile(el);
      expect(t).to.not.equal(null);
      expect(t.querySelector('.title')!.textContent).to.equal('Mode');
      // active item is 'a' (Alpha, mdi:a)
      expect(t.querySelector('.value')!.textContent).to.equal('Alpha');
      expect(t.querySelector('.ic ha-icon')!.getAttribute('icon')).to.equal('mdi:a');
    });

    it('marks the tile "on" when the active value is not off/none', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown variant="tile" .items=${items} label="Mode"></mt-dropdown>`
      );
      expect(tile(el).classList.contains('on')).to.be.true;
    });

    it('is not "on" when the active value is "off" (case-insensitive)', async () => {
      const offItems: SelectorItem[] = [
        { value: 'off', label: 'Off', icon: 'mdi:power', active: true },
        { value: 'heat', label: 'Heat', icon: 'mdi:fire' },
      ];
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown variant="tile" .items=${offItems} label="Mode"></mt-dropdown>`
      );
      expect(tile(el).classList.contains('on')).to.be.false;
      expect(tile(el).querySelector('.value')!.textContent).to.equal('Off');
    });

    it('is not "on" when the active value is "None" (uppercase)', async () => {
      const noneItems: SelectorItem[] = [
        { value: 'None', label: 'None', active: true },
        { value: 'eco', label: 'Eco', icon: 'mdi:leaf' },
      ];
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown variant="tile" .items=${noneItems} label="Preset"></mt-dropdown>`
      );
      expect(tile(el).classList.contains('on')).to.be.false;
    });

    it('is not "on" when forceOff is set, even with an active non-off value', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown variant="tile" .items=${items} label="Fan" .forceOff=${true}></mt-dropdown>`
      );
      // active item is 'a' (a non-off value) — but the parent is off
      expect(tile(el).classList.contains('on')).to.be.false;
    });

    it('is not "on" when nothing is active (uses items[0] for display)', async () => {
      const noActive: SelectorItem[] = [
        { value: 'a', label: 'Alpha', icon: 'mdi:a' },
        { value: 'b', label: 'Beta', icon: 'mdi:b' },
      ];
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown variant="tile" .items=${noActive} label="Mode"></mt-dropdown>`
      );
      expect(tile(el).classList.contains('on')).to.be.false;
      // still shows the first item as the displayed value
      expect(tile(el).querySelector('.value')!.textContent).to.equal('Alpha');
    });

    it('omits the title when no label is set, and shows a dot when the active item has no icon', async () => {
      const noIcon: SelectorItem[] = [{ value: 'plain', label: 'Plain', active: true }];
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown variant="tile" .items=${noIcon}></mt-dropdown>`
      );
      expect(tile(el).querySelector('.title')).to.equal(null);
      expect(tile(el).querySelector('.ic .dot')).to.not.equal(null);
      expect(tile(el).querySelector('.ic ha-icon')).to.equal(null);
      expect(tile(el).querySelector('.value')!.textContent).to.equal('Plain');
    });

    it('shows the placeholder as the value when there are no items', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown variant="tile" .items=${[]} placeholder="Pick"></mt-dropdown>`
      );
      expect(tile(el).querySelector('.value')!.textContent).to.equal('Pick');
      expect(tile(el).classList.contains('on')).to.be.false;
    });

    it('opens the shared menu on tap and selecting an option emits item-selected + closes', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown variant="tile" .items=${items} label="Mode"></mt-dropdown>`
      );
      expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
      tile(el).click();
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.menu')).to.not.equal(null);
      expect(tile(el).getAttribute('aria-expanded')).to.equal('true');
      expect(tile(el).classList.contains('open')).to.be.true;

      const opts = el.shadowRoot!.querySelectorAll('.opt');
      const listener = oncePromise(el, 'item-selected');
      (opts[2] as HTMLButtonElement).click();
      const ev = await listener;
      expect(ev.detail).to.deep.equal({ value: 'c' });
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
    });
  });

  describe('alignment branches', () => {
    it('aligns right + up when the trigger sits in the bottom-right region', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${items}></mt-dropdown>`
      );
      el.getBoundingClientRect = () =>
        ({
          left: window.innerWidth * 0.9,
          width: 10,
          right: window.innerWidth * 0.9 + 10,
          top: window.innerHeight * 0.9,
          bottom: window.innerHeight * 0.9,
          height: 10,
          x: window.innerWidth * 0.9,
          y: window.innerHeight * 0.9,
          toJSON: () => ({}),
        }) as DOMRect;
      trigger(el).click();
      await el.updateComplete;
      const menu = el.shadowRoot!.querySelector('.menu')!;
      expect(menu.classList.contains('right')).to.be.true;
      expect(menu.classList.contains('up')).to.be.true;
    });

    it('aligns left + down when the trigger sits in the top-left region', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${items}></mt-dropdown>`
      );
      el.getBoundingClientRect = () =>
        ({
          left: 0,
          width: 10,
          right: 10,
          top: 0,
          bottom: 0,
          height: 10,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;
      trigger(el).click();
      await el.updateComplete;
      const menu = el.shadowRoot!.querySelector('.menu')!;
      expect(menu.classList.contains('right')).to.be.false;
      expect(menu.classList.contains('up')).to.be.false;
    });
  });
});
