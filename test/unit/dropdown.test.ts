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
  describe('explicit no-icon overrides', () => {
    for (const variant of ['pill', 'tile'] as const) {
      it(`omits ${variant} glyphs for empty icons without removing text or selection controls`, async () => {
        const el = await fixture<MtDropdown>(
          html`<mt-dropdown
            variant=${variant}
            label="Mode"
            .items=${[
              { value: 'a', label: 'Alpha', icon: '', active: true },
              { value: 'b', label: 'Beta', icon: '' },
            ]}
          ></mt-dropdown>`
        );
        const button = el.shadowRoot!.querySelector<HTMLButtonElement>('button')!;
        expect(button.querySelector('.lead, .dot, .ic')).to.equal(null);
        if (variant === 'pill') {
          expect(button.querySelector('.label')!.textContent).to.equal('Alpha');
          expect(button.querySelector('.chev')!.getAttribute('icon')).to.equal('mdi:chevron-down');
          expect(button.querySelectorAll('ha-icon')).to.have.lengthOf(1);
        } else {
          expect(button.querySelector('.title')!.textContent).to.equal('Mode');
          expect(button.querySelector('.value')!.textContent).to.equal('Alpha');
          expect(button.querySelector('ha-icon')).to.equal(null);
        }

        button.click();
        await el.updateComplete;
        expect(button.getAttribute('aria-expanded')).to.equal('true');
        const options = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.opt');
        expect(options).to.have.lengthOf(2);
        expect(
          Array.from(options, (option) => option.querySelector('.label')!.textContent)
        ).to.deep.equal(['Alpha', 'Beta']);
        for (const option of options) {
          expect(option.querySelector('.dot, ha-icon:not(.check)')).to.equal(null);
        }
        expect(options[0].getAttribute('aria-selected')).to.equal('true');
        expect(options[0].querySelector('.check')!.getAttribute('icon')).to.equal('mdi:check');
        expect(options[1].getAttribute('aria-selected')).to.equal('false');
        expect(options[1].querySelector('.check')).to.equal(null);

        const selected = oncePromise(el, 'item-selected');
        options[1].click();
        expect((await selected).detail).to.deep.equal({ value: 'b' });
        await el.updateComplete;
        expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
        expect(button.getAttribute('aria-expanded')).to.equal('false');
      });

      it(`updates the ${variant} trigger and open menu from custom icon to empty icon to default dot`, async () => {
        const el = await fixture<MtDropdown>(
          html`<mt-dropdown
            variant=${variant}
            label="Mode"
            .items=${[{ value: 'a', label: 'Alpha', icon: 'mdi:star', active: true }]}
          ></mt-dropdown>`
        );
        const button = el.shadowRoot!.querySelector<HTMLButtonElement>('button')!;
        button.click();
        await el.updateComplete;

        for (const icon of ['mdi:star', '', undefined]) {
          el.items = [{ value: 'a', label: 'Alpha', icon, active: true }];
          await el.updateComplete;
          const option = el.shadowRoot!.querySelector('.opt')!;
          expect(button.querySelectorAll('ha-icon[icon="mdi:star"]')).to.have.lengthOf(
            icon === 'mdi:star' ? 1 : 0
          );
          expect(option.querySelectorAll('ha-icon:not(.check)')).to.have.lengthOf(
            icon === 'mdi:star' ? 1 : 0
          );
          if (icon === 'mdi:star') {
            expect(option.querySelector('ha-icon:not(.check)')!.getAttribute('icon')).to.equal(
              icon
            );
          }
          expect(button.querySelectorAll('.dot')).to.have.lengthOf(icon === undefined ? 1 : 0);
          expect(option.querySelectorAll('.dot')).to.have.lengthOf(icon === undefined ? 1 : 0);
          expect(
            button.querySelector(variant === 'pill' ? '.label' : '.value')!.textContent
          ).to.equal('Alpha');
          expect(option.querySelector('.label')!.textContent).to.equal('Alpha');
          expect(option.querySelector('.check')!.getAttribute('icon')).to.equal('mdi:check');
          if (variant === 'tile') {
            expect(button.querySelectorAll('.ic')).to.have.lengthOf(icon === '' ? 0 : 1);
            expect(button.classList.contains('no-icon')).to.equal(icon === '');
            expect(getComputedStyle(button.querySelector('.text')!).textAlign).to.equal(
              icon === '' ? 'center' : 'left'
            );
            expect(button.querySelector('.title')!.textContent).to.equal('Mode');
          } else {
            expect(button.querySelector('.chev')!.getAttribute('icon')).to.equal(
              'mdi:chevron-down'
            );
          }
        }

        // An empty override on an inactive item must not suppress the neutral icon.
        el.items = [{ value: 'a', label: 'Alpha', icon: '' }];
        await el.updateComplete;
        expect(button.querySelector('ha-icon[icon="mdi:tune-variant"]')).not.to.equal(null);
        expect(button.querySelector('.dot')).to.equal(null);
        expect(
          button.querySelector(variant === 'pill' ? '.label' : '.value')!.textContent
        ).to.equal('—');
        expect(el.shadowRoot!.querySelector('.check')).to.equal(null);
      });
    }
  });

  describe('menu layout', () => {
    async function openMenu(variant: 'pill' | 'tile', right: boolean, width = 300,
      options = items): Promise<MtDropdown> {
      const el = await fixture<MtDropdown>(html`<mt-dropdown
        variant=${variant} label="Mode" .items=${options}
        style=${`position: fixed; top: 16px; ${right ? 'right' : 'left'}: 16px; width: ${width}px; font: 16px Arial;`}
      ></mt-dropdown>`);
      // HA icons are not registered in unit tests; reproduce their real box size.
      const iconStyle = document.createElement('style');
      iconStyle.textContent = 'ha-icon { display: inline-block; width: var(--mdc-icon-size); height: var(--mdc-icon-size); flex-shrink: 0; }';
      el.shadowRoot!.append(iconStyle);
      el.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
      await el.updateComplete;
      return el;
    }

    function expectConcentric(menu: HTMLElement, active: HTMLElement): void {
      const menuStyle = getComputedStyle(menu);
      const itemRadius = Math.min(
        parseFloat(getComputedStyle(active).borderTopLeftRadius), active.offsetHeight / 2
      );
      expect(itemRadius).to.be.closeTo(active.offsetHeight / 2, 0.5);
      expect(parseFloat(menuStyle.borderTopLeftRadius)).to.equal(
        parseFloat(menuStyle.getPropertyValue('--mt-menu-item-height')) / 2 + parseFloat(menuStyle.paddingLeft)
      );
      expect(active.offsetHeight).to.be.within(42, 44);
    }

    for (const variant of ['pill', 'tile'] as const) {
      for (const right of [false, true]) {
        it(`matches the ${variant} trigger width with ${right ? 'right' : 'left'} anchoring and concentric corners`, async () => {
          const el = await openMenu(variant, right);
          const button = el.shadowRoot!.querySelector('button')!;
          const menu = el.shadowRoot!.querySelector<HTMLElement>('.menu')!;
          const bounds = menu.getBoundingClientRect();
          const triggerBounds = button.getBoundingClientRect();
          expect(triggerBounds.width).to.equal(300);
          expect(bounds.width).to.be.closeTo(triggerBounds.width, 0.5);
          expect(menu.classList.contains('right')).to.equal(right);
          expect(right ? bounds.right : bounds.left).to.be.closeTo(
            right ? triggerBounds.right : triggerBounds.left, 0.5
          );
          expectConcentric(menu, menu.querySelector<HTMLElement>('.opt.active')!);
        });

        it(`grows a ${variant} menu for long labels within the viewport cap (${right ? 'right' : 'left'})`, async () => {
          const el = await openMenu(variant, right, 150, [
            { value: 'long', label: 'W'.repeat(60), active: true, icon: 'mdi:fire' },
          ]);
          const menu = el.shadowRoot!.querySelector<HTMLElement>('.menu')!;
          expect(menu.getBoundingClientRect().width).to.be.greaterThan(150);
          expect(menu.getBoundingClientRect().width).to.be.at.most(Math.min(360, 0.85 * window.innerWidth));
        });
      }
    }

    it('preserves pill rows when enlarged text makes them taller than the minimum', async () => {
      const el = await openMenu('pill', false);
      el.style.fontSize = '32px';
      el.style.lineHeight = '38px';
      const active = el.shadowRoot!.querySelector<HTMLElement>('.opt.active')!;
      const radius = getComputedStyle(active).borderTopLeftRadius;
      expect(radius).to.match(/^\d+(\.\d+)?px$/);
      expect(active.offsetHeight).to.be.greaterThan(44);
      expect(Math.min(parseFloat(radius), active.offsetHeight / 2)).to.be.closeTo(
        active.offsetHeight / 2, 0.5
      );
    });

    it('preserves pill rows and concentric corners in a scrolled menu', async () => {
      const el = await openMenu('tile', false, 300, Array.from({ length: 12 }, (_, i) => ({
        value: String(i), label: `Option ${i}`, icon: 'mdi:fire', active: i === 11,
      })));
      const menu = el.shadowRoot!.querySelector<HTMLElement>('.menu')!;
      expect(menu.offsetHeight).to.equal(280);
      expect(menu.scrollHeight).to.be.greaterThan(menu.clientHeight);
      menu.scrollTop = menu.scrollHeight;
      expect(menu.scrollTop).to.be.greaterThan(0);
      const active = menu.querySelector<HTMLElement>('.opt.active')!;
      expectConcentric(menu, active);
      expect(active.getBoundingClientRect().bottom).to.be.at.most(menu.getBoundingClientRect().bottom);
    });
  });

  it('never selects disabled menu items, including synthetic clicks', async () => {
    const el = await fixture<MtDropdown>(html`<mt-dropdown .items=${[{ value: 'a', label: 'A' }, { value: 'b', label: 'B', disabled: true }]}></mt-dropdown>`);
    let emitted = 0;
    el.addEventListener('item-selected', () => emitted++);
    trigger(el).click();
    await el.updateComplete;
    const option = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.opt')[1];
    expect(option.disabled).to.be.true;
    expect(option.getAttribute('aria-disabled')).to.equal('true');
    option.focus();
    expect(el.shadowRoot!.activeElement).not.to.equal(option);
    option.dispatchEvent(new MouseEvent('click'));
    expect(emitted).to.equal(0);
  });

  for (const variant of ['pill', 'tile']) {
    it(`does not open a disabled ${variant}`, async () => {
      const el = await fixture<MtDropdown>(html`<mt-dropdown variant=${variant} .items=${[{ value: 'a', label: 'A', disabled: true }]}></mt-dropdown>`);
      const button = el.shadowRoot!.querySelector('button')!;
      expect(button.disabled).to.be.true;
      button.dispatchEvent(new MouseEvent('click'));
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
    });
  }
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

    it('shows a neutral empty selection when no item is active', async () => {
      const noActive: SelectorItem[] = [
        { value: 'a', label: 'Alpha', icon: 'mdi:a', color: '#ff8100' },
        { value: 'b', label: 'Beta', icon: 'mdi:b' },
      ];
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${noActive}></mt-dropdown>`
      );
      expect(el.shadowRoot!.querySelector('.trigger .dot')).to.equal(null);
      expect(el.shadowRoot!.querySelector('.trigger .lead')!.getAttribute('icon')).to.equal('mdi:tune-variant');
      expect(el.shadowRoot!.querySelector('.trigger .label')!.textContent).to.equal('—');
      expect(trigger(el).textContent).not.to.contain('Alpha');
      expect(trigger(el).getAttribute('style') ?? '').not.to.contain('--mt-tile-accent');
      trigger(el).click();
      await el.updateComplete;
      expect(el.shadowRoot!.querySelectorAll('.opt').length).to.equal(2);
      expect(el.shadowRoot!.querySelector('.opt.active, .opt[aria-selected="true"], .check')).to.equal(null);
      const listener = oncePromise(el, 'item-selected');
      el.shadowRoot!.querySelector<HTMLButtonElement>('.opt')!.click();
      expect((await listener).detail).to.deep.equal({ value: 'a' });
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.menu')).to.equal(null);
    });

    it('shows an em dash and generic icon when there are no items', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown .items=${[]} placeholder="Choose"></mt-dropdown>`
      );
      expect(el.shadowRoot!.querySelector('.trigger .dot')).to.equal(null);
      expect(el.shadowRoot!.querySelector('.trigger .lead')!.getAttribute('icon')).to.equal('mdi:tune-variant');
      expect(el.shadowRoot!.querySelector('.trigger .label')!.textContent).to.equal('—');
    });

    it('keeps the dot for an active item without an icon', async () => {
      const el = await fixture<MtDropdown>(html`<mt-dropdown .items=${[{ value: 'b', label: 'Beta', active: true }]}></mt-dropdown>`);
      expect(el.shadowRoot!.querySelector('.trigger .dot')).not.to.equal(null);
      expect(el.shadowRoot!.querySelector('.trigger .label')!.textContent).to.equal('Beta');
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

    it('shows a neutral empty selection when nothing is active', async () => {
      const noActive: SelectorItem[] = [
        { value: 'a', label: 'Alpha', icon: 'mdi:a', color: '#ff8100' },
        { value: 'b', label: 'Beta', icon: 'mdi:b' },
      ];
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown variant="tile" .items=${noActive} label="Mode"></mt-dropdown>`
      );
      expect(tile(el).classList.contains('on')).to.be.false;
      expect(tile(el).querySelector('.title')!.textContent).to.equal('Mode');
      expect(tile(el).querySelector('.value')!.textContent).to.equal('—');
      expect(tile(el).querySelector('.ic ha-icon')!.getAttribute('icon')).to.equal('mdi:tune-variant');
      expect(tile(el).getAttribute('style') ?? '').not.to.contain('--mt-tile-accent');
      tile(el).click();
      await el.updateComplete;
      expect(el.shadowRoot!.querySelectorAll('.opt').length).to.equal(2);
      expect(el.shadowRoot!.querySelector('.opt.active, .opt[aria-selected="true"], .check')).to.equal(null);
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

    it('shows an em dash as the value when there are no items', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown variant="tile" .items=${[]} placeholder="Pick"></mt-dropdown>`
      );
      expect(tile(el).querySelector('.value')!.textContent).to.equal('—');
      expect(tile(el).classList.contains('on')).to.be.false;
    });

    it('tints the tile with the active item color via --mt-tile-accent', async () => {
      const colored: SelectorItem[] = [
        { value: 'heat', label: 'Heat', icon: 'mdi:fire', active: true, color: '#ff8100' },
        { value: 'off', label: 'Off' },
      ];
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown variant="tile" .items=${colored} label="Mode"></mt-dropdown>`
      );
      expect(tile(el).getAttribute('style') ?? '').to.contain('--mt-tile-accent: #ff8100');
    });

    it('sets no --mt-tile-accent when the active item has no color', async () => {
      const el = await fixture<MtDropdown>(
        html`<mt-dropdown variant="tile" .items=${items} label="Mode"></mt-dropdown>`
      );
      expect(tile(el).getAttribute('style') ?? '').to.not.contain('--mt-tile-accent');
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
