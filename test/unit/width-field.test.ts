import { fixture, html, expect } from '@open-wc/testing';
import { makeHass, captureEvents } from '../helpers';
import '../../src/editors/width-field';
import type { MtWidthField } from '../../src/editors/width-field';
import type { MtGridSlider } from '../../src/editors/grid-slider';
import type { MtAlignmentToggle } from '../../src/editors/alignment-toggle';

/** The reset button. */
function resetBtn(el: MtWidthField): HTMLButtonElement {
  return el.shadowRoot!.querySelector('button.reset') as HTMLButtonElement;
}

/** The nested slider. */
function slider(el: MtWidthField): MtGridSlider {
  return el.shadowRoot!.querySelector('mt-grid-slider') as MtGridSlider;
}

describe('mt-width-field', () => {
  it('keeps width and alignment events independent, including reset', async () => {
    const el = await fixture<MtWidthField>(html`<mt-width-field
      .value=${70} .alignment=${'center'}
    ></mt-width-field>`);
    const toggle = el.shadowRoot!.querySelector('mt-alignment-toggle') as MtAlignmentToggle;
    await toggle.updateComplete;
    const widths: CustomEvent[] = [];
    const alignments: CustomEvent[] = [];
    const generic: Event[] = [];
    el.addEventListener('width-changed', (e) => widths.push(e as CustomEvent));
    el.addEventListener('alignment-changed', (e) => alignments.push(e as CustomEvent));
    el.addEventListener('value-changed', (e) => generic.push(e));
    resetBtn(el).click();
    expect(widths.map((e) => e.detail)).to.deep.equal([{ value: undefined }]);
    expect(el.alignment).to.equal('center');
    expect(toggle.value).to.equal('center');
    expect(alignments).to.have.length(0);
    toggle.shadowRoot!.querySelectorAll('button')[2].click();
    expect(alignments.map((e) => e.detail)).to.deep.equal([{ value: 'right' }]);
    expect(widths).to.have.length(1);
    expect(generic).to.have.length(0);
    expect(el.value).to.equal(70);
    expect(slider(el).value).to.equal(70);
  });

  it('fits a 320px editor with visible icons and no horizontal overflow', async () => {
    const el = await fixture<MtWidthField>(html`<mt-width-field style="width: 320px; max-width: 100%"
      .value=${70}
    ></mt-width-field>`);
    const toggle = el.shadowRoot!.querySelector('mt-alignment-toggle') as MtAlignmentToggle;
    await toggle.updateComplete;
    const bounds = el.getBoundingClientRect();
    expect(el.scrollWidth).to.be.at.most(el.clientWidth);
    for (const button of toggle.shadowRoot!.querySelectorAll('button')) {
      const rect = button.getBoundingClientRect();
      expect(rect.left).to.be.at.least(bounds.left);
      expect(rect.right).to.be.at.most(bounds.right);
      expect(rect.width).to.be.at.least(24);
    }
    expect(slider(el).getBoundingClientRect().width).to.be.greaterThan(0);
  });

  describe('value set', () => {
    it('renders mt-grid-slider with that value, percentage min/max/step, tooltip-mode "always", reset enabled, no hint', async () => {
      const hass = makeHass({});
      const el = await fixture<MtWidthField>(
        html`<mt-width-field .hass=${hass} .value=${70}></mt-width-field>`
      );
      const s = slider(el);
      expect(s).to.not.equal(null);
      expect(s.value).to.equal(70);
      // percentage-based slider: 10..100 in steps of 10
      expect(s.min).to.equal(10);
      expect(s.max).to.equal(100);
      expect(s.step).to.equal(10);
      expect(s.getAttribute('tooltip-mode')).to.equal('always');
      expect(resetBtn(el).disabled).to.be.false;
      expect(el.shadowRoot!.querySelector('.hint')).to.equal(null);
    });

    it('labels the control "Width (% of card)"', async () => {
      const hass = makeHass({});
      const el = await fixture<MtWidthField>(
        html`<mt-width-field .hass=${hass} .value=${70}></mt-width-field>`
      );
      expect(el.shadowRoot!.querySelector('.label')!.textContent!.trim()).to.equal(
        'Width (% of card)'
      );
    });
  });

  describe('value unset', () => {
    it('reset disabled, default-width hint shown, slider shows the default at 100', async () => {
      const hass = makeHass({});
      const el = await fixture<MtWidthField>(html`<mt-width-field .hass=${hass}></mt-width-field>`);
      expect(resetBtn(el).disabled).to.be.true;
      const hint = el.shadowRoot!.querySelector('.hint');
      expect(hint).to.not.equal(null);
      expect(hint!.textContent).to.contain('Default');
      expect(hint!.textContent).to.contain('full width');
      const s = slider(el);
      // the handle shows the default (100%, full) so the default doesn't read as 10%
      expect((s as any).value).to.equal(100);
      expect(s.getAttribute('tooltip-mode')).to.equal('always');
    });

    it('uses the configured `default` for the hint and handle (e.g. tiles at 50)', async () => {
      const hass = makeHass({});
      const el = await fixture<MtWidthField>(
        html`<mt-width-field .hass=${hass} .default=${50}></mt-width-field>`
      );
      expect((slider(el) as any).value).to.equal(50);
      expect(el.shadowRoot!.querySelector('.hint')!.textContent).to.contain('50%');
    });
  });

  describe('reset button', () => {
    it('reset when set -> emits width-changed {value: undefined}', async () => {
      const hass = makeHass({});
      const el = await fixture<MtWidthField>(
        html`<mt-width-field .hass=${hass} .value=${5}></mt-width-field>`
      );
      const cap = captureEvents('width-changed');
      resetBtn(el).click();
      cap.stop();
      expect(cap.events.length).to.equal(1);
      expect(cap.events[0].detail).to.deep.equal({ value: undefined });
    });

    it('reset when unset -> no emit', async () => {
      const hass = makeHass({});
      const el = await fixture<MtWidthField>(html`<mt-width-field .hass=${hass}></mt-width-field>`);
      const cap = captureEvents('width-changed');
      // disabled button, but invoke the handler directly to prove the guard
      (el as any)._reset();
      resetBtn(el).click();
      cap.stop();
      expect(cap.events.length).to.equal(0);
    });
  });

  describe('slider value-changed', () => {
    it('numeric detail -> width-changed {value:number}', async () => {
      const hass = makeHass({});
      const el = await fixture<MtWidthField>(
        html`<mt-width-field .hass=${hass} .value=${3}></mt-width-field>`
      );
      const cap = captureEvents('width-changed');
      slider(el).dispatchEvent(
        new CustomEvent('value-changed', { detail: { value: 7 }, bubbles: true, composed: true })
      );
      cap.stop();
      expect(cap.events.length).to.equal(1);
      expect(cap.events[0].detail).to.deep.equal({ value: 7 });
    });

    it('non-number detail -> width-changed {value: undefined}', async () => {
      const hass = makeHass({});
      const el = await fixture<MtWidthField>(
        html`<mt-width-field .hass=${hass} .value=${3}></mt-width-field>`
      );
      const cap = captureEvents('width-changed');
      slider(el).dispatchEvent(
        new CustomEvent('value-changed', {
          detail: { value: undefined },
          bubbles: true,
          composed: true,
        })
      );
      cap.stop();
      expect(cap.events.length).to.equal(1);
      expect(cap.events[0].detail).to.deep.equal({ value: undefined });
    });

    it('_onChanged handles missing detail gracefully', async () => {
      const hass = makeHass({});
      const el = await fixture<MtWidthField>(
        html`<mt-width-field .hass=${hass} .value=${3}></mt-width-field>`
      );
      const cap = captureEvents('width-changed');
      (el as any)._onChanged({ detail: undefined });
      cap.stop();
      expect(cap.events[0].detail).to.deep.equal({ value: undefined });
    });

    it('_onChanged with a numeric detail emits the number', async () => {
      const hass = makeHass({});
      const el = await fixture<MtWidthField>(
        html`<mt-width-field .hass=${hass}></mt-width-field>`
      );
      const cap = captureEvents('width-changed');
      (el as any)._onChanged({ detail: { value: 9 } });
      cap.stop();
      expect(cap.events[0].detail).to.deep.equal({ value: 9 });
    });
  });
});
