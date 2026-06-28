import { fixture, html, expect } from '@open-wc/testing';
import { captureEvents } from '../helpers';
import '../../src/editors/grid-slider';
import type { MtGridSlider } from '../../src/editors/grid-slider';

/** Read a CSS custom property from an element's inline style. */
function styleVar(el: Element | null, name: string): string {
  return (el as HTMLElement | null)?.style.getPropertyValue(name).trim() ?? '';
}

/** The internal #slider element. */
function sliderEl(el: MtGridSlider): HTMLElement {
  return el.shadowRoot!.querySelector('#slider') as HTMLElement;
}

/** Stub pointer-capture methods so jsdom/Chrome don't throw on synthetic ids. */
function stubCapture(el: MtGridSlider): HTMLElement {
  const s = sliderEl(el);
  (s as any).setPointerCapture = () => {};
  (s as any).releasePointerCapture = () => {};
  return s;
}

/**
 * Build a PointerEvent with a clientX taken from a fraction of the slider rect.
 * @param el the slider host
 * @param type the event type
 * @param frac fraction (0..1) across the track
 */
function pointerAt(el: MtGridSlider, type: string, frac: number): PointerEvent {
  const rect = sliderEl(el).getBoundingClientRect();
  const clientX = rect.left + rect.width * frac;
  return new PointerEvent(type, { clientX, pointerId: 1, bubbles: true, composed: true });
}

