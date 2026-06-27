import { fixture, html, expect } from '@open-wc/testing';
import { makeHass, captureEvents } from '../helpers';
import '../../src/editors/width-field';
import type { MtWidthField } from '../../src/editors/width-field';
import type { MtGridSlider } from '../../src/editors/grid-slider';

/** The reset button. */
function resetBtn(el: MtWidthField): HTMLButtonElement {
  return el.shadowRoot!.querySelector('button.reset') as HTMLButtonElement;
}

/** The nested slider. */
function slider(el: MtWidthField): MtGridSlider {
  return el.shadowRoot!.querySelector('mt-grid-slider') as MtGridSlider;
}

describe('mt-width-field', () => {
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
    it('reset disabled, full-width hint shown, slider tooltip-mode "interaction"', async () => {
      const hass = makeHass({});
      const el = await fixture<MtWidthField>(html`<mt-width-field .hass=${hass}></mt-width-field>`);
      expect(resetBtn(el).disabled).to.be.true;
      const hint = el.shadowRoot!.querySelector('.hint');
      expect(hint).to.not.equal(null);
      expect(hint!.textContent).to.contain('Full width — tap the track to set a percentage.');
      expect(slider(el).getAttribute('tooltip-mode')).to.equal('interaction');
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
