import { fixture, html, expect, aTimeout, nextFrame } from '@open-wc/testing';
import sinon from 'sinon';
import { oncePromise, captureEvents } from '../helpers';
import '../../src/dial/circular-dial';
import type { MtCircularDial } from '../../src/dial/circular-dial';
import { climateModeColor, HVAC_MODE_ICONS } from '../../src/theme';

/** The neutral gray used for an idle range / a demand that makes no sense. */
const IDLE_COLOR = 'var(--mt-on-surface-variant)';

/** Geometry constants mirrored from src/dial/circular-dial.ts. */
const VIEW = 320;
const RADIUS = 130;
const ARC_START = 225;
const SWEEP = 270;

/**
 * Make a fixture wide enough that the SVG has a real, non-zero bounding box so
 * pointer/geometry math is exercised against actual layout.
 * @param attrs lit template for the element
 */
async function mount(
  attrs = html``
): Promise<MtCircularDial> {
  // Wrap in a sized container so the 100%-width host has definite dimensions.
  const wrap = await fixture<HTMLDivElement>(html`
    <div style="width: 320px; height: 320px;">
      <mt-circular-dial></mt-circular-dial>
    </div>
  `);
  const el = wrap.querySelector('mt-circular-dial') as MtCircularDial;
  await el.updateComplete;
  return el;
}

/** Center client coords of the SVG plus its scale factor. */
function svgGeometry(el: MtCircularDial): {
  svg: SVGSVGElement;
  cx: number;
  cy: number;
  scale: number;
  rect: DOMRect;
} {
  const svg = el.shadowRoot!.querySelector('svg') as SVGSVGElement;
  const rect = svg.getBoundingClientRect();
  return {
    svg,
    cx: rect.left + rect.width / 2,
    cy: rect.top + rect.height / 2,
    scale: rect.width / VIEW || 1,
    rect,
  };
}

/**
 * Stub pointer-capture so we can dispatch real PointerEvents (or call the
 * private handlers) without a live pointer.
 * @param svg the svg element
 */
function stubCapture(svg: SVGSVGElement): void {
  (svg as any).setPointerCapture = (): void => {};
  (svg as any).releasePointerCapture = (): void => {};
}