describe('mt-grid-slider', () => {
  describe('render structure', () => {
    it('renders track / background / active with --min and --max inline style', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${4} .min=${2} .max=${6} .step=${1}></mt-grid-slider>`
      );
      const track = el.shadowRoot!.querySelector('.track');
      const bg = el.shadowRoot!.querySelector('.background');
      const active = el.shadowRoot!.querySelector('.active');
      expect(track).to.not.equal(null);
      expect(bg).to.not.equal(null);
      expect(active).to.not.equal(null);
      // _range defaults to max (6): --min = 2/6, --max = 1 - 6/6 = 0
      expect(styleVar(active, '--min')).to.equal(`${2 / 6}`);
      expect(styleVar(active, '--max')).to.equal(`${1 - 6 / 6}`);
    });

    it('renders a dot for every step except the 0% endpoint', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider
          .value=${50}
          .min=${10}
          .max=${100}
          .step=${10}
        ></mt-grid-slider>`
      );
      // _range = max = 100, dotCount = round(100/10) = 10, i in 0..9.
      // A dot is rendered for every step index except i === 0 (and the loop
      // stops before i = 10), so dots sit at 10%,20%,…,90% -> 9 dots.
      const dots = el.shadowRoot!.querySelectorAll('.dot');
      expect(dots.length).to.equal(9);
    });

    it('renders no dot at the 0% / 100% endpoints', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider
          .value=${50}
          .min=${10}
          .max=${100}
          .step=${10}
        ></mt-grid-slider>`
      );
      const positions = [...el.shadowRoot!.querySelectorAll('.dot')].map((d) =>
        styleVar(d, '--value')
      );
      // dotCount = 10 -> pct = i/10; endpoints are 0% (i=0, skipped) and 100% (i=10, never reached).
      expect(positions).to.not.include('0');
      expect(positions).to.not.include('1');
    });

    it('renders the handle when value is defined', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${3} .min=${2} .max=${6}></mt-grid-slider>`
      );
      expect(el.shadowRoot!.querySelector('.handle')).to.not.equal(null);
    });

    it('omits the handle when value is undefined', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .min=${2} .max=${6}></mt-grid-slider>`
      );
      expect(el.value).to.equal(undefined);
      expect(el.shadowRoot!.querySelector('.handle')).to.equal(null);
    });
  });

  describe('tooltip modes', () => {
    it('never -> no .tooltip element', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${3} tooltip-mode="never"></mt-grid-slider>`
      );
      expect(el.shadowRoot!.querySelector('.tooltip')).to.equal(null);
    });

    it('always -> .tooltip.visible', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${3} tooltip-mode="always"></mt-grid-slider>`
      );
      const tip = el.shadowRoot!.querySelector('.tooltip');
      expect(tip).to.not.equal(null);
      expect(tip!.classList.contains('visible')).to.be.true;
    });

    it('interaction -> not visible at rest, visible while pressed', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${3} tooltip-mode="interaction"></mt-grid-slider>`
      );
      let tip = el.shadowRoot!.querySelector('.tooltip');
      expect(tip).to.not.equal(null);
      expect(tip!.classList.contains('visible')).to.be.false;

      // Tooltip visibility in interaction mode keys off `_tooltipVisible` only.
      (el as any)._tooltipVisible = true;
      el.requestUpdate();
      await el.updateComplete;
      tip = el.shadowRoot!.querySelector('.tooltip');
      expect(tip!.classList.contains('visible')).to.be.true;
    });

    it('renders the bounded/stepped value text in the tooltip', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${10} .min=${2} .max=${6} tooltip-mode="always"></mt-grid-slider>`
      );
      const tip = el.shadowRoot!.querySelector('.tooltip');
      expect(tip!.textContent!.trim()).to.equal('6');
    });
  });

  describe('updated() aria attributes', () => {
    it('sets aria-valuenow/text from stepped value and min/max', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${3} .min=${2} .max=${6} .step=${1}></mt-grid-slider>`
      );
      expect(el.getAttribute('aria-valuenow')).to.equal('3');
      expect(el.getAttribute('aria-valuetext')).to.equal('3');
      expect(el.getAttribute('aria-valuemin')).to.equal('2');
      expect(el.getAttribute('aria-valuemax')).to.equal('6');
      expect(el.getAttribute('role')).to.equal('slider');
      expect(el.getAttribute('aria-orientation')).to.equal('horizontal');
      expect(el.getAttribute('tabindex')).to.equal('0');
    });

    it('treats undefined value as 0 for aria-valuenow when value changes to undefined', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${3} .min=${1} .max=${4}></mt-grid-slider>`
      );
      expect(el.getAttribute('aria-valuenow')).to.equal('3');
      el.value = undefined;
      await el.updateComplete;
      // updated() fires because value changed; _stepped(undefined ?? 0) -> 0
      expect(el.getAttribute('aria-valuenow')).to.equal('0');
    });
  });

  describe('pointer interaction', () => {
    it('pointerdown sets value, pointermove emits slider-moved, pointerup emits value-changed', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${2} .min=${1} .max=${4} .step=${1}></mt-grid-slider>`
      );
      const s = stubCapture(el);
      const moved = captureEvents('slider-moved');
      const changed = captureEvents('value-changed');

      s.dispatchEvent(pointerAt(el, 'pointerdown', 0.5));
      await el.updateComplete;
      // _range = max = 4, frac 0.5 -> value = 2 (before stepping)
      expect(el.value).to.equal(2);

      s.dispatchEvent(pointerAt(el, 'pointermove', 0.75));
      await el.updateComplete;
      expect(moved.events.length).to.equal(1);
      // value = 4*0.75 = 3, stepped+bounded -> 3
      expect((moved.events[0].detail as any).value).to.equal(3);

      s.dispatchEvent(pointerAt(el, 'pointerup', 0.75));
      moved.stop();
      changed.stop();
      expect(changed.events.length).to.equal(1);
      expect((changed.events[0].detail as any).value).to.equal(3);
      expect((el as any)._pressed).to.be.false;
    });

    it('pointermove without a press does nothing', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${2} .min=${1} .max=${4}></mt-grid-slider>`
      );
      const s = stubCapture(el);
      const moved = captureEvents('slider-moved');
      s.dispatchEvent(pointerAt(el, 'pointermove', 0.5));
      moved.stop();
      expect(moved.events.length).to.equal(0);
    });

    it('pointerup without a press does nothing', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${2} .min=${1} .max=${4}></mt-grid-slider>`
      );
      const s = stubCapture(el);
      const changed = captureEvents('value-changed');
      s.dispatchEvent(pointerAt(el, 'pointerup', 0.5));
      changed.stop();
      expect(changed.events.length).to.equal(0);
    });

    it('disabled -> pointerdown does nothing (no events, no press)', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${2} .min=${1} .max=${4} disabled></mt-grid-slider>`
      );
      const s = stubCapture(el);
      const moved = captureEvents('slider-moved');
      const changed = captureEvents('value-changed');
      s.dispatchEvent(pointerAt(el, 'pointerdown', 0.5));
      await el.updateComplete;
      moved.stop();
      changed.stop();
      expect((el as any)._pressed).to.be.false;
      expect(moved.events.length).to.equal(0);
      expect(changed.events.length).to.equal(0);
    });

    it('pointercancel also commits (bound to _onPointerUp)', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${2} .min=${1} .max=${4} .step=${1}></mt-grid-slider>`
      );
      const s = stubCapture(el);
      s.dispatchEvent(pointerAt(el, 'pointerdown', 0.25));
      const changed = captureEvents('value-changed');
      s.dispatchEvent(pointerAt(el, 'pointercancel', 0.25));
      changed.stop();
      expect(changed.events.length).to.equal(1);
    });
  });

  describe('keyboard interaction', () => {
    /** Dispatch a keydown on the host and capture the resulting value-changed. */
    async function key(el: MtGridSlider, k: string) {
      const cap = captureEvents('value-changed');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
      await el.updateComplete;
      cap.stop();
      return cap;
    }

    it('ArrowRight / ArrowUp add a step', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${3} .min=${1} .max=${6} .step=${1}></mt-grid-slider>`
      );
      let cap = await key(el, 'ArrowRight');
      expect(el.value).to.equal(4);
      expect((cap.events[0].detail as any).value).to.equal(4);
      cap = await key(el, 'ArrowUp');
      expect(el.value).to.equal(5);
    });

    it('ArrowLeft / ArrowDown subtract a step', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${4} .min=${1} .max=${6} .step=${1}></mt-grid-slider>`
      );
      await key(el, 'ArrowLeft');
      expect(el.value).to.equal(3);
      await key(el, 'ArrowDown');
      expect(el.value).to.equal(2);
    });

    it('Home -> min, End -> max', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${4} .min=${2} .max=${8} .step=${1}></mt-grid-slider>`
      );
      await key(el, 'Home');
      expect(el.value).to.equal(2);
      await key(el, 'End');
      expect(el.value).to.equal(8);
    });

    it('PageUp / PageDown jump by 10% (bigStep)', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${10} .min=${0} .max=${100} .step=${1}></mt-grid-slider>`
      );
      // bigStep = max(step=1, (100-0)/10=10) = 10
      await key(el, 'PageUp');
      expect(el.value).to.equal(20);
      await key(el, 'PageDown');
      expect(el.value).to.equal(10);
    });

    it('uses min as the base when value is undefined', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .min=${2} .max=${6} .step=${1}></mt-grid-slider>`
      );
      await key(el, 'ArrowRight');
      expect(el.value).to.equal(3); // min(2) + step(1)
    });

    it('a non-handled key does nothing', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${3} .min=${1} .max=${6}></mt-grid-slider>`
      );
      const cap = await key(el, 'a');
      expect(el.value).to.equal(3);
      expect(cap.events.length).to.equal(0);
    });

    it('disabled -> keyboard does nothing', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .value=${3} .min=${1} .max=${6} disabled></mt-grid-slider>`
      );
      const cap = await key(el, 'ArrowRight');
      expect(el.value).to.equal(3);
      expect(cap.events.length).to.equal(0);
    });
  });

  describe('private helpers', () => {
    it('_bounded clamps into [min,max]', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .min=${2} .max=${6}></mt-grid-slider>`
      );
      expect((el as any)._bounded(0)).to.equal(2);
      expect((el as any)._bounded(10)).to.equal(6);
      expect((el as any)._bounded(4)).to.equal(4);
    });

    it('_stepped snaps to the step', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .step=${0.5}></mt-grid-slider>`
      );
      expect((el as any)._stepped(2.2)).to.equal(2);
      expect((el as any)._stepped(2.3)).to.equal(2.5);
    });

    it('_valueToPct uses _range', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .min=${1} .max=${4}></mt-grid-slider>`
      );
      // _range = max = 4 -> 2/4 = 0.5
      expect((el as any)._valueToPct(2)).to.equal(0.5);
    });

    it('_pctFromX clamps from slider rect', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .min=${1} .max=${4}></mt-grid-slider>`
      );
      const rect = sliderEl(el).getBoundingClientRect();
      expect((el as any)._pctFromX(rect.left - 100)).to.equal(0);
      expect((el as any)._pctFromX(rect.left + rect.width + 100)).to.equal(1);
      expect((el as any)._pctFromX(rect.left + rect.width * 0.5)).to.be.closeTo(0.5, 0.001);
    });

    it('_range defaults to max and uses range when set', async () => {
      const el = await fixture<MtGridSlider>(
        html`<mt-grid-slider .min=${1} .max=${4}></mt-grid-slider>`
      );
      expect((el as any)._range).to.equal(4);
      el.range = 10;
      await el.updateComplete;
      expect((el as any)._range).to.equal(10);
    });
  });
});
