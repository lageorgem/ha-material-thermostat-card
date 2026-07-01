import { fixture, html, expect } from '@open-wc/testing';
import { oncePromise } from '../helpers';
import '../../src/editors/color-field';
import type { MtColorField } from '../../src/editors/color-field';

/** The swatch button. */
const swatch = (el: MtColorField) => el.shadowRoot!.querySelector('.swatch') as HTMLButtonElement;
/** The native color input inside the popover (null when closed). */
const colorInput = (el: MtColorField) =>
  el.shadowRoot!.querySelector('input[type="color"]') as HTMLInputElement | null;

describe('mt-color-field', () => {
  it('shows the default color on the swatch when no value is set', async () => {
    const el = await fixture<MtColorField>(
      html`<mt-color-field .defaultColor=${'#ff8800'}></mt-color-field>`
    );
    expect(swatch(el).getAttribute('style') ?? '').to.contain('#ff8800');
    // popover closed initially
    expect(colorInput(el)).to.equal(null);
  });

  it('shows the custom value on the swatch when set', async () => {
    const el = await fixture<MtColorField>(
      html`<mt-color-field .value=${'#123456'} .defaultColor=${'#ff8800'}></mt-color-field>`
    );
    expect(swatch(el).getAttribute('style') ?? '').to.contain('#123456');
  });

  describe('popover', () => {
    it('opens on swatch click and closes on a second click', async () => {
      const el = await fixture<MtColorField>(html`<mt-color-field></mt-color-field>`);
      swatch(el).click();
      await el.updateComplete;
      expect(colorInput(el)).to.not.equal(null);
      expect(swatch(el).getAttribute('aria-expanded')).to.equal('true');

      swatch(el).click();
      await el.updateComplete;
      expect(colorInput(el)).to.equal(null);
    });

    it('seeds the input with the custom value hex', async () => {
      const el = await fixture<MtColorField>(
        html`<mt-color-field .value=${'#abcdef'}></mt-color-field>`
      );
      swatch(el).click();
      await el.updateComplete;
      expect(colorInput(el)!.value).to.equal('#abcdef');
    });

    it('resolves the default color to a hex to seed the input when unset', async () => {
      const el = await fixture<MtColorField>(
        html`<mt-color-field .defaultColor=${'rgb(255, 136, 0)'}></mt-color-field>`
      );
      swatch(el).click();
      await el.updateComplete;
      // rgb(255,136,0) -> #ff8800
      expect(colorInput(el)!.value).to.equal('#ff8800');
    });

    it('renders a visibly wide color preview even on the default color (no reset button)', async () => {
      const el = await fixture<MtColorField>(
        html`<mt-color-field .defaultColor=${'#ff8800'}></mt-color-field>`
      );
      swatch(el).click();
      await el.updateComplete;
      // No custom value -> no reset button; the popover must still give the color
      // input a real width so the preview is visible (regression: it collapsed to
      // a sliver in a shrink-to-fit popover).
      expect(el.shadowRoot!.querySelector('.reset')).to.equal(null);
      expect(colorInput(el)!.offsetWidth).to.be.greaterThan(100);
    });

    it('resolves a var()-based default color via the browser', async () => {
      const el = await fixture<MtColorField>(
        html`<mt-color-field .defaultColor=${'var(--nope, #010203)'}></mt-color-field>`
      );
      swatch(el).click();
      await el.updateComplete;
      expect(colorInput(el)!.value).to.equal('#010203');
    });

    it('emits value-changed with the picked hex on input', async () => {
      const el = await fixture<MtColorField>(html`<mt-color-field></mt-color-field>`);
      swatch(el).click();
      await el.updateComplete;
      const input = colorInput(el)!;
      input.value = '#00ff00';
      const listener = oncePromise(el, 'value-changed');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const ev = await listener;
      expect((ev.detail as { value: string }).value).to.equal('#00ff00');
    });

    it('hides the reset button when no custom color is set', async () => {
      const el = await fixture<MtColorField>(html`<mt-color-field></mt-color-field>`);
      swatch(el).click();
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.reset')).to.equal(null);
    });

    it('shows the reset button when a color is set, and resetting emits undefined + closes', async () => {
      const el = await fixture<MtColorField>(
        html`<mt-color-field .value=${'#123456'}></mt-color-field>`
      );
      swatch(el).click();
      await el.updateComplete;
      const reset = el.shadowRoot!.querySelector('.reset') as HTMLButtonElement;
      expect(reset).to.not.equal(null);
      const listener = oncePromise(el, 'value-changed');
      reset.click();
      const ev = await listener;
      expect((ev.detail as { value: string | undefined }).value).to.equal(undefined);
      await el.updateComplete;
      expect(colorInput(el)).to.equal(null); // popover closed
    });
  });

  describe('_onDocClick (outside-click handler)', () => {
    it('closes on a real document click outside the element', async () => {
      const el = await fixture<MtColorField>(html`<mt-color-field></mt-color-field>`);
      swatch(el).click();
      await el.updateComplete;
      expect(colorInput(el)).to.not.equal(null);
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await el.updateComplete;
      expect(colorInput(el)).to.equal(null);
    });

    it('stays open when the document click is inside the element', async () => {
      const el = await fixture<MtColorField>(html`<mt-color-field></mt-color-field>`);
      swatch(el).click();
      await el.updateComplete;
      (el as unknown as { _onDocClick: (e: unknown) => void })._onDocClick({
        composedPath: () => [el],
      });
      await el.updateComplete;
      expect(colorInput(el)).to.not.equal(null);
    });

    it('does nothing when not open', async () => {
      const el = await fixture<MtColorField>(html`<mt-color-field></mt-color-field>`);
      (el as unknown as { _onDocClick: (e: unknown) => void })._onDocClick({
        composedPath: () => [document.body],
      });
      await el.updateComplete;
      expect(colorInput(el)).to.equal(null);
    });
  });
});
