import { fixture, html, expect } from '@open-wc/testing';
import { makeHass } from '../helpers';
import '../../src/editors/icon-field';
import type { MtIconField } from '../../src/editors/icon-field';

/**
 * Mount mt-icon-field with the given value (undefined = default · '' = no icon).
 * @param value the icon value
 * @param defaultIcon the consumer's default icon to preview when unset
 */
async function mount(value?: string, defaultIcon?: string): Promise<MtIconField> {
  const el = await fixture<MtIconField>(
    html`<mt-icon-field
      .hass=${makeHass({})}
      .value=${value}
      .defaultIcon=${defaultIcon}
    ></mt-icon-field>`
  );
  await el.updateComplete;
  return el;
}

/** The left "icon" segment (opens the picker). */
function iconSeg(el: MtIconField): HTMLButtonElement {
  return el.shadowRoot!.querySelector('.seg.icon') as HTMLButtonElement;
}
/** The right "cancel" (no-icon) segment. */
function cancelSeg(el: MtIconField): HTMLButtonElement {
  return el.shadowRoot!.querySelector('.seg.cancel') as HTMLButtonElement;
}
/** The open popover, if any. */
function popover(el: MtIconField): HTMLElement | null {
  return el.shadowRoot!.querySelector('.popover');
}
/** The nested ha-icon-picker (only rendered while the popover is open). */
function picker(el: MtIconField): any {
  return el.shadowRoot!.querySelector('ha-icon-picker');
}
/** Resolve with the next value-changed detail.value. */
function onChange(el: MtIconField): Promise<string | undefined> {
  return new Promise((res) =>
    el.addEventListener('value-changed', (e) => res((e as CustomEvent).detail.value), {
      once: true,
    })
  );
}

describe('mt-icon-field', () => {
  it('renders a two-segment pill (icon + cancel), closed by default', async () => {
    const el = await mount();
    expect(iconSeg(el)).to.not.equal(null);
    expect(cancelSeg(el)).to.not.equal(null);
    expect(popover(el)).to.equal(null);
  });

  describe('resting state', () => {
    it('default (undefined): neither segment active; icon previews the default', async () => {
      const el = await mount(undefined, 'mdi:fire');
      expect(iconSeg(el).classList.contains('active')).to.be.false;
      expect(iconSeg(el).classList.contains('preview')).to.be.true;
      expect(cancelSeg(el).classList.contains('active')).to.be.false;
      expect(iconSeg(el).querySelector('ha-icon')!.getAttribute('icon')).to.equal('mdi:fire');
    });

    it('default with no defaultIcon shows the generic "add icon" glyph', async () => {
      const el = await mount(undefined);
      expect(iconSeg(el).querySelector('ha-icon')!.getAttribute('icon')).to.equal('mdi:image-plus');
    });

    it('custom icon: icon segment active and shows the custom icon (no preview)', async () => {
      const el = await mount('mdi:snowflake', 'mdi:fire');
      expect(iconSeg(el).classList.contains('active')).to.be.true;
      expect(iconSeg(el).classList.contains('preview')).to.be.false;
      expect(iconSeg(el).querySelector('ha-icon')!.getAttribute('icon')).to.equal('mdi:snowflake');
      expect(cancelSeg(el).classList.contains('active')).to.be.false;
    });

    it('no icon (""): cancel segment active, icon segment inactive', async () => {
      const el = await mount('');
      expect(cancelSeg(el).classList.contains('active')).to.be.true;
      expect(iconSeg(el).classList.contains('active')).to.be.false;
    });
  });

  describe('cancel (no-icon) toggle', () => {
    it('clicking cancel from the default selects "no icon" (emits "")', async () => {
      const el = await mount(undefined);
      const p = onChange(el);
      cancelSeg(el).click();
      expect(await p).to.equal('');
    });

    it('clicking cancel while "no icon" reverts to the default (emits undefined)', async () => {
      const el = await mount('');
      const p = onChange(el);
      cancelSeg(el).click();
      expect(await p).to.equal(undefined);
    });

    it('clicking cancel closes an open popover', async () => {
      const el = await mount(undefined);
      iconSeg(el).click();
      await el.updateComplete;
      expect(popover(el)).to.not.equal(null);
      cancelSeg(el).click();
      await el.updateComplete;
      expect(popover(el)).to.equal(null);
    });
  });

  describe('icon picker popover', () => {
    it('clicking the icon segment opens a fixed-position popover with the picker', async () => {
      const el = await mount('mdi:fire');
      iconSeg(el).click();
      await el.updateComplete;
      expect(popover(el)).to.not.equal(null);
      expect(iconSeg(el).getAttribute('aria-expanded')).to.equal('true');
      expect(picker(el)).to.not.equal(null);
      expect(picker(el).value).to.equal('mdi:fire');
      // Anchored in the viewport (left clamped to ≥ 8px).
      const left = parseFloat(popover(el)!.style.left);
      expect(left).to.be.at.least(8);
      expect(popover(el)!.style.top).to.not.equal('');
    });

    it('opens with an empty picker when currently "no icon"', async () => {
      const el = await mount('');
      iconSeg(el).click();
      await el.updateComplete;
      expect(picker(el).value).to.equal('');
    });

    it('clicking the icon segment again closes the popover', async () => {
      const el = await mount(undefined);
      iconSeg(el).click();
      await el.updateComplete;
      expect(popover(el)).to.not.equal(null);
      iconSeg(el).click();
      await el.updateComplete;
      expect(popover(el)).to.equal(null);
    });

    it('choosing an icon emits the custom value and closes the popover', async () => {
      const el = await mount(undefined);
      iconSeg(el).click();
      await el.updateComplete;
      const p = onChange(el);
      picker(el).dispatchEvent(
        new CustomEvent('value-changed', {
          detail: { value: 'mdi:snowflake' },
          bubbles: true,
          composed: true,
        })
      );
      expect(await p).to.equal('mdi:snowflake');
      await el.updateComplete;
      expect(popover(el)).to.equal(null);
    });

    it('clearing the picker reverts to the default (undefined), not "no icon"', async () => {
      const el = await mount('mdi:fire');
      iconSeg(el).click();
      await el.updateComplete;
      const p = onChange(el);
      picker(el).dispatchEvent(
        new CustomEvent('value-changed', { detail: { value: '' }, bubbles: true, composed: true })
      );
      expect(await p).to.equal(undefined);
    });
  });

  describe('outside-click handling', () => {
    it('a document click outside closes an open popover', async () => {
      const el = await mount(undefined);
      iconSeg(el).click();
      await el.updateComplete;
      expect(popover(el)).to.not.equal(null);
      document.body.click();
      await el.updateComplete;
      expect(popover(el)).to.equal(null);
    });

    it('a click inside (on the picker) keeps the popover open', async () => {
      const el = await mount(undefined);
      iconSeg(el).click();
      await el.updateComplete;
      picker(el).click();
      await el.updateComplete;
      expect(popover(el)).to.not.equal(null);
    });

    it('a document click while closed is a no-op', async () => {
      const el = await mount(undefined);
      document.body.click();
      await el.updateComplete;
      expect(popover(el)).to.equal(null);
    });
  });
});
