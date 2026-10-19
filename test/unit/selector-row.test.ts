import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { oncePromise } from '../helpers';
import '../../src/features/selector-row';
import type { MtSelectorRow } from '../../src/features/selector-row';
import type { SelectorItem } from '../../src/types';

describe('mt-selector-row', () => {
  describe('empty items', () => {
    it('renders nothing when there are no items', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${[]}></mt-selector-row>`
      );
      expect(el.shadowRoot!.querySelector('.row')).to.equal(null);
      expect(el.shadowRoot!.querySelector('.chips')).to.equal(null);
      expect(el.shadowRoot!.querySelector('mt-dropdown')).to.equal(null);
    });
  });

  describe('icons mode (default)', () => {
    const iconItems: SelectorItem[] = Array.from({ length: 7 }, (_, index) => ({
      value: String(index),
      label: `Option ${index}`,
      icon: 'mdi:fan',
      active: index === 0,
    }));

    it('preserves the pre-change 400px / three-chip footprint', async () => {
      const container = await fixture<HTMLDivElement>(html`
        <div style="width: 400px">
          <mt-selector-row .items=${iconItems.slice(0, 3)}></mt-selector-row>
        </div>
      `);
      const row = container.querySelector('mt-selector-row')!;
      await row.updateComplete;
      const chips = [...row.shadowRoot!.querySelectorAll<HTMLElement>('.chip')];
      const widths = chips.map((chip) => getComputedStyle(chip).width);
      expect(widths).to.deep.equal(['120px', '120px', '120px']);
      expect(chips[1].getBoundingClientRect().left - chips[0].getBoundingClientRect().right)
        .to.equal(4);
    });

    it('fits seven equal icon chips inside a 200px row without scrolling', async () => {
      const container = await fixture<HTMLDivElement>(html`
        <div style="width: 200px"><mt-selector-row .items=${iconItems}></mt-selector-row></div>
      `);
      const row = container.querySelector('mt-selector-row')!;
      await row.updateComplete;
      const group = row.shadowRoot!.querySelector<HTMLElement>('.chips')!;
      const bounds = group.getBoundingClientRect();
      const chips = [...row.shadowRoot!.querySelectorAll<HTMLElement>('.chip')];
      for (const chip of chips) {
        const rect = chip.getBoundingClientRect();
        expect(rect.left).to.be.at.least(bounds.left);
        expect(rect.right).to.be.at.most(bounds.right);
        expect(rect.width).to.be.at.least(28);
        expect(rect.width).to.be.closeTo(chips[0].getBoundingClientRect().width, 0.02);
      }
      expect(group.scrollWidth).to.equal(group.clientWidth);
    });

    it('contains and ellipsizes long labels without overlapping neighbouring chips', async () => {
      const labels = iconItems.slice(0, 6).map((item) => ({
        value: item.value,
        label: `A very long entity name for option ${item.value}`,
      }));
      const container = await fixture<HTMLDivElement>(html`
        <div style="width: 200px"><mt-selector-row .items=${labels}></mt-selector-row></div>
      `);
      const row = container.querySelector('mt-selector-row')!;
      await row.updateComplete;
      const chips = [...row.shadowRoot!.querySelectorAll<HTMLElement>('.chip')];
      chips.forEach((chip, index) => {
        const bounds = chip.getBoundingClientRect();
        const text = chip.querySelector<HTMLElement>('.chip-text')!;
        const textBounds = text.getBoundingClientRect();
        expect(textBounds.left).to.be.at.least(bounds.left);
        expect(textBounds.right).to.be.at.most(bounds.right);
        if (index < chips.length - 1) {
          expect(bounds.right).to.be.at.most(chips[index + 1].getBoundingClientRect().left);
        }
        expect(getComputedStyle(text).overflow).to.equal('hidden');
        expect(getComputedStyle(text).textOverflow).to.equal('ellipsis');
        expect(getComputedStyle(text).whiteSpace).to.equal('nowrap');
        expect(text.scrollWidth).to.be.greaterThan(text.clientWidth);
        expect(chip.title).to.equal(labels[index].label);
        expect(chip.getAttribute('aria-label')).to.equal(labels[index].label);
      });
    });

    it('scrolls only once equal chips would fall below the 28px minimum', async () => {
      const container = await fixture<HTMLDivElement>(html`
        <div style="width: 190px"><mt-selector-row .items=${iconItems}></mt-selector-row></div>
      `);
      const row = container.querySelector('mt-selector-row')!;
      await row.updateComplete;
      const group = row.shadowRoot!.querySelector<HTMLElement>('.chips')!;
      for (const chip of row.shadowRoot!.querySelectorAll('.chip')) {
        expect(chip.getBoundingClientRect().width).to.equal(28);
      }
      expect(group.scrollWidth).to.be.greaterThan(group.clientWidth);
      group.scrollLeft = group.scrollWidth;
      expect(group.scrollLeft).to.be.greaterThan(0);
    });

    const items: SelectorItem[] = [
      { value: 'a', label: 'Alpha', icon: 'mdi:a', active: true },
      { value: 'b', label: 'Beta' }, // no icon -> chip-text
      { value: 'c', label: 'Gamma', icon: 'mdi:c', disabled: true },
    ];

    it('renders one chip per item', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items}></mt-selector-row>`
      );
      const chips = el.shadowRoot!.querySelectorAll('.chip');
      expect(chips.length).to.equal(3);
    });

    it('renders ha-icon for an item with an icon', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items}></mt-selector-row>`
      );
      const chips = el.shadowRoot!.querySelectorAll('.chip');
      const icon = chips[0].querySelector('ha-icon');
      expect(icon).to.not.equal(null);
      expect(icon!.getAttribute('icon')).to.equal('mdi:a');
      expect(chips[0].querySelector('.chip-text')).to.equal(null);
    });

    it('renders chip-text with the label for an item without an icon', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items}></mt-selector-row>`
      );
      const chips = el.shadowRoot!.querySelectorAll('.chip');
      const text = chips[1].querySelector('.chip-text');
      expect(text).to.not.equal(null);
      expect(text!.textContent).to.equal('Beta');
      expect(chips[1].querySelector('ha-icon')).to.equal(null);
    });

    it('applies the active class to the active item only', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items}></mt-selector-row>`
      );
      const chips = el.shadowRoot!.querySelectorAll('.chip');
      expect(chips[0].classList.contains('active')).to.be.true;
      expect(chips[1].classList.contains('active')).to.be.false;
      expect(chips[2].classList.contains('active')).to.be.false;
      // aria-pressed reflects active state
      expect(chips[0].getAttribute('aria-pressed')).to.equal('true');
      expect(chips[1].getAttribute('aria-pressed')).to.equal('false');
    });

    it('sets the disabled attribute on disabled items', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items}></mt-selector-row>`
      );
      const chips = el.shadowRoot!.querySelectorAll('.chip');
      expect((chips[2] as HTMLButtonElement).disabled).to.be.true;
      expect((chips[0] as HTMLButtonElement).disabled).to.be.false;
    });

    it('renders the label as a visible title above the chips when set', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items} label="Mode"></mt-selector-row>`
      );
      const title = el.shadowRoot!.querySelector('.title');
      expect(title).to.not.equal(null);
      expect(title!.textContent).to.equal('Mode');
    });

    it('omits the title element when no label is set', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items}></mt-selector-row>`
      );
      expect(el.shadowRoot!.querySelector('.title')).to.equal(null);
    });

    it('uses the label as the chip group aria-label, defaulting to "options"', async () => {
      const withLabel = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items} label="Mode"></mt-selector-row>`
      );
      expect(withLabel.shadowRoot!.querySelector('.chips')!.getAttribute('aria-label')).to.equal(
        'Mode'
      );
      const noLabel = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items}></mt-selector-row>`
      );
      expect(noLabel.shadowRoot!.querySelector('.chips')!.getAttribute('aria-label')).to.equal(
        'options'
      );
    });

    it('dispatches item-selected with {value} (bubbles+composed) on chip click', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items}></mt-selector-row>`
      );
      const chips = el.shadowRoot!.querySelectorAll('.chip');
      const listener = oncePromise(el, 'item-selected');
      (chips[1] as HTMLButtonElement).click();
      const ev = await listener;
      expect(ev.detail).to.deep.equal({ value: 'b' });
      expect(ev.bubbles).to.be.true;
      expect(ev.composed).to.be.true;
    });

    it('emits the correct value for each clicked chip via oneEvent', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items}></mt-selector-row>`
      );
      const chips = el.shadowRoot!.querySelectorAll('.chip');
      setTimeout(() => (chips[0] as HTMLButtonElement).click());
      const ev = await oneEvent(el, 'item-selected');
      expect(ev.detail.value).to.equal('a');
    });

    it('does not dispatch when a disabled chip is clicked', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items}></mt-selector-row>`
      );
      const chips = el.shadowRoot!.querySelectorAll('.chip');
      let fired = false;
      el.addEventListener('item-selected', () => (fired = true));
      // disabled buttons do not fire click handlers
      (chips[2] as HTMLButtonElement).click();
      await new Promise((r) => setTimeout(r, 20));
      expect(fired).to.be.false;
    });
  });

  describe('dropdown mode', () => {
    const items: SelectorItem[] = [
      { value: 'a', label: 'Alpha', icon: 'mdi:a', active: true },
      { value: 'b', label: 'Beta' },
    ];

    it('renders an mt-dropdown and no icon row', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items} display="dropdown"></mt-selector-row>`
      );
      const dd = el.shadowRoot!.querySelector('mt-dropdown');
      expect(dd).to.not.equal(null);
      expect(el.shadowRoot!.querySelector('.chips')).to.equal(null);
    });

    it('passes items and placeholder (label) to the dropdown', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row
          .items=${items}
          display="dropdown"
          label="Pick one"
        ></mt-selector-row>`
      );
      const dd = el.shadowRoot!.querySelector('mt-dropdown') as any;
      expect(dd.items).to.deep.equal(items);
      expect(dd.placeholder).to.equal('Pick one');
    });

    it('passes empty placeholder when label is unset', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items} display="dropdown"></mt-selector-row>`
      );
      const dd = el.shadowRoot!.querySelector('mt-dropdown') as any;
      expect(dd.placeholder).to.equal('');
    });

    it('re-emits item-selected with the same value when the dropdown selects', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items} display="dropdown"></mt-selector-row>`
      );
      const dd = el.shadowRoot!.querySelector('mt-dropdown')!;
      const listener = oncePromise(el, 'item-selected');
      dd.dispatchEvent(
        new CustomEvent('item-selected', {
          detail: { value: 'x' },
          bubbles: true,
          composed: true,
        })
      );
      const ev = await listener;
      expect(ev.detail).to.deep.equal({ value: 'x' });
      expect(ev.bubbles).to.be.true;
      expect(ev.composed).to.be.true;
    });
  });

  describe('tile mode', () => {
    const items: SelectorItem[] = [
      { value: 'a', label: 'Alpha', icon: 'mdi:a', active: true },
      { value: 'b', label: 'Beta' },
    ];

    it('renders a tile-variant mt-dropdown, no chips and no leading title', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items} display="tile" label="Mode"></mt-selector-row>`
      );
      const dd = el.shadowRoot!.querySelector('mt-dropdown') as any;
      expect(dd).to.not.equal(null);
      expect(dd.variant).to.equal('tile');
      // the tile carries its own title, so the row's leading .title is omitted
      expect(el.shadowRoot!.querySelector('.title')).to.equal(null);
      expect(el.shadowRoot!.querySelector('.chips')).to.equal(null);
    });

    it('passes the label to the tile as its title', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items} display="tile" label="Mode"></mt-selector-row>`
      );
      const dd = el.shadowRoot!.querySelector('mt-dropdown') as any;
      expect(dd.items).to.deep.equal(items);
      expect(dd.label).to.equal('Mode');
    });

    it('passes an empty label to the tile when unset', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items} display="tile"></mt-selector-row>`
      );
      const dd = el.shadowRoot!.querySelector('mt-dropdown') as any;
      expect(dd.label).to.equal('');
    });

    it('re-emits item-selected from the tile dropdown', async () => {
      const el = await fixture<MtSelectorRow>(
        html`<mt-selector-row .items=${items} display="tile"></mt-selector-row>`
      );
      const dd = el.shadowRoot!.querySelector('mt-dropdown')!;
      const listener = oncePromise(el, 'item-selected');
      dd.dispatchEvent(
        new CustomEvent('item-selected', { detail: { value: 'b' }, bubbles: true, composed: true })
      );
      const ev = await listener;
      expect(ev.detail).to.deep.equal({ value: 'b' });
    });
  });
});