describe('mt-circular-dial', () => {
  describe('rendering — single mode', () => {
    it('renders the center value-text and unit, but no mode label (single mode)', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.modeLabel = 'Cooling';
      el.value = 21;
      el.unit = '°C';
      el.step = 0.5;
      await el.updateComplete;

      const sr = el.shadowRoot!;
      const valueText = sr.querySelector('.value-text');
      expect(valueText).to.not.equal(null);
      expect(valueText!.textContent!.trim()).to.equal('21.0');
      expect(sr.querySelector('.unit')!.textContent!.trim()).to.equal('°C');
      // The HVAC chips already show the mode (à la Google Home) — no label here.
      expect(sr.querySelector('.mode')).to.equal(null);
      // single-mode center is not the dual readout
      expect(sr.querySelector('.temp.dual')).to.equal(null);
      expect(sr.querySelector('.dash')).to.equal(null);
      // step buttons present in single mode
      expect(sr.querySelectorAll('.step').length).to.equal(2);
    });

    it('shows the status label only when disabled/unavailable', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.modeLabel = 'Unavailable';
      el.disabled = true;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.mode')!.textContent!.trim()).to.equal('Unavailable');
    });

    it('omits the mode label element when not disabled (even with a modeLabel)', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.modeLabel = 'Cool';
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.mode')).to.equal(null);
    });

    it('renders the preset icon above the controls (outside .center) when set', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.presetIcon = 'mdi:leaf';
      await el.updateComplete;
      const icon = el.shadowRoot!.querySelector('.preset-icon');
      expect(icon).to.not.equal(null);
      expect(icon!.getAttribute('icon')).to.equal('mdi:leaf');
      // It must NOT live inside .center, so it never shifts the centered
      // temperature off the dial's true center.
      expect(el.shadowRoot!.querySelector('.center .preset-icon')).to.equal(null);
    });

    it('omits the preset icon when unset', async () => {
      const el = await mount();
      el.mode = 'cool';
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.preset-icon')).to.equal(null);
    });

    it('shows the current temp as primary when showCurrentAsPrimary is set', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.value = 21;
      el.current = 23.4;
      el.showCurrentAsPrimary = true;
      el.step = 0.5;
      await el.updateComplete;
      // primary = current, precision forced to 1
      expect(el.shadowRoot!.querySelector('.value-text')!.textContent!.trim()).to.equal('23.4');
    });

    it('falls back to the target when showCurrentAsPrimary but current is null', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.value = 21;
      el.current = undefined;
      el.showCurrentAsPrimary = true;
      el.step = 1;
      await el.updateComplete;
      // big = target, but bigPrecision is forced to 1 by showCurrentAsPrimary
      expect(el.shadowRoot!.querySelector('.value-text')!.textContent!.trim()).to.equal('21.0');
    });

    it('showCurrentAsPrimary: labels the setpoint with the target, leaves the current dot bare', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.value = 21;
      el.current = 28; // far from the setpoint so they don't merge
      el.showCurrentAsPrimary = true;
      await el.updateComplete;
      const sr = el.shadowRoot!;
      // current is the big centre number (not duplicated on the ring)
      expect(sr.querySelector('.center .value-text')!.textContent!.trim()).to.equal('28.0');
      // the setpoint marker now carries the target number...
      const labels = [...sr.querySelectorAll('.markers .o-label .num')].map((n) =>
        n.textContent!.trim()
      );
      expect(labels).to.include('21°');
      // ...the current dot is unlabeled and no mode icon is drawn on the ring...
      expect(sr.querySelector('.num.current')).to.equal(null);
      expect(sr.querySelector('.markers ha-icon.mode-icon')).to.equal(null);
      // ...but the current dot itself is still shown.
      expect(sr.querySelector('.o-dot.current')).to.not.equal(null);
    });
  });

  describe('rendering — off mode', () => {
    it('adds .dial.off and hides the colored segment', async () => {
      const el = await mount();
      el.mode = 'off';
      el.current = 22;
      await el.updateComplete;

      const dial = el.shadowRoot!.querySelector('.dial');
      expect(dial!.classList.contains('off')).to.be.true;
      // value path has opacity:0 (showSeg false)
      const valuePath = el.shadowRoot!.querySelector('path.value') as SVGPathElement;
      expect(valuePath.getAttribute('style')).to.contain('opacity:0');
      // no mode icon label in off mode
    });

    it('uses the neutral dial color when off', async () => {
      const el = await mount();
      el.mode = 'off';
      await el.updateComplete;
      expect((el as any)._dialColor).to.equal('var(--mt-on-surface-variant)');
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      expect(dial.getAttribute('style')).to.contain('var(--mt-on-surface-variant)');
    });

    it('treats an unknown mode as off', async () => {
      const el = await mount();
      el.mode = 'frobnicate';
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.dial')!.classList.contains('off')).to.be.true;
    });
  });

  describe('rendering — dual mode', () => {
    it('renders two setpoint dots and the dual center readout with a dash', async () => {
      const el = await mount();
      el.mode = 'heat_cool';
      el.dual = true;
      el.lowValue = 18;
      el.highValue = 24;
      el.step = 0.5;
      el.unit = '°C';
      await el.updateComplete;

      const sr = el.shadowRoot!;
      const setpointDots = sr.querySelectorAll('.o-dot.setpoint');
      expect(setpointDots.length).to.equal(2);
      // dual center
      const dual = sr.querySelector('.temp.dual');
      expect(dual).to.not.equal(null);
      const texts = dual!.querySelectorAll('.value-text');
      expect(texts.length).to.equal(2);
      expect(texts[0].textContent!.trim()).to.equal('18.0');
      expect(texts[1].textContent!.trim()).to.equal('24.0');
      expect(dual!.querySelector('.dash')!.textContent!.trim()).to.equal('–');
      // +/- step buttons are shown in dual mode too (they adjust the selected setpoint)
      expect(sr.querySelectorAll('.step').length).to.equal(2);
    });

    it('falls back low→min and high→max when lowValue/highValue unset', async () => {
      const el = await mount();
      el.mode = 'heat_cool';
      el.dual = true;
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.lowValue = undefined;
      el.highValue = undefined;
      await el.updateComplete;
      const texts = el.shadowRoot!.querySelectorAll('.temp.dual .value-text');
      expect(texts[0].textContent!.trim()).to.equal('10.0');
      expect(texts[1].textContent!.trim()).to.equal('30.0');
    });

    it('hides the mode label in the dual range view, but shows it when disabled', async () => {
      const el = await mount();
      el.mode = 'heat_cool';
      el.dual = true;
      el.lowValue = 18;
      el.highValue = 24;
      el.modeLabel = 'Auto';
      await el.updateComplete;
      // Enabled: the range readout carries no mode label (the chips show it).
      expect(el.shadowRoot!.querySelector('.center .mode')).to.equal(null);
      // Disabled/unavailable: the status surfaces.
      el.modeLabel = 'Unavailable';
      el.disabled = true;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.center .mode')!.textContent!.trim()).to.equal(
        'Unavailable'
      );
    });

    it('renders a current dot when current is in range (dual)', async () => {
      const el = await mount();
      el.mode = 'heat_cool';
      el.dual = true;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 21;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.o-dot.current')).to.not.equal(null);
    });
  });

  describe('touch-action (mobile scroll vs. drag)', () => {
    it('the svg and ring band allow vertical page scroll; only a handle swallows the gesture', async () => {
      // Regression: on mobile a swipe over the dial (incl. the ring band) must
      // still scroll the page; scrubbing is done by dragging a setpoint handle,
      // which is the only element that claims the gesture (touch-action: none).
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.value = 21;
      await el.updateComplete;
      const svg = el.shadowRoot!.querySelector('svg') as SVGSVGElement;
      expect(getComputedStyle(svg).touchAction).to.equal('pan-y');
      const hit = el.shadowRoot!.querySelector('.hit') as SVGElement;
      expect(hit).to.not.equal(null);
      expect(getComputedStyle(hit).touchAction).to.equal('pan-y');
      const handle = el.shadowRoot!.querySelector('.handle') as HTMLElement;
      expect(handle).to.not.equal(null);
      expect(getComputedStyle(handle).touchAction).to.equal('none');
    });

    it('clips the dial so rotated marker layers do not add horizontal overflow', async () => {
      const el = await mount();
      await el.updateComplete;
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      expect(getComputedStyle(dial).overflow).to.equal('hidden');
    });
  });

  describe('halo', () => {
    it('renders the glow as a plain radial-gradient circle (no filter)', async () => {
      const el = await mount();
      el.mode = 'cool';
      await el.updateComplete;
      const glow = el.shadowRoot!.querySelector('circle.glow') as SVGElement;
      expect(glow.getAttribute('fill')).to.equal('url(#mt-glow)');
      expect(glow.getAttribute('filter')).to.equal(null);
    });
  });

  describe('range-display timer (_bumpRangeDisplay)', () => {
    it('shows the range, and a second bump clears the prior timer before re-arming', async () => {
      const el = await mount();
      el.mode = 'heat_cool';
      el.dual = true;
      el.lowValue = 18;
      el.highValue = 24;
      await el.updateComplete;

      (el as any)._bumpRangeDisplay();
      const firstTimer = (el as any)._rangeTimer;
      expect((el as any)._showRangeTimer).to.equal(true);
      expect(firstTimer).to.not.equal(undefined);

      // A second bump must clear the still-pending timer (the `if (_rangeTimer)`
      // branch) and arm a fresh one.
      (el as any)._bumpRangeDisplay();
      expect((el as any)._showRangeTimer).to.equal(true);
      expect((el as any)._rangeTimer).to.not.equal(firstTimer);
    });
  });

  describe('geometry helpers', () => {
    it('_angleOf maps min→ARC_START, max→ARC_START+SWEEP, mid→midpoint', async () => {
      const el = await mount();
      el.min = 10;
      el.max = 30;
      await el.updateComplete;
      expect((el as any)._angleOf(10)).to.equal(ARC_START);
      expect((el as any)._angleOf(30)).to.equal(ARC_START + SWEEP);
      expect((el as any)._angleOf(20)).to.equal(ARC_START + SWEEP / 2);
    });

    it('_angleOf clamps out-of-range values', async () => {
      const el = await mount();
      el.min = 10;
      el.max = 30;
      await el.updateComplete;
      expect((el as any)._angleOf(5)).to.equal(ARC_START);
      expect((el as any)._angleOf(100)).to.equal(ARC_START + SWEEP);
    });

    it('_angleOf handles a degenerate min===max range (no divide-by-zero)', async () => {
      const el = await mount();
      el.min = 20;
      el.max = 20;
      await el.updateComplete;
      // (value-min)/(0||1) -> (value-20)/1; for value=20 frac=0 -> ARC_START
      expect((el as any)._angleOf(20)).to.equal(ARC_START);
    });

    it('_fracOf maps min→0, max→1, mid→0.5', async () => {
      const el = await mount();
      el.min = 10;
      el.max = 30;
      await el.updateComplete;
      expect((el as any)._fracOf(10)).to.equal(0);
      expect((el as any)._fracOf(30)).to.equal(1);
      expect((el as any)._fracOf(20)).to.equal(0.5);
    });

    it('_roundToStep snaps to step, clamps to [min,max], applies precision', async () => {
      const el = await mount();
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      await el.updateComplete;
      expect((el as any)._roundToStep(20.3)).to.equal(20.5);
      expect((el as any)._roundToStep(20.1)).to.equal(20);
      expect((el as any)._roundToStep(5)).to.equal(10); // clamp low
      expect((el as any)._roundToStep(99)).to.equal(30); // clamp high
    });

    it('_roundToStep with integer step rounds to integers (precision 0)', async () => {
      const el = await mount();
      el.min = 10;
      el.max = 30;
      el.step = 1;
      await el.updateComplete;
      expect((el as any)._roundToStep(20.6)).to.equal(21);
      expect((el as any)._roundToStep(20.4)).to.equal(20);
    });

    it('_precision is 1 for step<1 and 0 for step>=1', async () => {
      const el = await mount();
      el.step = 0.5;
      await el.updateComplete;
      expect((el as any)._precision).to.equal(1);
      el.step = 1;
      await el.updateComplete;
      expect((el as any)._precision).to.equal(0);
      el.step = 2;
      await el.updateComplete;
      expect((el as any)._precision).to.equal(0);
    });
  });

  describe('format helpers', () => {
    it('_fmt returns em-dash for undefined/null/NaN', async () => {
      const el = await mount();
      expect((el as any)._fmt(undefined, 1)).to.equal('—');
      expect((el as any)._fmt(null, 1)).to.equal('—');
      expect((el as any)._fmt(NaN, 1)).to.equal('—');
    });

    it('_fmt formats with the requested precision', async () => {
      const el = await mount();
      expect((el as any)._fmt(21, 1)).to.equal('21.0');
      expect((el as any)._fmt(21.25, 0)).to.equal('21');
      expect((el as any)._fmt(21.25, 1)).to.equal('21.3');
    });

    it('_fmtCompact returns em-dash for undefined/null/NaN', async () => {
      const el = await mount();
      expect((el as any)._fmtCompact(undefined)).to.equal('—');
      expect((el as any)._fmtCompact(null)).to.equal('—');
      expect((el as any)._fmtCompact(NaN)).to.equal('—');
    });

    it('_fmtCompact shows integers bare and decimals with one place', async () => {
      const el = await mount();
      expect((el as any)._fmtCompact(22)).to.equal('22');
      expect((el as any)._fmtCompact(22.5)).to.equal('22.5');
    });
  });

  describe('display getters', () => {
    it('_displayValue is value when not dragging, dragValue while dragging', async () => {
      const el = await mount();
      el.value = 21;
      await el.updateComplete;
      expect((el as any)._displayValue).to.equal(21);
      (el as any)._dragging = true;
      (el as any)._dragValue = 19;
      expect((el as any)._displayValue).to.equal(19);
    });

    it('_displayLow/_displayHigh use lowValue/highValue (or min/max) when not dragging', async () => {
      const el = await mount();
      el.min = 10;
      el.max = 30;
      el.lowValue = 18;
      el.highValue = 24;
      await el.updateComplete;
      expect((el as any)._displayLow).to.equal(18);
      expect((el as any)._displayHigh).to.equal(24);
      el.lowValue = undefined;
      el.highValue = undefined;
      await el.updateComplete;
      expect((el as any)._displayLow).to.equal(10);
      expect((el as any)._displayHigh).to.equal(30);
    });

    it('_displayLow/_displayHigh use drag values while dragging', async () => {
      const el = await mount();
      (el as any)._dragging = true;
      (el as any)._dragLow = 17;
      (el as any)._dragHigh = 25;
      expect((el as any)._displayLow).to.equal(17);
      expect((el as any)._displayHigh).to.equal(25);
    });
  });

  describe('step buttons', () => {
    it('+ button emits value-changed with value+step', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.value = 21;
      el.step = 0.5;
      el.min = 10;
      el.max = 30;
      await el.updateComplete;
      const buttons = el.shadowRoot!.querySelectorAll('.step');
      const listener = oncePromise(el, 'value-changed');
      (buttons[1] as HTMLButtonElement).click();
      const ev = await listener;
      expect(ev.detail.value).to.equal(21.5);
    });

    it('- button emits value-changed with value-step', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.value = 21;
      el.step = 0.5;
      el.min = 10;
      el.max = 30;
      await el.updateComplete;
      const buttons = el.shadowRoot!.querySelectorAll('.step');
      const listener = oncePromise(el, 'value-changed');
      (buttons[0] as HTMLButtonElement).click();
      const ev = await listener;
      expect(ev.detail.value).to.equal(20.5);
    });

    it('disables the buttons and _step early-returns when disabled', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.value = 21;
      el.step = 0.5;
      el.disabled = true;
      await el.updateComplete;
      const buttons = el.shadowRoot!.querySelectorAll('.step');
      expect((buttons[0] as HTMLButtonElement).disabled).to.be.true;
      expect((buttons[1] as HTMLButtonElement).disabled).to.be.true;

      let fired = false;
      el.addEventListener('value-changed', () => (fired = true));
      // call _step directly to hit the early-return branch
      (el as any)._step(1);
      await aTimeout(20);
      expect(fired).to.be.false;
    });
  });

  describe('keyboard (_onKeyDown)', () => {
    /**
     * Fire a keydown on the dial and resolve when value-changed fires (or not).
     * @param el the dial
     * @param key keyboard key
     */
    function key(el: MtCircularDial, key: string): KeyboardEvent {
      const ev = new KeyboardEvent('keydown', { key, bubbles: true });
      const svg = el.shadowRoot!.querySelector('svg') as SVGSVGElement;
      svg.dispatchEvent(ev);
      return ev;
    }

    it('ArrowUp / ArrowRight increase by step', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.value = 21;
      el.step = 0.5;
      await el.updateComplete;

      let p = oncePromise(el, 'value-changed');
      key(el, 'ArrowUp');
      expect((await p).detail.value).to.equal(21.5);

      el.value = 21;
      await el.updateComplete;
      p = oncePromise(el, 'value-changed');
      key(el, 'ArrowRight');
      expect((await p).detail.value).to.equal(21.5);
    });

    it('ArrowDown / ArrowLeft decrease by step', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.value = 21;
      el.step = 0.5;
      await el.updateComplete;

      let p = oncePromise(el, 'value-changed');
      key(el, 'ArrowDown');
      expect((await p).detail.value).to.equal(20.5);

      el.value = 21;
      await el.updateComplete;
      p = oncePromise(el, 'value-changed');
      key(el, 'ArrowLeft');
      expect((await p).detail.value).to.equal(20.5);
    });

    it('other keys do nothing', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.value = 21;
      el.step = 0.5;
      await el.updateComplete;
      let fired = false;
      el.addEventListener('value-changed', () => (fired = true));
      const ev = key(el, 'Enter');
      await aTimeout(20);
      expect(fired).to.be.false;
      expect(ev.defaultPrevented).to.be.false;
    });

    it('does nothing in dual mode', async () => {
      const el = await mount();
      el.mode = 'heat_cool';
      el.dual = true;
      el.value = 21;
      el.step = 0.5;
      await el.updateComplete;
      let fired = false;
      el.addEventListener('value-changed', () => (fired = true));
      key(el, 'ArrowUp');
      await aTimeout(20);
      expect(fired).to.be.false;
    });

    it('does nothing when disabled', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.disabled = true;
      el.value = 21;
      el.step = 0.5;
      await el.updateComplete;
      let fired = false;
      el.addEventListener('value-changed', () => (fired = true));
      key(el, 'ArrowUp');
      await aTimeout(20);
      expect(fired).to.be.false;
    });

    it('calls preventDefault on a handled key', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.value = 21;
      el.step = 0.5;
      await el.updateComplete;
      // cancelable must be true for preventDefault to register defaultPrevented
      const ev = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true });
      const p = oncePromise(el, 'value-changed');
      (el.shadowRoot!.querySelector('svg') as SVGSVGElement).dispatchEvent(ev);
      await p;
      expect(ev.defaultPrevented).to.be.true;
    });
  });

  describe('ring hit-testing (_isRingHit)', () => {
    it('true on the ring near the top', async () => {
      const el = await mount();
      await el.updateComplete;
      const { cx, cy, scale } = svgGeometry(el);
      // top of ring: RADIUS above center (SVG y up)
      const x = cx;
      const y = cy - RADIUS * scale;
      expect((el as any)._isRingHit(x, y)).to.be.true;
    });

    it('false at the center (distance too small)', async () => {
      const el = await mount();
      await el.updateComplete;
      const { cx, cy } = svgGeometry(el);
      expect((el as any)._isRingHit(cx, cy)).to.be.false;
    });

    it('false far outside the ring', async () => {
      const el = await mount();
      await el.updateComplete;
      const { cx, cy, scale } = svgGeometry(el);
      const y = cy - (RADIUS + 60) * scale;
      expect((el as any)._isRingHit(cx, y)).to.be.false;
    });

    it('uses scale fallback (||1) when the svg reports zero width', async () => {
      const el = await mount();
      await el.updateComplete;
      const svg = el.shadowRoot!.querySelector('svg') as SVGSVGElement;
      // force a zero-size rect so `rect.width / VIEW || 1` takes the `|| 1` path
      (svg as any).getBoundingClientRect = (): DOMRect =>
        ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0 }) as DOMRect;
      // with scale 1 and center at (0,0): a point RADIUS above center is on the ring (top)
      expect((el as any)._isRingHit(0, -RADIUS)).to.be.true;
      // center is too close -> not a hit
      expect((el as any)._isRingHit(0, 0)).to.be.false;
    });

    it('false in the bottom gap', async () => {
      const el = await mount();
      await el.updateComplete;
      const { cx, cy, scale } = svgGeometry(el);
      // straight down = bottom gap (angle 180), distance on ring
      const x = cx;
      const y = cy + RADIUS * scale;
      expect((el as any)._isRingHit(x, y)).to.be.false;
    });
  });

  describe('value from a pointer point (_valueFromPoint)', () => {
    it('top maps to the mid value', async () => {
      const el = await mount();
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      await el.updateComplete;
      const { cx, cy, scale } = svgGeometry(el);
      const v = (el as any)._valueFromPoint(cx, cy - RADIUS * scale);
      expect(v).to.equal(20); // mid of [10,30]
    });

    it('bottom-left (ARC_START) maps to min', async () => {
      const el = await mount();
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      await el.updateComplete;
      const { cx, cy, scale } = svgGeometry(el);
      // ARC_START = 225° (0=top, CW). dx = sin(225)?, but use polar to top-based.
      // angle 225 from top, CW: point at lower-left.
      const t = ((225 - 90) * Math.PI) / 180;
      const x = cx + RADIUS * scale * Math.cos(t);
      const y = cy + RADIUS * scale * Math.sin(t);
      const v = (el as any)._valueFromPoint(x, y);
      expect(v).to.equal(10);
    });

    it('bottom-right (ARC_END) maps to max', async () => {
      const el = await mount();
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      await el.updateComplete;
      const { cx, cy, scale } = svgGeometry(el);
      const t = ((135 - 90) * Math.PI) / 180; // ARC_END_WRAP
      const x = cx + RADIUS * scale * Math.cos(t);
      const y = cy + RADIUS * scale * Math.sin(t);
      const v = (el as any)._valueFromPoint(x, y);
      expect(v).to.equal(30);
    });

    it('gap just past min end (angle ~181°) snaps to max (p=SWEEP branch)', async () => {
      const el = await mount();
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      await el.updateComplete;
      const { cx, cy, scale } = svgGeometry(el);
      // a < 180 -> SWEEP. choose a top-based angle of 170 (between 135 and 180,
      // a<180 so snaps to SWEEP -> max).
      const t = ((170 - 90) * Math.PI) / 180;
      const x = cx + RADIUS * scale * Math.cos(t);
      const y = cy + RADIUS * scale * Math.sin(t);
      const v = (el as any)._valueFromPoint(x, y);
      expect(v).to.equal(30);
    });

    it('gap just before max end (angle ~200°) snaps to min (p=0 branch)', async () => {
      const el = await mount();
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      await el.updateComplete;
      const { cx, cy, scale } = svgGeometry(el);
      // top-based angle 200 (between 180 and 225): a>=180 -> p=0 -> min
      const t = ((200 - 90) * Math.PI) / 180;
      const x = cx + RADIUS * scale * Math.cos(t);
      const y = cy + RADIUS * scale * Math.sin(t);
      const v = (el as any)._valueFromPoint(x, y);
      expect(v).to.equal(10);
    });
  });

  describe('pointer drag — single mode', () => {
    it('emits value-changing on down, on move, and value-changed on up', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.value = 15;
      await el.updateComplete;

      const { svg, cx, cy, scale } = svgGeometry(el);
      stubCapture(svg);

      const changing = captureEvents('value-changing');
      const changed = captureEvents('value-changed');

      // pointer down on the top of the ring -> mid value 20
      const topX = cx;
      const topY = cy - RADIUS * scale;
      svg.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: topX,
          clientY: topY,
          pointerId: 1,
          bubbles: true,
          composed: true,
        })
      );
      expect((el as any)._dragging).to.be.true;
      expect(changing.events.length).to.be.greaterThan(0);
      expect((changing.events[changing.events.length - 1].detail as any).value).to.equal(20);

      // move toward ARC_START (min)
      const t = ((225 - 90) * Math.PI) / 180;
      const minX = cx + RADIUS * scale * Math.cos(t);
      const minY = cy + RADIUS * scale * Math.sin(t);
      svg.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: minX,
          clientY: minY,
          pointerId: 1,
          bubbles: true,
          composed: true,
        })
      );
      expect((changing.events[changing.events.length - 1].detail as any).value).to.equal(10);

      // up commits value-changed
      svg.dispatchEvent(
        new PointerEvent('pointerup', {
          clientX: minX,
          clientY: minY,
          pointerId: 1,
          bubbles: true,
          composed: true,
        })
      );
      expect((el as any)._dragging).to.be.false;
      expect(changed.events.length).to.equal(1);
      expect((changed.events[0].detail as any).value).to.equal(10);

      changing.stop();
      changed.stop();
    });

    it('_onPointerDown ignores a press off the ring (center)', async () => {
      const el = await mount();
      el.mode = 'cool';
      await el.updateComplete;
      const { svg, cx, cy } = svgGeometry(el);
      stubCapture(svg);
      const changing = captureEvents('value-changing');
      (el as any)._onPointerDown({
        clientX: cx,
        clientY: cy,
        pointerId: 1,
        preventDefault() {},
      });
      expect((el as any)._dragging).to.be.false;
      expect(changing.events.length).to.equal(0);
      changing.stop();
    });

    it('_onPointerDown ignores presses when disabled', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.disabled = true;
      await el.updateComplete;
      const { svg, cx, cy, scale } = svgGeometry(el);
      stubCapture(svg);
      (el as any)._onPointerDown({
        clientX: cx,
        clientY: cy - RADIUS * scale,
        pointerId: 1,
        preventDefault() {},
      });
      expect((el as any)._dragging).to.be.false;
    });

    it('_onPointerMove does nothing when not dragging', async () => {
      const el = await mount();
      el.mode = 'cool';
      await el.updateComplete;
      const changing = captureEvents('value-changing');
      (el as any)._onPointerMove({ clientX: 0, clientY: 0, pointerId: 1 });
      expect(changing.events.length).to.equal(0);
      changing.stop();
    });

    it('_onPointerUp does nothing when not dragging', async () => {
      const el = await mount();
      el.mode = 'cool';
      await el.updateComplete;
      const changed = captureEvents('value-changed');
      (el as any)._onPointerUp({ clientX: 0, clientY: 0, pointerId: 1 });
      expect(changed.events.length).to.equal(0);
      changed.stop();
    });
  });

  describe('pointer drag — dual mode', () => {
    /**
     * `_onPointerDown` reads the displayed low/high BEFORE flipping `_dragging`,
     * so the first dual press correctly seeds the drag handles from
     * `lowValue/highValue`. The pre-seeding here is redundant-but-explicit; the
     * first-press seeding is asserted on its own below. */
    it('selects the nearest handle and emits {low, high} on down and up', async () => {
      const el = await mount();
      el.mode = 'heat_cool';
      el.dual = true;
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.lowValue = 14;
      el.highValue = 26;
      await el.updateComplete;
      // pre-seed so _displayLow/_displayHigh return sensible values once dragging
      (el as any)._dragLow = 14;
      (el as any)._dragHigh = 26;

      const { svg, cx, cy, scale } = svgGeometry(el);
      stubCapture(svg);
      const changing = captureEvents('value-changing');
      const changed = captureEvents('value-changed');

      // press near min (value ~10) -> closer to low handle (14) than high (26)
      const t = ((225 - 90) * Math.PI) / 180;
      const x = cx + RADIUS * scale * Math.cos(t);
      const y = cy + RADIUS * scale * Math.sin(t);
      (el as any)._onPointerDown({ clientX: x, clientY: y, pointerId: 1, preventDefault() {} });
      expect((el as any)._activeHandle).to.equal('low');
      const lastChanging = changing.events[changing.events.length - 1].detail as any;
      expect(lastChanging).to.have.property('low');
      expect(lastChanging).to.have.property('high');
      // low pushed to 10 (clamped below high - step = 25.5)
      expect(lastChanging.low).to.equal(10);
      expect(lastChanging.high).to.equal(26);

      (el as any)._onPointerUp({ clientX: x, clientY: y, pointerId: 1 });
      expect((el as any)._activeHandle).to.equal(null);
      expect(changed.events.length).to.equal(1);
      expect((changed.events[0].detail as any)).to.have.property('low');
      expect((changed.events[0].detail as any)).to.have.property('high');

      changing.stop();
      changed.stop();
    });

    it('high handle selected when pressing near max', async () => {
      const el = await mount();
      el.mode = 'heat_cool';
      el.dual = true;
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.lowValue = 14;
      el.highValue = 26;
      await el.updateComplete;
      (el as any)._dragLow = 14;
      (el as any)._dragHigh = 26;

      const { svg, cx, cy, scale } = svgGeometry(el);
      stubCapture(svg);
      const t = ((135 - 90) * Math.PI) / 180; // near max -> value ~30, nearer high (26)
      const x = cx + RADIUS * scale * Math.cos(t);
      const y = cy + RADIUS * scale * Math.sin(t);
      (el as any)._onPointerDown({ clientX: x, clientY: y, pointerId: 1, preventDefault() {} });
      expect((el as any)._activeHandle).to.equal('high');
    });

    it('first dual press (no pre-seed) seeds handles from lowValue/highValue', async () => {
      const el = await mount();
      el.mode = 'heat_cool';
      el.dual = true;
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.lowValue = 14;
      el.highValue = 26;
      await el.updateComplete;

      const { svg, cx, cy, scale } = svgGeometry(el);
      stubCapture(svg);
      const t = ((225 - 90) * Math.PI) / 180; // near min -> value ~10, nearer low (14)
      const x = cx + RADIUS * scale * Math.cos(t);
      const y = cy + RADIUS * scale * Math.sin(t);
      (el as any)._onPointerDown({ clientX: x, clientY: y, pointerId: 1, preventDefault() {} });
      // high seeds from highValue (untouched), low handle picked + moved to ~10
      expect((el as any)._dragHigh).to.equal(26);
      expect((el as any)._activeHandle).to.equal('low');
      expect((el as any)._dragLow).to.equal(10);
    });

    it('_applyDual keeps low below high by one step (low handle)', async () => {
      const el = await mount();
      el.dual = true;
      el.step = 0.5;
      await el.updateComplete;
      (el as any)._activeHandle = 'low';
      (el as any)._dragLow = 15;
      (el as any)._dragHigh = 20;
      // candidate above high-step should clamp to high - step
      (el as any)._applyDual(25);
      expect((el as any)._dragLow).to.equal(19.5); // 20 - 0.5
      // candidate below stays
      (el as any)._applyDual(12);
      expect((el as any)._dragLow).to.equal(12);
    });

    it('_applyDual keeps high above low by one step (high handle)', async () => {
      const el = await mount();
      el.dual = true;
      el.step = 0.5;
      await el.updateComplete;
      (el as any)._activeHandle = 'high';
      (el as any)._dragLow = 15;
      (el as any)._dragHigh = 20;
      (el as any)._applyDual(10); // below low+step -> clamp
      expect((el as any)._dragHigh).to.equal(15.5); // 15 + 0.5
      (el as any)._applyDual(24);
      expect((el as any)._dragHigh).to.equal(24);
    });

    it('_emitFromValue single vs dual paths', async () => {
      const el = await mount();
      el.step = 0.5;
      await el.updateComplete;

      // single path: sets _dragValue and emits value-changing {value}
      const singleP = oncePromise(el, 'value-changing');
      (el as any)._emitFromValue(22);
      const single = await singleP;
      expect((el as any)._dragValue).to.equal(22);
      expect(single.detail).to.deep.equal({ value: 22 });

      // dual path: applies to active handle, emits {low, high}
      el.dual = true;
      await el.updateComplete;
      (el as any)._activeHandle = 'high';
      (el as any)._dragLow = 15;
      (el as any)._dragHigh = 20;
      const dualP = oncePromise(el, 'value-changing');
      (el as any)._emitFromValue(23);
      const dual = await dualP;
      expect(dual.detail.low).to.equal(15);
      expect(dual.detail.high).to.equal(23);
    });
  });

  describe('tap-to-set on the ring (touch)', () => {
    /**
     * Build a touch PointerEvent.
     * @param type event name
     * @param x clientX
     * @param y clientY
     */
    function touch(type: string, x: number, y: number): PointerEvent {
      return new PointerEvent(type, {
        clientX: x,
        clientY: y,
        pointerId: 1,
        pointerType: 'touch',
        bubbles: true,
        composed: true,
      });
    }

    it('a touch tap on the ring sets the temperature without dragging', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.value = 15;
      await el.updateComplete;
      const { svg, cx, cy, scale } = svgGeometry(el);
      stubCapture(svg);
      const changing = captureEvents('value-changing');
      const changed = captureEvents('value-changed');
      const topX = cx;
      const topY = cy - RADIUS * scale;

      svg.dispatchEvent(touch('pointerdown', topX, topY));
      // a touch press only arms a tap — no drag, nothing emitted yet
      expect((el as any)._dragging).to.be.false;
      expect((el as any)._tapArmed).to.be.true;
      expect(changing.events.length).to.equal(0);

      svg.dispatchEvent(touch('pointerup', topX, topY));
      expect((el as any)._tapArmed).to.be.false;
      expect(changing.events.length).to.equal(0);
      expect(changed.events.length).to.equal(1);
      expect((changed.events[0].detail as any).value).to.equal(20); // mid of [10,30]

      changing.stop();
      changed.stop();
    });

    it('a touch swipe past the slop cancels the tap (the page scrolls instead)', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.value = 21;
      await el.updateComplete;
      const { svg, cx, cy, scale } = svgGeometry(el);
      stubCapture(svg);
      const changed = captureEvents('value-changed');
      const topX = cx;
      const topY = cy - RADIUS * scale;

      svg.dispatchEvent(touch('pointerdown', topX, topY));
      expect((el as any)._tapArmed).to.be.true;
      // move well past the 10px slop -> the press is a scroll, not a tap
      svg.dispatchEvent(touch('pointermove', topX, topY + 40));
      expect((el as any)._tapArmed).to.be.false;
      expect((el as any)._dragging).to.be.false;
      svg.dispatchEvent(touch('pointerup', topX, topY + 40));
      expect(changed.events.length).to.equal(0);

      changed.stop();
    });

    it('a touch tap in dual mode moves the nearer setpoint (low, near min)', async () => {
      const el = await mount();
      el.mode = 'heat_cool';
      el.dual = true;
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.lowValue = 14;
      el.highValue = 26;
      await el.updateComplete;
      const { svg, cx, cy, scale } = svgGeometry(el);
      stubCapture(svg);
      const changed = captureEvents('value-changed');
      // tap near min (value ~10) -> closer to the low setpoint (14)
      const t = ((225 - 90) * Math.PI) / 180;
      const x = cx + RADIUS * scale * Math.cos(t);
      const y = cy + RADIUS * scale * Math.sin(t);

      svg.dispatchEvent(touch('pointerdown', x, y));
      svg.dispatchEvent(touch('pointerup', x, y));
      expect(changed.events.length).to.equal(1);
      const d = changed.events[0].detail as any;
      expect(d.low).to.equal(10);
      expect(d.high).to.equal(26);

      changed.stop();
    });

    it('a touch tap in dual mode moves the nearer setpoint (high, near max)', async () => {
      const el = await mount();
      el.mode = 'heat_cool';
      el.dual = true;
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.lowValue = 14;
      el.highValue = 26;
      await el.updateComplete;
      const { svg, cx, cy, scale } = svgGeometry(el);
      stubCapture(svg);
      const changed = captureEvents('value-changed');
      const t = ((135 - 90) * Math.PI) / 180; // near max (value ~30) -> nearer high (26)
      const x = cx + RADIUS * scale * Math.cos(t);
      const y = cy + RADIUS * scale * Math.sin(t);

      svg.dispatchEvent(touch('pointerdown', x, y));
      svg.dispatchEvent(touch('pointerup', x, y));
      const d = changed.events[0].detail as any;
      expect(d.low).to.equal(14);
      expect(d.high).to.equal(30);

      changed.stop();
    });

    it('a touch press off the ring (center) does not arm a tap', async () => {
      const el = await mount();
      el.mode = 'cool';
      await el.updateComplete;
      const { svg, cx, cy } = svgGeometry(el);
      stubCapture(svg);
      svg.dispatchEvent(touch('pointerdown', cx, cy));
      expect((el as any)._tapArmed).to.be.false;
    });
  });

  describe('handle drag (setpoint scrub)', () => {
    /**
     * Build a PointerEvent with an explicit pointer id/type.
     * @param type event name
     * @param x clientX
     * @param y clientY
     * @param id pointerId
     */
    function pe(type: string, x: number, y: number, id = 2): PointerEvent {
      return new PointerEvent(type, {
        clientX: x,
        clientY: y,
        pointerId: id,
        pointerType: 'touch',
        bubbles: true,
        composed: true,
      });
    }

    it('single: grabbing the handle drags the value (no jump on grab, commits on release)', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.value = 15;
      await el.updateComplete;
      const { svg, cx, cy, scale } = svgGeometry(el);
      stubCapture(svg);
      const changing = captureEvents('value-changing');
      const changed = captureEvents('value-changed');
      const handle = el.shadowRoot!.querySelector('.handle') as HTMLElement;
      expect(handle).to.not.equal(null);

      // grab the handle -> drag begins, value unchanged
      handle.dispatchEvent(pe('pointerdown', cx, cy));
      expect((el as any)._dragging).to.be.true;
      expect(changing.events.length).to.equal(0);

      // drag to the top of the ring -> mid value 20 (events arrive on the svg via capture)
      svg.dispatchEvent(pe('pointermove', cx, cy - RADIUS * scale));
      expect((changing.events[changing.events.length - 1].detail as any).value).to.equal(20);

      svg.dispatchEvent(pe('pointerup', cx, cy - RADIUS * scale));
      expect((el as any)._dragging).to.be.false;
      expect(changed.events.length).to.equal(1);
      expect((changed.events[0].detail as any).value).to.equal(20);

      changing.stop();
      changed.stop();
    });

    it('dual: the grabbed handle is dragged (not the one nearest the pointer)', async () => {
      const el = await mount();
      el.mode = 'heat_cool';
      el.dual = true;
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.lowValue = 14;
      el.highValue = 26;
      await el.updateComplete;
      const handles = el.shadowRoot!.querySelectorAll('.handle');
      expect(handles.length).to.equal(2);
      const { svg, cx, cy, scale } = svgGeometry(el);
      stubCapture(svg);
      const changing = captureEvents('value-changing');

      // grab the HIGH handle (2nd in DOM order)
      (handles[1] as HTMLElement).dispatchEvent(pe('pointerdown', cx, cy, 3));
      expect((el as any)._activeHandle).to.equal('high');

      // drag it toward min: high follows but clamps to low + step (never crosses low)
      const t = ((225 - 90) * Math.PI) / 180;
      const x = cx + RADIUS * scale * Math.cos(t);
      const y = cy + RADIUS * scale * Math.sin(t);
      svg.dispatchEvent(pe('pointermove', x, y, 3));
      const last = changing.events[changing.events.length - 1].detail as any;
      expect(last.low).to.equal(14);
      expect(last.high).to.equal(14.5); // clamped to low + step

      changing.stop();
    });

    it('a disabled dial ignores a handle grab', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.disabled = true;
      await el.updateComplete;
      const { svg } = svgGeometry(el);
      stubCapture(svg);
      (el as any)._onHandlePointerDown(
        { clientX: 0, clientY: 0, pointerId: 1, preventDefault() {}, stopPropagation() {} },
        null
      );
      expect((el as any)._dragging).to.be.false;
    });
  });

  describe('pointer cancel', () => {
    it('disarms a pending tap when the browser takes the gesture over (scroll)', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.value = 21;
      await el.updateComplete;
      const { svg, cx, cy, scale } = svgGeometry(el);
      stubCapture(svg);
      const changed = captureEvents('value-changed');
      const init = {
        clientX: cx,
        clientY: cy - RADIUS * scale,
        pointerId: 1,
        pointerType: 'touch',
        bubbles: true,
        composed: true,
      };
      svg.dispatchEvent(new PointerEvent('pointerdown', init));
      expect((el as any)._tapArmed).to.be.true;
      svg.dispatchEvent(new PointerEvent('pointercancel', init));
      expect((el as any)._tapArmed).to.be.false;
      expect((el as any)._dragging).to.be.false;
      expect(changed.events.length).to.equal(0);
      changed.stop();
    });

    it('ends an in-progress (mouse) drag on cancel, committing the last value', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.value = 15;
      await el.updateComplete;
      const { svg, cx, cy, scale } = svgGeometry(el);
      stubCapture(svg);
      const changed = captureEvents('value-changed');
      const init = {
        clientX: cx,
        clientY: cy - RADIUS * scale,
        pointerId: 1,
        bubbles: true,
        composed: true,
      };
      // mouse press (pointerType '' is not 'touch') scrubs immediately -> value 20
      svg.dispatchEvent(new PointerEvent('pointerdown', init));
      expect((el as any)._dragging).to.be.true;
      svg.dispatchEvent(new PointerEvent('pointercancel', init));
      expect((el as any)._dragging).to.be.false;
      expect(changed.events.length).to.equal(1);
      expect((changed.events[0].detail as any).value).to.equal(20);
      changed.stop();
    });
  });

  describe('dual +/- buttons and setpoint selection', () => {
    it('shows the +/- buttons and they adjust the setpoint nearest the current temp', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 19; // nearest the low setpoint
      await el.updateComplete;
      expect((el as any)._selSide).to.equal('low');
      const buttons = el.shadowRoot!.querySelectorAll('.step');
      expect(buttons.length).to.equal(2);
      const p = oncePromise(el, 'value-changed');
      (buttons[1] as HTMLButtonElement).click(); // +
      expect((await p).detail).to.deep.equal({ low: 18.5, high: 24 });
    });

    it('- steps the high setpoint when the current temp is nearer it', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 23; // nearest the high setpoint
      await el.updateComplete;
      expect((el as any)._selSide).to.equal('high');
      const buttons = el.shadowRoot!.querySelectorAll('.step');
      const p = oncePromise(el, 'value-changed');
      (buttons[0] as HTMLButtonElement).click(); // -
      expect((await p).detail).to.deep.equal({ low: 18, high: 23.5 });
    });

    it('_selSide falls back to low when there is no current temperature', async () => {
      const el = await mount();
      el.dual = true;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = undefined;
      await el.updateComplete;
      expect((el as any)._selSide).to.equal('low');
    });

    it('clamps a stepped low setpoint to stay a step below high', async () => {
      const el = await mount();
      el.dual = true;
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.lowValue = 23.5;
      el.highValue = 24;
      await el.updateComplete;
      (el as any)._selected = 'low';
      const p = oncePromise(el, 'value-changed');
      (el as any)._step(1); // 23.5→24, clamped to high - step = 23.5
      expect((await p).detail).to.deep.equal({ low: 23.5, high: 24 });
    });

    it('clamps a stepped high setpoint to stay a step above low', async () => {
      const el = await mount();
      el.dual = true;
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.lowValue = 18;
      el.highValue = 18.5;
      await el.updateComplete;
      (el as any)._selected = 'high';
      const p = oncePromise(el, 'value-changed');
      (el as any)._step(-1); // 18.5→18, clamped to low + step = 18.5
      expect((await p).detail).to.deep.equal({ low: 18, high: 18.5 });
    });

    it('highlights the selected setpoint dot and number', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 19; // low selected
      await el.updateComplete;
      const sr = el.shadowRoot!;
      const setDots = sr.querySelectorAll('.o-dot.setpoint');
      expect(setDots[0].classList.contains('sel')).to.be.true; // low
      expect(setDots[1].classList.contains('sel')).to.be.false; // high
      const selNum = sr.querySelector('.o-label .num.sel');
      expect(selNum).to.not.equal(null);
      expect(selNum!.textContent!.trim()).to.equal('18°');
    });

    it('grabbing a handle selects it for the +/- buttons', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 19; // default selection = low
      await el.updateComplete;
      const { svg } = svgGeometry(el);
      stubCapture(svg);
      const handles = el.shadowRoot!.querySelectorAll('.handle');
      (handles[1] as HTMLElement).dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: 0,
          clientY: 0,
          pointerId: 9,
          pointerType: 'touch',
          bubbles: true,
          composed: true,
        })
      );
      expect((el as any)._selected).to.equal('high');
    });
  });

  describe('dual label de-overlap (angular spread along the arc)', () => {
    const LABEL_SEP = 24; // mirrors LABEL_SEP_DEG in the component

    /** The rotation (deg) of each orbiting LABEL, sorted ascending. */
    function labelAngles(el: MtCircularDial): number[] {
      const orbits = [...el.shadowRoot!.querySelectorAll('.markers .orbit')];
      return orbits
        .filter((o) => o.querySelector('.o-label'))
        .map((o) => {
          const m = /rotate\(([-0-9.]+)deg\)/.exec(o.getAttribute('style') ?? '');
          return m ? parseFloat(m[1]) : NaN;
        })
        .sort((a, b) => a - b);
    }

    it('spreads colliding labels along the arc, keeping them on the ring (no inset)', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 23.9; // angle ≈ the high setpoint → would collide
      await el.updateComplete;

      // The old "pull toward centre" inset is gone — labels stay at the ring.
      expect(el.shadowRoot!.querySelector('.o-label.inset')).to.equal(null);
      const angles = labelAngles(el);
      expect(angles.length).to.equal(3);
      // Every adjacent pair is now at least the min separation apart.
      for (let i = 1; i < angles.length; i++) {
        expect(angles[i] - angles[i - 1]).to.be.at.least(LABEL_SEP - 0.5);
      }
    });

    it('leaves well-separated labels at their natural angles', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.lowValue = 18; // angle 333
      el.highValue = 28; // angle 468
      el.current = 23; // angle 400.5 — all far apart
      await el.updateComplete;
      const angles = labelAngles(el);
      expect(angles).to.deep.equal([333, 400.5, 468]);
    });

    it('spreads only the two setpoints when current is the primary number', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.min = 10;
      el.max = 30;
      el.lowValue = 23.5;
      el.highValue = 24; // setpoints nearly coincident
      el.current = 23.9;
      el.showCurrentAsPrimary = true; // current dot carries no label
      await el.updateComplete;
      const angles = labelAngles(el);
      expect(angles.length).to.equal(2); // low + high only
      expect(angles[1] - angles[0]).to.be.at.least(LABEL_SEP - 0.5);
    });
  });

  describe('color (_dialColor)', () => {
    it('returns the climate mode color for a colored mode', async () => {
      const el = await mount();
      el.mode = 'cool';
      await el.updateComplete;
      expect((el as any)._dialColor).to.equal(climateModeColor('cool'));
    });

    it('returns the neutral variant for an off/uncolored mode', async () => {
      const el = await mount();
      el.mode = 'off';
      await el.updateComplete;
      expect((el as any)._dialColor).to.equal('var(--mt-on-surface-variant)');
    });

    it('renders the colored mode color into the dial style', async () => {
      const el = await mount();
      el.mode = 'heat';
      await el.updateComplete;
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      expect(dial.getAttribute('style')).to.contain(climateModeColor('heat'));
    });
  });

  describe('overlap marker', () => {
    it('merges setpoint icon + current temp when within OVERLAP_DEG', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.value = 21;
      el.current = 21; // same angle -> overlap
      await el.updateComplete;
      const merged = el.shadowRoot!.querySelector('.num.current.with-icon');
      expect(merged).to.not.equal(null);
      // the merged label carries an inline mode icon
      expect(merged!.querySelector('ha-icon.mode-icon.inline')).to.not.equal(null);
    });

    it('renders separate icon + current labels when far apart', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      el.value = 12;
      el.current = 28; // far apart -> no overlap
      await el.updateComplete;
      const sr = el.shadowRoot!;
      expect(sr.querySelector('.num.current.with-icon')).to.equal(null);
      // separate current label exists
      const currents = sr.querySelectorAll('.num.current');
      expect(currents.length).to.be.greaterThan(0);
    });
  });

  describe('showCurrent gating', () => {
    it('no current dot/label when current is undefined', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.current = undefined;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.o-dot.current')).to.equal(null);
      expect(el.shadowRoot!.querySelector('.num.current')).to.equal(null);
    });

    it('no current dot/label when current is out of [min,max]', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.current = 99;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.o-dot.current')).to.equal(null);
      expect(el.shadowRoot!.querySelector('.num.current')).to.equal(null);
    });

    it('shows current dot when in range', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.value = 12;
      el.current = 28;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.o-dot.current')).to.not.equal(null);
    });

    it('no segment shown when off even with a valid current', async () => {
      const el = await mount();
      el.mode = 'off';
      el.min = 10;
      el.max = 30;
      el.value = 12;
      el.current = 28;
      await el.updateComplete;
      const valuePath = el.shadowRoot!.querySelector('path.value') as SVGPathElement;
      expect(valuePath.getAttribute('style')).to.contain('opacity:0');
    });
  });

  describe('mode-change wipe', () => {
    it('wipes between two colored modes (creates the overlay then clears it)', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.value = 20;
      el.current = 24; // ensures showSeg true
      await el.updateComplete;
      // first render establishes _prevColor; segment visible
      expect((el as any)._prevColor).to.equal(climateModeColor('cool'));

      el.mode = 'heat';
      await el.updateComplete;
      // _wipeFrom set to the previous (cool) color
      expect((el as any)._wipeFrom).to.equal(climateModeColor('cool'));
      await nextFrame();
      // overlay path rendered while wiping
      const wipe = el.shadowRoot!.querySelector('path.value.wipe-value');
      expect(wipe).to.not.equal(null);
      // both base + overlay value paths exist
      expect(el.shadowRoot!.querySelectorAll('path.value').length).to.equal(2);

      // after the animation, _wipeFrom clears and the overlay is removed
      await aTimeout(700);
      await el.updateComplete;
      expect((el as any)._wipeFrom).to.equal(null);
      expect(el.shadowRoot!.querySelector('path.value.wipe-value')).to.equal(null);
    });

    it('does NOT wipe off → colored', async () => {
      const el = await mount();
      el.mode = 'off';
      el.min = 10;
      el.max = 30;
      el.value = 20;
      el.current = 24;
      await el.updateComplete;
      el.mode = 'cool';
      await el.updateComplete;
      await nextFrame();
      expect((el as any)._wipeFrom).to.equal(null);
      expect(el.shadowRoot!.querySelector('path.value.wipe-value')).to.equal(null);
    });

    it('does NOT wipe colored → off', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.value = 20;
      el.current = 24;
      await el.updateComplete;
      el.mode = 'off';
      await el.updateComplete;
      await nextFrame();
      expect((el as any)._wipeFrom).to.equal(null);
      expect(el.shadowRoot!.querySelector('path.value.wipe-value')).to.equal(null);
    });

    it('does not start a wipe when mode does not change', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.value = 20;
      el.current = 24;
      el.min = 10;
      el.max = 30;
      await el.updateComplete;
      // touch a non-mode property -> updated() returns early (no wipe)
      el.value = 21;
      await el.updateComplete;
      expect((el as any)._wipeFrom).to.equal(null);
    });

    it('_runWipe early-returns (clears _wipeFrom) when there is no segment', async () => {
      const el = await mount();
      el.mode = 'off'; // showSeg false -> no .value:not(.wipe-value) usable / no overlay
      await el.updateComplete;
      (el as any)._wipeFrom = climateModeColor('cool');
      (el as any)._runWipe();
      // early-return path sets _wipeFrom back to null
      expect((el as any)._wipeFrom).to.equal(null);
    });

    it('_runWipe early-returns when segment length is zero', async () => {
      const el = await mount();
      // colored mode but value === current so the segment has zero length.
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.value = 20;
      el.current = 20; // segE - segS === 0 -> dashArray "0 1000"
      (el as any)._wipeFrom = climateModeColor('heat');
      await el.updateComplete;
      await nextFrame();
      (el as any)._runWipe();
      expect((el as any)._wipeFrom).to.equal(null);
    });
  });

  describe('accessibility attributes', () => {
    it('exposes role=slider with min/max/now and tabindex 0 when enabled', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.value = 22;
      await el.updateComplete;
      const svg = el.shadowRoot!.querySelector('svg')!;
      expect(svg.getAttribute('role')).to.equal('slider');
      expect(svg.getAttribute('aria-valuemin')).to.equal('10');
      expect(svg.getAttribute('aria-valuemax')).to.equal('30');
      expect(svg.getAttribute('aria-valuenow')).to.equal('22');
      expect(svg.getAttribute('tabindex')).to.equal('0');
    });

    it('tabindex is -1 when disabled and aria-valuenow uses high in dual mode', async () => {
      const el = await mount();
      el.disabled = true;
      el.dual = true;
      el.highValue = 24;
      el.lowValue = 18;
      await el.updateComplete;
      const svg = el.shadowRoot!.querySelector('svg')!;
      expect(svg.getAttribute('tabindex')).to.equal('-1');
      expect(svg.getAttribute('aria-valuenow')).to.equal('24');
    });
  });

  // ---------------------------------------------------------------------------
  // heat_cool (dual) + demand-direction behavior
  // ---------------------------------------------------------------------------

  describe('_dualActive getter (dual demand direction)', () => {
    it("is 'cool' when current is above the high setpoint", async () => {
      const el = await mount();
      el.dual = true;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 28;
      await el.updateComplete;
      expect((el as any)._dualActive).to.equal('cool');
    });

    it("is 'heat' when current is below the low setpoint", async () => {
      const el = await mount();
      el.dual = true;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 14;
      await el.updateComplete;
      expect((el as any)._dualActive).to.equal('heat');
    });

    it('is null when current is within the range', async () => {
      const el = await mount();
      el.dual = true;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 21;
      await el.updateComplete;
      expect((el as any)._dualActive).to.equal(null);
    });

    it('is null when current is undefined', async () => {
      const el = await mount();
      el.dual = true;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = undefined;
      await el.updateComplete;
      expect((el as any)._dualActive).to.equal(null);
    });

    it('is null when not in dual mode (even if current would be out of range)', async () => {
      const el = await mount();
      el.dual = false;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 28;
      await el.updateComplete;
      expect((el as any)._dualActive).to.equal(null);
    });

    it("honours an active 'cool' mode over the in-band geometry", async () => {
      // The unit reports it's cooling (hvac_action → mode 'cool') while the temp
      // sits inside the band; the dial must show cooling, not idle.
      const el = await mount();
      el.dual = true;
      el.mode = 'cool';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 21; // within band → geometry alone would say idle (null)
      await el.updateComplete;
      expect((el as any)._dualActive).to.equal('cool');
      expect((el as any)._effectiveMode).to.equal('cool');
      expect((el as any)._dialColor).to.equal(climateModeColor('cool'));
    });

    it("honours an active 'heat' mode over the in-band geometry", async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 21;
      await el.updateComplete;
      expect((el as any)._dualActive).to.equal('heat');
      expect((el as any)._effectiveMode).to.equal('heat');
    });

    it("falls back to geometry when the mode carries no action (idle 'heat_cool')", async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 28; // above high → geometry says cooling
      await el.updateComplete;
      expect((el as any)._dualActive).to.equal('cool');
    });
  });

  describe('_demandSensible getter (single-mode demand direction)', () => {
    it("cool: true when current is above the setpoint, false when below/equal", async () => {
      const el = await mount();
      el.mode = 'cool';
      el.value = 22;
      el.current = 26;
      await el.updateComplete;
      expect((el as any)._demandSensible).to.be.true;
      el.current = 20;
      await el.updateComplete;
      expect((el as any)._demandSensible).to.be.false;
    });

    it('heat: true when current is below the setpoint, false when above/equal', async () => {
      const el = await mount();
      el.mode = 'heat';
      el.value = 22;
      el.current = 20;
      await el.updateComplete;
      expect((el as any)._demandSensible).to.be.true;
      el.current = 26;
      await el.updateComplete;
      expect((el as any)._demandSensible).to.be.false;
    });

    it('auto/dry/fan_only always sensible (keep their own color)', async () => {
      const el = await mount();
      el.value = 22;
      el.current = 20;
      for (const mode of ['auto', 'dry', 'fan_only']) {
        el.mode = mode;
        await el.updateComplete;
        expect((el as any)._demandSensible, mode).to.be.true;
        // direction the other way too
        el.current = 26;
        await el.updateComplete;
        expect((el as any)._demandSensible, mode).to.be.true;
        el.current = 20;
        await el.updateComplete;
      }
    });

    it('false when current is null/undefined', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.value = 22;
      el.current = undefined;
      await el.updateComplete;
      expect((el as any)._demandSensible).to.be.false;
    });
  });

  describe('_effectiveMode / _dialColor (dual)', () => {
    it('dual cooling uses the cool color', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 28; // above high -> cooling
      await el.updateComplete;
      expect((el as any)._effectiveMode).to.equal('cool');
      expect((el as any)._dialColor).to.equal(climateModeColor('cool'));
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      expect(dial.getAttribute('style')).to.contain(climateModeColor('cool'));
    });

    it('dual heating uses the heat color', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 14; // below low -> heating
      await el.updateComplete;
      expect((el as any)._effectiveMode).to.equal('heat');
      expect((el as any)._dialColor).to.equal(climateModeColor('heat'));
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      expect(dial.getAttribute('style')).to.contain(climateModeColor('heat'));
    });

    it('dual idle (in range) uses the heat_cool color', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 21; // in range -> idle
      await el.updateComplete;
      expect((el as any)._effectiveMode).to.equal('heat_cool');
      expect((el as any)._dialColor).to.equal(climateModeColor('heat_cool'));
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      expect(dial.getAttribute('style')).to.contain(climateModeColor('heat_cool'));
    });
  });

  describe('dual segment rendering', () => {
    it('idle (current in range): green range band, demand band faded out', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 21;
      await el.updateComplete;
      const sr = el.shadowRoot!;
      // both bands always present (so they cross-fade); demand hidden when idle
      const range = sr.querySelector('.value.range') as SVGElement;
      const demand = sr.querySelector('.value.demand') as SVGElement;
      expect(range).to.not.equal(null);
      expect(demand).to.not.equal(null);
      const rangeStyle = range.getAttribute('style')!;
      expect(rangeStyle).to.contain(`stroke:${climateModeColor('heat_cool')}`);
      expect(rangeStyle).to.contain('opacity:1;');
      expect(demand.getAttribute('style')).to.contain('opacity:0;');
      expect(sr.querySelector('.wipe-value')).to.equal(null);
    });

    it('cooling (current above high): muted gray range + visible cool demand band', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 28;
      await el.updateComplete;
      const sr = el.shadowRoot!;
      const range = sr.querySelector('.value.range') as SVGElement;
      const demand = sr.querySelector('.value.demand') as SVGElement;
      expect(range.getAttribute('style')).to.contain(`stroke:${IDLE_COLOR}`);
      expect(range.getAttribute('style')).to.contain('opacity:0.5;');
      expect(demand.getAttribute('style')).to.contain(`stroke:${climateModeColor('cool')}`);
      expect(demand.getAttribute('style')).to.contain('opacity:1;');
    });

    it('heating (current below low): muted gray range + visible heat demand band', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 14;
      await el.updateComplete;
      const sr = el.shadowRoot!;
      const range = sr.querySelector('.value.range') as SVGElement;
      const demand = sr.querySelector('.value.demand') as SVGElement;
      expect(range.getAttribute('style')).to.contain(`stroke:${IDLE_COLOR}`);
      expect(demand.getAttribute('style')).to.contain(`stroke:${climateModeColor('heat')}`);
      expect(demand.getAttribute('style')).to.contain('opacity:1;');
    });

    // The demand band must stay in the DOM across the heat/idle/cool transition
    // so it can cross-fade (opacity) instead of popping out.
    it('keeps both .value paths across an active -> idle change (persistent for crossfade)', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 28; // cooling
      await el.updateComplete;
      expect(el.shadowRoot!.querySelectorAll('.value').length).to.equal(2);
      el.current = 21; // -> idle; demand fades but stays in the DOM
      await el.updateComplete;
      expect(el.shadowRoot!.querySelectorAll('.value').length).to.equal(2);
      expect(el.shadowRoot!.querySelector('.value.demand')!.getAttribute('style')).to.contain(
        'opacity:0;'
      );
    });
  });

  describe('single-mode gray demand (direction makes no sense)', () => {
    it("cool: not cooling (current below setpoint) -> the .value stroke is the idle gray", async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.value = 22;
      el.current = 20; // not above setpoint -> not sensible
      await el.updateComplete;
      const value = el.shadowRoot!.querySelector('path.value') as SVGPathElement;
      const style = value.getAttribute('style')!;
      expect(style).to.contain(`stroke:${IDLE_COLOR}`);
      expect(style).to.not.contain(climateModeColor('cool'));
    });

    it('cool: cooling (current above setpoint) -> the .value stroke is the cool color', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.value = 22;
      el.current = 26; // above setpoint -> sensible
      await el.updateComplete;
      const value = el.shadowRoot!.querySelector('path.value') as SVGPathElement;
      expect(value.getAttribute('style')).to.contain(`stroke:${climateModeColor('cool')}`);
    });

    it('heat: not heating (current above setpoint) -> the .value stroke is the idle gray', async () => {
      const el = await mount();
      el.mode = 'heat';
      el.min = 10;
      el.max = 30;
      el.value = 22;
      el.current = 26; // not below setpoint -> not sensible
      await el.updateComplete;
      const value = el.shadowRoot!.querySelector('path.value') as SVGPathElement;
      const style = value.getAttribute('style')!;
      expect(style).to.contain(`stroke:${IDLE_COLOR}`);
      expect(style).to.not.contain(climateModeColor('heat'));
    });

    it('heat: heating (current below setpoint) -> the .value stroke is the heat color', async () => {
      const el = await mount();
      el.mode = 'heat';
      el.min = 10;
      el.max = 30;
      el.value = 22;
      el.current = 20; // below setpoint -> sensible
      await el.updateComplete;
      const value = el.shadowRoot!.querySelector('path.value') as SVGPathElement;
      expect(value.getAttribute('style')).to.contain(`stroke:${climateModeColor('heat')}`);
    });

    // The gray demand only recolors the SEGMENT — the halo / ring / big number
    // (driven by --dial-color) must stay the mode color (the user's explicit
    // requirement). And this gray-when-no-sense is single-setpoint ONLY.
    it('not-heating keeps the halo (--dial-color) at the heat color, only the segment grays', async () => {
      const el = await mount();
      el.mode = 'heat';
      el.min = 10;
      el.max = 30;
      el.value = 23;
      el.current = 24; // heater at 23, room 24 -> not heating
      await el.updateComplete;
      const seg = el.shadowRoot!.querySelector('path.value') as SVGPathElement;
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      expect(seg.getAttribute('style')).to.contain(`stroke:${IDLE_COLOR}`);
      expect(dial.getAttribute('style')).to.contain(`--dial-color: ${climateModeColor('heat')}`);
    });

    it('not-cooling keeps the halo (--dial-color) at the cool color, only the segment grays', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.value = 21;
      el.current = 20; // cooler at 21, room 20 -> not cooling
      await el.updateComplete;
      const seg = el.shadowRoot!.querySelector('path.value') as SVGPathElement;
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      expect(seg.getAttribute('style')).to.contain(`stroke:${IDLE_COLOR}`);
      expect(dial.getAttribute('style')).to.contain(`--dial-color: ${climateModeColor('cool')}`);
    });
  });

  describe('dual center readout (_renderDualCenter / _showRange)', () => {
    it('fresh mount cooling collapses to the high setpoint only (no mode label)', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.modeLabel = 'Heat/Cool';
      el.step = 0.5;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 28; // cooling
      await el.updateComplete;
      const sr = el.shadowRoot!;
      // No Cooling/Heating label (the chips show the mode, à la Google Home).
      expect(sr.querySelector('.center .mode')).to.equal(null);
      // collapsed: a single value-text, no dual range, no dash
      const texts = sr.querySelectorAll('.center .value-text');
      expect(texts.length).to.equal(1);
      expect(texts[0].textContent!.trim()).to.equal('24.0'); // the high setpoint
      expect(sr.querySelector('.temp.dual')).to.equal(null);
      expect(sr.querySelector('.dash')).to.equal(null);
    });

    it('fresh mount heating collapses to the low setpoint only (no mode label)', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.modeLabel = 'Heat/Cool';
      el.step = 0.5;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 14; // heating
      await el.updateComplete;
      const sr = el.shadowRoot!;
      expect(sr.querySelector('.center .mode')).to.equal(null);
      const texts = sr.querySelectorAll('.center .value-text');
      expect(texts.length).to.equal(1);
      expect(texts[0].textContent!.trim()).to.equal('18.0'); // the low setpoint
      expect(sr.querySelector('.temp.dual')).to.equal(null);
      expect(sr.querySelector('.dash')).to.equal(null);
    });

    it('idle (current in range) shows the range: low – high with a dash, no mode label', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.modeLabel = 'Heat/Cool';
      el.step = 0.5;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 21; // idle
      await el.updateComplete;
      const sr = el.shadowRoot!;
      // No mode label in the range readout when enabled (chips show the mode).
      expect(sr.querySelector('.center .mode')).to.equal(null);
      const dual = sr.querySelector('.temp.dual');
      expect(dual).to.not.equal(null);
      const texts = dual!.querySelectorAll('.value-text');
      expect(texts.length).to.equal(2);
      expect(texts[0].textContent!.trim()).to.equal('18.0');
      expect(texts[1].textContent!.trim()).to.equal('24.0');
      expect(dual!.querySelector('.dash')!.textContent!.trim()).to.equal('–');
    });

    it('the idle (settled) range is compact; dragging emphasizes it', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.step = 0.5;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 21; // idle -> range, settled (no drag, no recent change)
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.temp.dual.settled')).to.not.equal(null);

      // While dragging the range is emphasized (not settled).
      (el as any)._dragging = true;
      (el as any)._dragLow = 18;
      (el as any)._dragHigh = 24;
      el.requestUpdate();
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.temp.dual')).to.not.equal(null);
      expect(el.shadowRoot!.querySelector('.temp.dual.settled')).to.equal(null);
    });

    it('dragging with an active sub-mode shows the range (not collapsed)', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.modeLabel = 'Heat/Cool';
      el.step = 0.5;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 28; // cooling -> would collapse if not dragging
      await el.updateComplete;
      // sanity: collapsed before dragging
      expect(el.shadowRoot!.querySelector('.temp.dual')).to.equal(null);

      (el as any)._dragging = true;
      (el as any)._dragLow = 18;
      (el as any)._dragHigh = 24;
      el.requestUpdate();
      await el.updateComplete;
      const sr = el.shadowRoot!;
      expect(sr.querySelector('.temp.dual')).to.not.equal(null);
      expect(sr.querySelector('.dash')).to.not.equal(null);
    });

    // The collapsed readout (after the 5s range window) shows the active
    // sub-mode's icon AT THE TARGETED SETPOINT MARKER (like single mode), NOT in
    // the centre text.
    it('collapsed cooling shows the cool mode icon at the active setpoint marker', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 28; // cooling -> collapsed
      await el.updateComplete;
      const sr = el.shadowRoot!;
      const icon = sr.querySelector('.markers ha-icon.mode-icon');
      expect(icon).to.not.equal(null);
      expect(icon!.getAttribute('icon')).to.equal(HVAC_MODE_ICONS['cool']);
      // not in the centre
      expect(sr.querySelector('.center ha-icon')).to.equal(null);
    });

    it('collapsed heating shows the heat mode icon at the active setpoint marker', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 14; // heating -> collapsed
      await el.updateComplete;
      const sr = el.shadowRoot!;
      const icon = sr.querySelector('.markers ha-icon.mode-icon');
      expect(icon).to.not.equal(null);
      expect(icon!.getAttribute('icon')).to.equal(HVAC_MODE_ICONS['heat']);
      expect(sr.querySelector('.center ha-icon')).to.equal(null);
    });

    it('the range readout has no marker mode icon (both setpoints show numbers)', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 21; // idle -> range
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.markers ha-icon.mode-icon')).to.equal(null);
    });

    // show_current_as_primary should also apply to the collapsed heat_cool readout.
    it('show_current_as_primary: collapsed dual shows the current temp as the big number', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.step = 0.5;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 28; // cooling -> collapsed (target would be 24)
      el.showCurrentAsPrimary = true;
      await el.updateComplete;
      const sr = el.shadowRoot!;
      expect(sr.querySelector('.center .mode')).to.equal(null);
      expect(sr.querySelector('.center .value-text')!.textContent!.trim()).to.equal('28.0');
    });

    it('show_current_as_primary: dual keeps both setpoint numbers and an unlabeled current dot', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.step = 0.5;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 28; // cooling -> would normally collapse the high setpoint to an icon
      el.showCurrentAsPrimary = true;
      await el.updateComplete;
      const sr = el.shadowRoot!;
      // no mode icon replaces a setpoint number; both setpoints show their values
      expect(sr.querySelector('.markers ha-icon.mode-icon')).to.equal(null);
      const labels = [...sr.querySelectorAll('.markers .o-label .num')].map((n) =>
        n.textContent!.trim()
      );
      expect(labels).to.include('18°');
      expect(labels).to.include('24°');
      // current dot drawn but unlabeled (it's the big centre number)
      expect(sr.querySelector('.o-dot.current')).to.not.equal(null);
      expect(sr.querySelector('.num.current')).to.equal(null);
    });

    it('without show_current_as_primary: collapsed dual shows the targeted setpoint', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.step = 0.5;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 28; // cooling -> target is the high setpoint (24)
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.center .value-text')!.textContent!.trim()).to.equal(
        '24.0'
      );
    });
  });

  describe('_centerTight (centre-readout crowding guard)', () => {
    it('dual: true when a setpoint sits near 3 o\'clock (≈90°)', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.min = 7;
      el.max = 35;
      el.lowValue = 30.4; // ≈90°
      el.highValue = 31.4;
      el.current = 28.9;
      await el.updateComplete;
      expect((el as any)._centerTight).to.be.true;
      expect(el.shadowRoot!.querySelector('.center.tight')).to.not.equal(null);
    });

    it('dual: false when the setpoints + current are away from the horizontal axis', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.min = 7;
      el.max = 35;
      el.lowValue = 16;
      el.highValue = 24;
      el.current = 21;
      await el.updateComplete;
      expect((el as any)._centerTight).to.be.false;
      expect(el.shadowRoot!.querySelector('.center.tight')).to.equal(null);
    });

    it('single: true when a marker is near the axis AND the number is wide ("24.0")', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 7;
      el.max = 35;
      el.step = 0.5; // setpoint renders as "24.0" — 4 chars, wide
      el.value = 24;
      el.current = 30; // ≈90°
      await el.updateComplete;
      expect((el as any)._centerTight).to.be.true;
    });

    it('single: false when a marker is near the axis but the number is short ("24")', async () => {
      // The root cause of the per-card size differences: a short setpoint must
      // NOT shrink just because the current marker happens to sit near 3 o'clock.
      const el = await mount();
      el.mode = 'cool';
      el.min = 7;
      el.max = 35;
      el.step = 1; // setpoint renders as "24" — 2 chars
      el.value = 24;
      el.current = 30; // ≈90°
      await el.updateComplete;
      expect((el as any)._centerTight).to.be.false;
    });

    it('single: true with show_current_as_primary when the current readout is wide', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 7;
      el.max = 35;
      el.value = 30; // setpoint marker ≈90°
      el.current = 26.4; // big number "26.4" — wide
      el.showCurrentAsPrimary = true;
      await el.updateComplete;
      expect((el as any)._centerTight).to.be.true;
    });

    it('single: with show_current_as_primary but no current falls back to the setpoint width', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 7;
      el.max = 35;
      el.step = 0.5; // setpoint "30.0" — wide
      el.value = 30; // ≈90°, becomes the big number (no current)
      el.current = undefined;
      el.showCurrentAsPrimary = true;
      await el.updateComplete;
      expect((el as any)._centerTight).to.be.true;
    });

    it('single: false when there is no current temperature', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.value = 24;
      el.current = undefined;
      await el.updateComplete;
      expect((el as any)._centerTight).to.be.false;
    });
  });

  describe('5s range timer (_bumpRangeDisplay / _showRangeTimer / updated)', () => {
    let clock: sinon.SinonFakeTimers | undefined;

    afterEach(() => {
      clock?.restore();
      clock = undefined;
    });

    /** Install fake timers AFTER the element is mounted/settled so Lit's
     * microtask-driven `updateComplete` keeps flowing (only fake set/clearTimeout). */
    function fakeTimers(): void {
      clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    }

    it('initial setpoint set does NOT trigger the range timer', async () => {
      const el = await mount();
      fakeTimers();
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 28; // cooling
      await el.updateComplete;
      // first set -> _prevLow/_prevHigh guard skips the bump
      expect((el as any)._showRangeTimer).to.be.false;
      // and the readout is collapsed (no range)
      expect(el.shadowRoot!.querySelector('.temp.dual')).to.equal(null);
    });

    it('changing a setpoint shows the range, then collapses after 5s', async () => {
      const el = await mount();
      fakeTimers();
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 28; // cooling -> collapsed
      await el.updateComplete;
      expect((el as any)._showRangeTimer).to.be.false;
      // collapsed (single number, no range), and no Cooling/Heating label
      expect(el.shadowRoot!.querySelector('.temp.dual')).to.equal(null);
      expect(el.shadowRoot!.querySelector('.center .mode')).to.equal(null);

      // change a setpoint -> bump the timer + show the range. The bump happens in
      // updated() (this cycle), scheduling a follow-up render, so settle twice.
      el.highValue = 25;
      await el.updateComplete;
      expect((el as any)._showRangeTimer).to.be.true;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.temp.dual')).to.not.equal(null);

      // after 5s -> collapse back to the active sub-mode (timer callback sets the
      // state and schedules another update).
      clock!.tick(5000);
      await el.updateComplete;
      expect((el as any)._showRangeTimer).to.be.false;
      expect(el.shadowRoot!.querySelector('.temp.dual')).to.equal(null);
      expect(el.shadowRoot!.querySelector('.center .mode')).to.equal(null);
    });
  });

  describe('disconnectedCallback clears the range timer', () => {
    let clock: sinon.SinonFakeTimers | undefined;

    afterEach(() => {
      clock?.restore();
      clock = undefined;
    });

    it('clearing the timer on removal does not throw when time advances past 5s', async () => {
      const el = await mount();
      clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const clearSpy = sinon.spy(window, 'clearTimeout');
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 28;
      await el.updateComplete;
      // bump the timer
      el.highValue = 25;
      await el.updateComplete;
      expect((el as any)._showRangeTimer).to.be.true;

      el.remove(); // triggers disconnectedCallback -> clearTimeout(this._rangeTimer)
      expect(clearSpy.called).to.be.true;
      // advancing past the deadline must not fire/throw (timer was cleared)
      expect(() => clock!.tick(6000)).to.not.throw();
      clearSpy.restore();
    });
  });

  describe('updated() skips the wipe for dual mode', () => {
    it('switching a dual dial mode between colored values creates no .wipe-value overlay', async () => {
      const el = await mount();
      el.dual = true;
      el.mode = 'heat_cool';
      el.min = 10;
      el.max = 30;
      el.lowValue = 18;
      el.highValue = 24;
      el.current = 21;
      await el.updateComplete;

      el.mode = 'cool';
      await el.updateComplete;
      await nextFrame();
      expect((el as any)._wipeFrom).to.equal(null);
      expect(el.shadowRoot!.querySelector('.wipe-value')).to.equal(null);
    });
  });
});
