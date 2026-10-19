/* eslint-disable @typescript-eslint/no-unused-expressions -- Chai property assertions execute through getters. */
import { fixture, html, expect, aTimeout, nextFrame } from '@open-wc/testing';
import sinon from 'sinon';
import { oncePromise, captureEvents } from '../helpers';
import '../../src/dial/circular-dial';
import { MtCircularDial } from '../../src/dial/circular-dial';
import { climateModeColor, HVAC_MODE_ICONS } from '../../src/theme';

/** The neutral gray used for an idle range / a demand that makes no sense. */
const IDLE_COLOR = 'var(--mt-on-surface-variant)';

/** Geometry constants mirrored from src/dial/circular-dial.ts. */
const VIEW = 320;
const RADIUS = 130;
const ARC_START = 207;
const SWEEP = 306;

/**
 * Make a fixture wide enough that the SVG has a real, non-zero bounding box so
 * pointer/geometry math is exercised against actual layout.
 * @param _attrs lit template for the element
 */
async function mount(
  _attrs = html``
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

/**
 * Check measured support and the resulting CSS radius against untransformed layout boxes.
 * @param el dial under test
 * @param label upright orbit label
 * @param edge inner band radius in viewBox units
 */
function expectLabelGap(el: MtCircularDial, label: Element, edge: number): void {
  const scale = el.shadowRoot!.querySelector<HTMLElement>('.dial')!.offsetWidth / VIEW;
  const layout = label as HTMLElement;
  const cx = layout.offsetWidth / 2;
  const cy = layout.offsetHeight / 2;
  const rects = [{ left: 0, top: 0, right: layout.offsetWidth, bottom: layout.offsetHeight },
    ...[...label.querySelectorAll<HTMLElement>('sup, .mode-icon.inline')].map(child => {
      let left = 0;
      let top = child.classList.contains('inline') ? -child.offsetHeight / 2 : 0;
      for (let node = child; node !== label; node = node.offsetParent as HTMLElement) {
        left += node.offsetLeft;
        top += node.offsetTop;
      }
      return { left, top, right: left + child.offsetWidth, bottom: top + child.offsetHeight };
    })];
  const angle = Number(label.getAttribute('data-angle')) * Math.PI / 180;
  const ux = Math.sin(angle);
  const uy = -Math.cos(angle);
  // The contract uses the enclosing union rectangle, including corners that
  // belong to neither the integer nor the out-of-flow superscript/icon alone.
  const left = Math.min(...rects.map(rect => rect.left));
  const right = Math.max(...rects.map(rect => rect.right));
  const top = Math.min(...rects.map(rect => rect.top));
  const bottom = Math.max(...rects.map(rect => rect.bottom));
  const support = Math.max(...[left, right].flatMap(x =>
    [top, bottom].map(y => ((x - cx) * ux + (y - cy) * uy) / scale)
  ));
  const style = getComputedStyle(label);
  expect(parseFloat(style.getPropertyValue('--s'))).to.be.closeTo(support, 0.05);
  expect(parseFloat(style.top) / scale).to.be.closeTo(160 - edge + 5.5 + support, 0.05);
}

describe('mt-circular-dial', () => {
  describe('stock parity', () => {
    it('suppresses in-flight drag events when switched to readonly', async () => {
      const el = await mount();
      const { svg, cx, cy, scale } = svgGeometry(el);
      stubCapture(svg);
      svg.dispatchEvent(new PointerEvent('pointerdown', { clientX: cx, clientY: cy - RADIUS * scale }));
      el.readonly = true;
      await el.updateComplete;
      const changed = sinon.spy();
      el.addEventListener('value-changing', changed);
      el.addEventListener('value-changed', changed);
      svg.dispatchEvent(new PointerEvent('pointermove', { clientX: cx, clientY: cy - RADIUS * scale }));
      svg.dispatchEvent(new PointerEvent('pointerup'));
      expect(changed.called).to.be.false;
    });

    it('localizes separator-bearing readouts and accessible text, not superscript numbers', async () => {
      const el = await mount();
      el.formatNumber = (v, d) => v.toFixed(d).replace('.', ',');
      el.value = 21.5;
      el.current = 19.5;
      await el.updateComplete;
      const centre = el.shadowRoot!.querySelector('.value-text')!;
      expect([...centre.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join('')).to.equal('21');
      expect(centre.querySelector('sup')!.textContent).to.equal('5');
      const label = el.shadowRoot!.querySelector('.label-number')!;
      expect(label.textContent).to.equal('195');
      expect(label.querySelector('sup')!.textContent).to.equal('5');
      expect(el.shadowRoot!.querySelector('.o-label .sr-only')!.textContent).to.equal('Current 19,5 °C');
      expect(el.shadowRoot!.querySelector('.center .sr-only')!.textContent).to.equal('Target temperature 21,5 °C');
      expect(el.shadowRoot!.querySelector('[role="slider"]')!.getAttribute('aria-valuetext')).to.equal('21,5 °C');
      el.showCurrentAsPrimary = true;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.value-text')!.textContent).to.equal('195');
      expect(el.shadowRoot!.querySelector('.value-text sup')!.textContent).to.equal('5');
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18.5;
      el.highValue = 24.5;
      await el.updateComplete;
      expect([...el.shadowRoot!.querySelectorAll('.secondary .value-text')].map(n => n.textContent)).to.deep.equal(['18,5', '24,5']);
      expect([...el.shadowRoot!.querySelectorAll('[role="slider"]')].map(n => n.getAttribute('aria-valuetext'))).to.deep.equal(['18,5 °C', '24,5 °C']);
      el.showCurrentAsPrimary = false;
      await el.updateComplete;
      expect([...el.shadowRoot!.querySelectorAll('.center .value-text')].map(n => n.textContent)).to.deep.equal(['18,5', '24,5']);
      el.current = 28.5;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.center .value-text')!.textContent).to.equal('24,5');
    });

    for (const value of [21.5, 21, 21.0]) {
      it(`preserves visible centre and orbit markup with a formatter for ${value}`, async () => {
        const el = await mount();
        el.value = value;
        el.current = value;
        await el.updateComplete;
        const visibleMarkup = (): string[] => ['.value-text', '.label-number'].map(selector =>
          el.shadowRoot!.querySelector(selector)!.innerHTML
        );
        const original = visibleMarkup();
        el.formatNumber = (v, d) => v.toFixed(d).replace('.', ',');
        await el.updateComplete;
        expect(visibleMarkup()).to.deep.equal(original);
        const centre = el.shadowRoot!.querySelector('.value-text')!;
        expect(centre.textContent).to.equal(value === 21.5 ? '215' : '21');
        expect(centre.querySelector('sup')?.textContent ?? null).to.equal(value === 21.5 ? '5' : null);
      });
    }

    it('shows the enabled state label without replacing unavailable status', async () => {
      const el = await mount();
      el.stateLabel = 'Heating';
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.mode')!.textContent).to.equal('Heating');
      el.stateLabel = '';
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.mode')).to.equal(null);
      el.stateLabel = 'Heating';
      el.disabled = true;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.mode')).to.equal(null);
      el.modeLabel = 'Unavailable';
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.mode')!.textContent).to.equal('Unavailable');
    });

    for (const dual of [false, true]) {
      it(`renders an inert current-only dial (dual=${dual})`, async () => {
        const el = await mount();
        el.dual = dual;
        el.readonly = true;
        el.mode = 'heat';
        el.current = 21.5;
        await el.updateComplete;
        const root = el.shadowRoot!;
        expect(root.querySelector('.value-text')!.textContent).to.equal('215');
        expect(root.querySelector('.dial')!.classList.contains('dual')).to.be.false;
        expect(getComputedStyle(root.querySelector('.value-text')!).position).to.equal('relative');
        expect(root.querySelector('.step, .handle, .setpoint, path.value, [role="slider"]')).to.equal(null);
        const changed = sinon.spy();
        el.addEventListener('value-changed', changed);
        el.addEventListener('value-changing', changed);
        const svg = root.querySelector('svg')!;
        svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
        svg.dispatchEvent(new PointerEvent('pointerdown'));
        svg.dispatchEvent(new PointerEvent('pointermove'));
        svg.dispatchEvent(new PointerEvent('pointerup'));
        svg.dispatchEvent(new PointerEvent('pointercancel'));
        (el as any)._onHandlePointerDown(new PointerEvent('pointerdown'), null);
        (el as any)._step(1);
        expect(changed.called).to.be.false;
        el.current = undefined;
        await el.updateComplete;
        expect(root.querySelector('.value-text')!.textContent).to.equal('—');
      });
    }

    for (const [key, expected] of [['PageUp', 26], ['PageDown', 16], ['Home', 7], ['End', 35]] as const) {
      it(`handles single ${key}`, async () => {
        const el = await mount();
        el.value = 21;
        await el.updateComplete;
        const changed = sinon.spy();
        el.addEventListener('value-changed', changed);
        el.shadowRoot!.querySelector('[role="slider"]')!.dispatchEvent(new KeyboardEvent('keydown', { key }));
        expect(changed.firstCall.args[0].detail).to.deep.equal({ value: expected });
      });
    }

    for (const side of ['low', 'high'] as const) {
      for (const key of ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'PageUp', 'PageDown', 'Home', 'End', 'Enter']) {
        it(`handles dual ${side} ${key} independently`, async () => {
          const el = await mount();
          el.dual = true;
          el.lowValue = 18;
          el.highValue = 24;
          await el.updateComplete;
          const sliders = el.shadowRoot!.querySelectorAll<HTMLElement>('[role="slider"]');
          expect(sliders.length).to.equal(2);
          const slider = sliders[side === 'low' ? 0 : 1];
          expect(slider.tabIndex).to.equal(0);
          expect(slider.getAttribute('aria-label')).to.equal(`${side === 'low' ? 'Low' : 'High'} target temperature`);
          expect(slider.getAttribute('aria-valuenow')).to.equal(side === 'low' ? '18' : '24');
          expect(slider.getAttribute('aria-valuemin')).to.equal(side === 'low' ? '7' : '18.5');
          expect(slider.getAttribute('aria-valuemax')).to.equal(side === 'low' ? '23.5' : '35');
          const changing = sinon.spy();
          const changed = sinon.spy();
          el.addEventListener('value-changing', changing);
          el.addEventListener('value-changed', changed);
          const ev = new KeyboardEvent('keydown', { key, cancelable: true });
          slider.dispatchEvent(ev);
          if (key === 'Enter') {
            expect(changed.called).to.be.false;
            expect(ev.defaultPrevented).to.be.false;
          } else {
            const base = side === 'low' ? 18 : 24;
            const raw = key === 'Home' ? 7 : key === 'End' ? 35 : base + (key === 'PageUp' ? 5 : key === 'PageDown' ? -5 : key === 'ArrowUp' || key === 'ArrowRight' ? 0.5 : -0.5);
            const value = side === 'low' ? Math.min(raw, 23.5) : Math.max(raw, 18.5);
            const detail = { low: side === 'low' ? value : 18, high: side === 'high' ? value : 24 };
            expect(changed.firstCall.args[0].detail).to.deep.equal(detail);
            expect(changing.firstCall.args[0].detail).to.deep.equal(detail);
            expect(ev.defaultPrevented).to.be.true;
          }
          el.disabled = true;
          await el.updateComplete;
          changed.resetHistory();
          slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
          expect(slider.tabIndex).to.equal(-1);
          expect(changed.called).to.be.false;
        });
      }
    }
  });
  describe('dial styles and centre typography', () => {
    it('defaults to halo', async () => {
      const el = await mount();
      expect(el.dialStyle).to.equal('halo');
      expect(el.shadowRoot!.querySelector('.dial.style-halo')).to.not.equal(null);
    });

    for (const style of ['halo', 'minimal', 'google', 'unknown'] as const) {
      for (const action of ['heating', 'idle', 'off'] as const) {
        it(`renders ${style} with action ${action}`, async () => {
          const el = await mount();
          el.style.setProperty('--mt-motion-dur', '0s');
          el.dialStyle = style as MtCircularDial['dialStyle'];
          el.mode = 'heat';
          el.hvacAction = action;
          await el.updateComplete;
          const resolved = style === 'unknown' ? 'halo' : style;
          expect(el.shadowRoot!.querySelector(`.dial.style-${resolved}`)).to.not.equal(null);
          const glow = el.shadowRoot!.querySelector('.glow')!;
          expect(getComputedStyle(glow).opacity).to.equal(
            resolved === 'halo' ? (action === 'heating' ? '1' : '0.5') : '0'
          );
          const disc = el.shadowRoot!.querySelector('.disc');
          if (resolved === 'google') {
            expect(disc).to.not.equal(null);
            expect(disc!.namespaceURI).to.equal('http://www.w3.org/2000/svg');
            expect(disc!.getAttribute('cx')).to.equal('160');
            expect(disc!.getAttribute('cy')).to.equal('160');
            expect(disc!.getAttribute('r')).to.equal('148.5');
            expect(disc!.getAttribute('fill')).to.equal('var(--mt-surface-container-high)');
            expect(disc!.nextElementSibling).to.equal(glow);
            expect(getComputedStyle(disc!).pointerEvents).to.equal('none');
          } else {
            expect(disc).to.equal(null);
          }
        });
      }
    }

    for (const showCurrent of [false, true]) {
      for (const [value, integer, fraction] of [
        [21.1, '21', '1'], [21.5, '21', '5'], [22, '22', ''],
        [-1.5, '-1', '5'], [-2, '-2', ''], [-0.5, '-0', '5'],
      ] as const) {
        it(`formats centre ${value} (current primary=${showCurrent})`, async () => {
          const el = await mount();
          el.min = -10;
          el.value = value;
          el.current = value;
          el.step = 0.5;
          el.showCurrentAsPrimary = showCurrent;
          await el.updateComplete;
          const number = el.shadowRoot!.querySelector('.center .value-text')!;
          expect(number.textContent).to.equal(integer + fraction);
          expect(number.closest('[aria-hidden="true"]')).to.not.equal(null);
          const accessible = el.shadowRoot!.querySelector('.center .sr-only')!;
          expect(accessible.textContent).to.equal(
            `${showCurrent ? 'Current' : 'Target'} temperature ${integer}${fraction ? `.${fraction}` : ''} °C`
          );
          expect(accessible.closest('[aria-hidden="true"]')).to.equal(null);
          expect(el.shadowRoot!.querySelector('.center .unit')!.closest('[aria-hidden="true"]')).to.not.equal(null);
          expect([...number.childNodes].filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent).join('')).to.equal(integer);
          const sup = number.querySelector('sup');
          if (fraction) {
            expect(sup!.textContent).to.equal(fraction);
            expect(getComputedStyle(number).position).to.equal('relative');
            expect(getComputedStyle(sup!).position).to.equal('absolute');
            expect(parseFloat(getComputedStyle(sup!).fontSize)).to.be.closeTo(
              parseFloat(getComputedStyle(number).fontSize) * 0.4, 0.01
            );
          } else {
            expect(sup).to.equal(null);
          }
        });
      }
    }

    it('announces the target until a primary current temperature is available', async () => {
      const el = await mount();
      el.showCurrentAsPrimary = true;
      el.current = undefined;
      el.value = 21.5;
      el.step = 0.5;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.center .sr-only')!.textContent)
        .to.equal('Target temperature 21.5 °C');
      expect(el.shadowRoot!.querySelector('.center .value-text')!.textContent).to.equal('215');

      el.current = 21.1;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.center .sr-only')!.textContent)
        .to.equal('Current temperature 21.1 °C');
      expect(el.shadowRoot!.querySelector('.center .value-text')!.textContent).to.equal('211');
    });

    for (const step of [0.01, 1]) {
      it(`uses target precision when the primary current temperature is unavailable (step=${step})`, async () => {
        const el = await mount();
        el.showCurrentAsPrimary = true;
        el.current = undefined;
        el.value = 21.55;
        el.step = step;
        await el.updateComplete;
        expect(el.shadowRoot!.querySelector('.center .sr-only')!.textContent)
          .to.equal(step < 1 ? 'Target temperature 21.6 °C' : 'Target temperature 22 °C');
        expect(el.shadowRoot!.querySelector('.center .value-text')!.textContent)
          .to.equal(step < 1 ? '216' : '22');
        const decimal = el.shadowRoot!.querySelector('.center .value-text sup');
        if (step < 1) {
          expect(decimal!.textContent).to.equal('6');
        } else {
          expect(decimal).to.equal(null);
        }
      });
    }

    it('updates backdrops reactively while off', async () => {
      const el = await mount();
      el.style.setProperty('--mt-motion-dur', '0s');
      for (const style of ['google', 'minimal', 'halo'] as const) {
        el.dialStyle = style;
        await el.updateComplete;
        expect(el.shadowRoot!.querySelector('.dial.off')!.classList.contains(`style-${style}`)).to.be.true;
        expect(getComputedStyle(el.shadowRoot!.querySelector('.glow')!).opacity)
          .to.equal(style === 'halo' ? '0.5' : '0');
        expect(el.shadowRoot!.querySelector('.disc') !== null).to.equal(style === 'google');
      }
    });

    it('uses current precision even when the setpoint step is an integer', async () => {
      const el = await mount();
      el.current = 21.1;
      el.step = 1;
      el.showCurrentAsPrimary = true;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.value-text')!.textContent).to.equal('211');
      expect(el.shadowRoot!.querySelector('.value-text sup')!.textContent).to.equal('1');
    });

    for (const current of [21, 28]) {
      it(`keeps dual decimal readouts unchanged (current=${current})`, async () => {
        const el = await mount();
        el.dual = true;
        el.mode = 'heat_cool';
        el.lowValue = 18.5;
        el.highValue = 24.5;
        el.current = current;
        await el.updateComplete;
        const values = [...el.shadowRoot!.querySelectorAll('.value-text')];
        expect(values.map(value => value.textContent)).to.deep.equal(
          current === 21 ? ['18.5', '24.5'] : ['24.5']
        );
        expect(el.shadowRoot!.querySelector('.value-text sup')).to.equal(null);
      });
    }

    it('preserves step rounding before formatting the centre', async () => {
      const el = await mount();
      el.value = 21.5;
      el.step = 1;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.value-text')!.textContent).to.equal('22');
      expect(el.shadowRoot!.querySelector('.value-text sup')).to.equal(null);
    });

    it('inherits font family and scopes centre weight and axes to custom properties', async () => {
      const cssText = MtCircularDial.styles.map(style => style.cssText).join('\n');
      expect(cssText).not.to.match(/font-family\s*:/);
      expect(cssText.match(/font-variation-settings\s*:[^;]+;/g)).to.deep.equal([
        'font-variation-settings: var(--mt-centre-axes, normal);',
      ]);
      expect(cssText).to.contain('font-weight: var(--mt-centre-weight, 400);');
      expect(cssText).to.contain('font-weight: var(--mt-label-weight, 500);');
      const el = await mount();
      el.style.fontFamily = 'monospace';
      el.style.fontVariationSettings = '"ROND" 25';
      for (const selector of ['.value-text', '.unit', '.step', '.num.current']) {
        el.current = 18;
        await el.updateComplete;
        const style = getComputedStyle(el.shadowRoot!.querySelector(selector)!);
        expect(style.fontFamily).to.equal('monospace');
        expect(style.fontVariationSettings).to.equal(selector === '.value-text' ? 'normal' : '"ROND" 25');
      }
    });
  });

  describe('measured Google presentation', () => {
    for (const dual of [false, true]) {
      for (const mode of ['off', 'heat']) {
        it(`renders without a background disc (dual=${dual}, mode=${mode})`, async () => {
          const el = await mount();
          el.style.setProperty('--mt-motion-dur', '0s');
          el.style.setProperty('--mt-on-surface', 'rgb(237, 225, 212)');
          el.dual = dual;
          el.mode = mode;
          await el.updateComplete;
          expect(el.shadowRoot!.querySelector('.disc')).to.equal(null);
          expect(getComputedStyle(el.shadowRoot!.querySelector('.unit')!).display).to.equal(dual ? 'block' : 'none');
          if (dual || mode === 'off') {
            expect(getComputedStyle(el.shadowRoot!.querySelector('.setpoint')!).backgroundColor).to.equal(getComputedStyle(el).getPropertyValue('--mt-on-surface').trim());
          }
        });
      }
    }

    for (const [value, integer, fraction] of [[22, '22', ''], [20.8, '20', '8'], [-1.5, '-1', '5']] as const) {
      it(`formats orbit label ${value} without a degree sign`, async () => {
        const el = await mount();
        el.min = -10;
        el.value = value;
        el.showCurrentAsPrimary = true;
        await el.updateComplete;
        const label = el.shadowRoot!.querySelector('.o-label .num')!;
        expect(label.querySelector('.label-number')!.textContent).to.equal(integer + fraction);
        expect(label.querySelector('.label-number')!.getAttribute('aria-hidden')).to.equal('true');
        expect(label.querySelector('.sr-only')!.textContent).to.equal(`Target ${value} °C`);
        expect(label.querySelector('sup')?.textContent ?? '').to.equal(fraction);
        const number = label.querySelector('.label-number')!;
        expect([...number.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join('')).to.equal(integer);
      });
    }

    it('exposes current and dual ring labels as plain temperatures with the configured unit', async () => {
      const el = await mount();
      el.style.setProperty('--mt-motion-dur', '0s');
      el.value = 28;
      el.current = 21.1;
      await el.updateComplete;
      const current = el.shadowRoot!.querySelector('.num.current')!;
      expect(current.querySelector('.sr-only')!.textContent).to.equal('Current 21.1 °C');
      expect(current.querySelector('.label-number')!.getAttribute('aria-hidden')).to.equal('true');
      expect(current.querySelector('.sr-only')!.closest('[aria-hidden="true"]')).to.equal(null);
      expect(getComputedStyle(current.querySelector('.sr-only')!).position).to.equal('absolute');

      el.unit = '°F';
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 19;
      el.highValue = 24;
      await el.updateComplete;
      expect([...el.shadowRoot!.querySelectorAll('.o-label .sr-only')].map(node => node.textContent))
        .to.deep.equal(['Low 19 °F', 'High 24 °F', 'Current 21.1 °F']);
      await nextFrame();
      expectLabelGap(el, el.shadowRoot!.querySelector('.o-label')!, 125);
    });

    it('uses the configured unit and rounded precision for accessible centre text', async () => {
      const el = await mount();
      el.unit = '°F';
      el.step = 1;
      el.value = 21.5;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.center .sr-only')!.textContent).to.equal('Target temperature 22 °F');
    });

    for (const scenario of ['current', 'setpoint', 'dual', 'merged'] as const) {
      for (const dragging of [false, true]) {
        it(`centres ${scenario} labels on integer digits only (dragging=${dragging})`, async () => {
          const el = await mount();
          el.style.setProperty('--mt-motion-dur', '0s');
          el.mode = scenario === 'dual' ? 'heat_cool' : 'heat';
          el.dual = scenario === 'dual';
          el.showCurrentAsPrimary = scenario === 'setpoint';
          el.value = scenario === 'current' ? 28 : 21;
          el.current = 21;
          el.lowValue = 21;
          el.highValue = 25;
          Object.assign(el, {
            _dragging: dragging,
            _dragValue: el.value,
            _dragLow: el.lowValue,
            _dragHigh: el.highValue,
          });
          await el.updateComplete;
          await nextFrame();
          const integerBoxes = [...el.shadowRoot!.querySelectorAll('.o-label .num')]
            .map(number => number.closest('.o-label')!.getBoundingClientRect());
          expect(integerBoxes.length).to.equal(scenario === 'dual' ? 3 : 1);

          el.value += 0.1;
          el.current += 0.1;
          el.lowValue += 0.1;
          el.highValue += 0.1;
          Object.assign(el, {
            _dragValue: el.value,
            _dragLow: el.lowValue,
            _dragHigh: el.highValue,
          });
          await el.updateComplete;
          await nextFrame();
          const numbers = [...el.shadowRoot!.querySelectorAll('.o-label .num')];
          numbers.forEach((number, index) => {
            const box = number.closest('.o-label')!.getBoundingClientRect();
            expect(box.width).to.be.closeTo(integerBoxes[index].width, 0.5);
            expect(box.height).to.be.closeTo(integerBoxes[index].height, 0.5);
            expect(getComputedStyle(number.querySelector('sup')!).position).to.equal('absolute');
            const wrapper = number.querySelector('.label-number')!;
            expect(getComputedStyle(wrapper).position).to.equal('relative');
            expect(getComputedStyle(wrapper).display).to.equal('inline-block');
          });
          if (scenario === 'merged') {
            const number = numbers[0];
            const icon = number.querySelector('.mode-icon.inline')!;
            expect(getComputedStyle(icon).position).to.equal('absolute');
            expect(icon.getBoundingClientRect().right).to.be.at.most(
              number.querySelector('.label-number')!.getBoundingClientRect().left
            );
          }
        });
      }
    }

    it('formats fractional dual and merged labels with superscripts', async () => {
      const el = await mount();
      el.mode = 'heat';
      el.value = 20.8;
      el.current = 20.8;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.with-icon sup')!.textContent).to.equal('8');
      el.dual = true;
      el.mode = 'heat_cool';
      el.lowValue = 18.5;
      el.highValue = 24.5;
      await el.updateComplete;
      expect([...el.shadowRoot!.querySelectorAll('.o-label sup')].map(n => n.textContent)).to.deep.equal(['5', '5', '8']);
    });

    it('uses measured orbit number size, position and current colour independently of HA tokens', async () => {
      const el = await mount();
      el.style.setProperty('--mt-motion-dur', '0s');
      el.style.setProperty('--md-sys-typescale-title-medium-size', '12px');
      el.style.setProperty('--mt-on-surface', 'rgb(237, 225, 212)');
      el.style.setProperty('--mt-on-surface-variant', 'rgb(100, 100, 100)');
      el.current = 18;
      await el.updateComplete;
      const number = el.shadowRoot!.querySelector('.num.current')!;
      expect(parseFloat(getComputedStyle(number).fontSize)).to.be.closeTo(15.264, 0.001);
      expect(getComputedStyle(number).fontWeight).to.equal('500');
      expect(getComputedStyle(number).color).to.equal('rgb(237, 225, 212)');
      expectLabelGap(el, number.closest('.o-label')!, 125);
    });

    it('uses the measured single centre size independently of HA display tokens', async () => {
      const el = await mount();
      el.style.setProperty('--md-sys-typescale-display-large-size', '57px');
      const style = getComputedStyle(el.shadowRoot!.querySelector('.value-text')!);
      expect(parseFloat(style.fontSize)).to.be.closeTo(67.84, 0.001);
      expect(style.fontWeight).to.equal('400');
      expect(style.fontVariationSettings).to.equal('normal');
    });

    it('keeps current markers bright and dims off/idle halos', async () => {
      const el = await mount();
      el.style.setProperty('--mt-motion-dur', '0s');
      el.style.setProperty('--mt-on-surface', 'rgb(237, 225, 212)');
      el.mode = 'heat';
      el.current = 18;
      for (const action of ['idle', 'heating', 'off']) {
        el.hvacAction = action;
        await el.updateComplete;
        expect(getComputedStyle(el.shadowRoot!.querySelector('.glow')!).opacity).to.equal(action === 'heating' ? '1' : '0.5');
        const marker = getComputedStyle(el.shadowRoot!.querySelector('.o-dot.current')!);
        expect(marker.opacity).to.equal('1');
        expect(marker.backgroundColor).to.equal('rgb(237, 225, 212)');
        const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
        const light = `color-mix(in srgb, ${climateModeColor('heat')} 20%, var(--mt-on-surface))`;
        expect(dial.style.getPropertyValue('--mode-light')).to.equal(light);
        expect(dial.style.getPropertyValue('--mode-tint')).to.equal(climateModeColor('heat'));
        expect(getComputedStyle(el.shadowRoot!.querySelector('.setpoint')!).backgroundColor).to.equal(getComputedStyle(dial).getPropertyValue('--mode-light').trim());
        expect(getComputedStyle(el.shadowRoot!.querySelector('.mode-icon')!).color).to.equal(getComputedStyle(dial).getPropertyValue('--mode-tint').trim());
      }
      el.mode = 'off';
      await el.updateComplete;
      expect(getComputedStyle(el.shadowRoot!.querySelector('.glow')!).opacity).to.equal('0.5');
    });
  });
  describe('mode icon overrides', () => {
    for (const merged of [false, true]) {
      it(`uses the heat override for a single setpoint (merged=${merged})`, async () => {
        const el = await mount();
        el.style.setProperty('--mt-motion-dur', '0s');
        el.mode = 'heat';
        el.value = 22;
        el.current = merged ? 22 : 14;
        el.modeIcons = { heat: 'mdi:heat-wave' };
        await el.updateComplete;
        const icon = el.shadowRoot!.querySelector('.mode-icon')!;
        expect(icon.getAttribute('icon')).to.equal('mdi:heat-wave');
        expect(icon.classList.contains('inline')).to.equal(merged);
        const label = icon.closest('.o-label')!;
        expect(label.classList.contains('icon-label')).to.equal(!merged);
        expectLabelGap(el, label, 125);
      });
    }

    it('falls back to the built-in heat icon without an override', async () => {
      const el = await mount();
      el.mode = 'heat';
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.mode-icon')!.getAttribute('icon')).to.equal(
        HVAC_MODE_ICONS['heat']
      );
    });

    it('falls back to the generic icon for an unknown mode', async () => {
      const el = await mount();
      const resolver = el as unknown as { _modeIcon(mode: string): string };
      expect(resolver._modeIcon('custom')).to.equal('mdi:thermostat');
    });

    for (const mode of ['heat', 'cool']) {
      it(`uses the ${mode} override for the active dual setpoint`, async () => {
        const el = await mount();
        el.style.setProperty('--mt-motion-dur', '0s');
        el.dual = true;
        el.mode = 'heat_cool';
        el.lowValue = 18;
        el.highValue = 24;
        el.current = mode === 'heat' ? 14 : 28;
        el.modeIcons = { [mode]: 'mdi:heat-wave', heat_cool: 'mdi:thermostat' };
        await el.updateComplete;
        expect(el.shadowRoot!.querySelector('.mode-icon')!.getAttribute('icon')).to.equal(
          'mdi:heat-wave'
        );
        const label = el.shadowRoot!.querySelector('.mode-icon')!.closest('.o-label')!;
        expect(label.classList.contains('icon-label')).to.be.true;
        expectLabelGap(el, label, 125);
      });
    }
  });

  describe('dragging presentation', () => {
    for (const mode of ['cool', 'heat']) {
      it(`measures the icon appearing after off → ${mode}, including late icon layout`, async () => {
        const el = await mount();
        el.style.setProperty('--mt-motion-dur', '0s');
        el.value = 24;
        el.current = 28;
        await el.updateComplete;
        expect(el.shadowRoot!.querySelector('.icon-label')).to.equal(null);
        await nextFrame();
        await nextFrame();
        el.mode = mode;
        await el.updateComplete;
        await nextFrame();
        await nextFrame();
        const label = el.shadowRoot!.querySelector<HTMLElement>('.icon-label')!;
        const icon = label.querySelector<HTMLElement>('ha-icon')!;
        // Simulate ha-icon gaining its SVG after the parent's updated() ran.
        icon.style.cssText = 'display: inline-block; width: 16px; height: 16px';
        await nextFrame();
        await nextFrame();
        expectLabelGap(el, label, 125);
        const angle = Number(label.dataset.angle) * Math.PI / 180;
        const support = (Math.abs(Math.sin(angle)) * label.offsetWidth +
          Math.abs(Math.cos(angle)) * label.offsetHeight) / 2;
        const radius = 160 - parseFloat(getComputedStyle(label).top);
        expect(radius + support).to.be.closeTo(125 - 5.5, 0.5);
        const corners = [-label.offsetWidth / 2, label.offsetWidth / 2].flatMap(x =>
          [-label.offsetHeight / 2, label.offsetHeight / 2].map(y =>
            Math.hypot(radius * Math.sin(angle) + x, -radius * Math.cos(angle) + y)));
        expect(Math.max(...corners)).to.be.closeTo(125 - 5.5, 0.5);
      });
    }

    it('remeasures a numeric label when its content grows without a Lit update', async () => {
      const el = await mount();
      el.style.setProperty('--mt-motion-dur', '0s');
      el.current = 21.1;
      await el.updateComplete;
      await nextFrame();
      await nextFrame();
      const label = el.shadowRoot!.querySelector<HTMLElement>('.o-label')!;
      const before = Number(label.style.getPropertyValue('--s'));
      label.querySelector<HTMLElement>('.num')!.style.fontSize = '30px';
      await nextFrame();
      await nextFrame();
      expect(Number(label.style.getPropertyValue('--s'))).to.be.greaterThan(before + 1);
      expectLabelGap(el, label, 125);
    });

    it('observes late inline icon growth even when the label layout size is unchanged', async () => {
      const el = await mount();
      el.style.setProperty('--mt-motion-dur', '0s');
      el.mode = 'cool';
      el.current = el.value;
      await el.updateComplete;
      const label = el.shadowRoot!.querySelector<HTMLElement>('.o-label')!;
      const icon = label.querySelector<HTMLElement>('ha-icon')!;
      icon.style.cssText = 'display: inline-block; width: 16px; height: 16px';
      await nextFrame();
      await nextFrame();
      const width = label.offsetWidth;
      const before = parseFloat(label.style.getPropertyValue('--s'));
      const update = sinon.spy(el, 'requestUpdate');
      icon.style.width = '40px';
      await nextFrame();
      await nextFrame();
      expect(label.offsetWidth).to.equal(width);
      expect(parseFloat(label.style.getPropertyValue('--s'))).to.be.greaterThan(before + 1);
      expectLabelGap(el, label, 125);
      expect(update.called).to.be.false;
      update.restore();
    });

    it('keeps support independent of label and ancestor animation transforms', async () => {
      const el = await mount();
      el.style.setProperty('--mt-motion-dur', '0s');
      el.mode = 'cool';
      await el.updateComplete;
      const label = el.shadowRoot!.querySelector<HTMLElement>('.icon-label')!;
      label.querySelector<HTMLElement>('ha-icon')!.style.cssText = 'display: inline-block; width: 16px; height: 16px';
      await nextFrame();
      await nextFrame();
      const measure = el as unknown as { _measureLabels(): void };
      measure._measureLabels();
      const before = label.style.getPropertyValue('--s');
      const transform = label.style.transform;
      const animation = label.animate([
        { transform: `${transform} scale(0.2)` },
        { transform: `${transform} scale(1)` },
      ], { duration: 1000, fill: 'both' });
      animation.pause();
      animation.currentTime = 500;
      el.style.transform = 'scale(0.8)';
      measure._measureLabels();
      expect(label.style.getPropertyValue('--s')).to.equal(before);
      animation.cancel();
    });

    for (const scenario of ['fraction', 'integer', 'icon', 'merged', 'dual'] as const) {
      for (const dragging of [false, true]) {
        it(`measures the whole ${scenario} label at its rendered angle (dragging=${dragging})`, async () => {
          const el = await mount();
          el.style.setProperty('--mt-motion-dur', '0s');
          const angle = scenario === 'integer' ? 90 : scenario === 'icon' ? 0 : 50;
          const current = scenario === 'integer' ? 22 : 21.1;
          el.min = current - (angle + 360 - ARC_START) / SWEEP * 30;
          el.max = el.min + 30;
          el.mode = scenario === 'dual' ? 'heat_cool' : 'heat';
          el.dual = scenario === 'dual';
          el.current = scenario === 'icon' ? undefined : current;
          el.value = scenario === 'merged' || scenario === 'icon' ? current : 28;
          el.lowValue = 20.9;
          el.highValue = 21.3;
          Object.assign(el, { _dragging: dragging, _dragValue: el.value, _dragLow: el.lowValue, _dragHigh: el.highValue });
          await el.updateComplete;
          await nextFrame();
          const labels = [...el.shadowRoot!.querySelectorAll<HTMLElement>('.o-label')];
          expect(labels.length).to.equal(scenario === 'dual' ? 3 : scenario === 'merged' || scenario === 'icon' ? 1 : 2);
          const edge = dragging ? 116 : 125;
          for (const label of labels) expectLabelGap(el, label, edge);
          if (scenario === 'dual') {
            expect(labels.some(label => Number(label.dataset.angle) !== ARC_START + (current - el.min) / 30 * SWEEP)).to.be.true;
          } else if (scenario !== 'merged') {
            const label = scenario === 'icon' ? labels[0] : el.shadowRoot!.querySelector('.num.current')!.closest('.o-label')!;
            const rects = [label, ...label.querySelectorAll('sup')].map(node => node.getBoundingClientRect());
            const left = Math.min(...rects.map(rect => rect.left));
            const right = Math.max(...rects.map(rect => rect.right));
            const top = Math.min(...rects.map(rect => rect.top));
            const bottom = Math.max(...rects.map(rect => rect.bottom));
            const { cx, cy, scale } = svgGeometry(el);
            for (const x of [left, right]) for (const y of [top, bottom]) {
              expect(Math.hypot(x - cx, y - cy) / scale).to.be.at.most(edge - 5.5 + 0.5);
            }
          }
        });
      }
    }

    it('skips hidden geometry and unchanged support without requesting an update', async () => {
      const el = await mount();
      el.style.setProperty('--mt-motion-dur', '0s');
      el.current = 21.1;
      await el.updateComplete;
      const measure = el as unknown as { _measureLabels(): void };
      const label = el.shadowRoot!.querySelector<HTMLElement>('.o-label')!;
      const set = sinon.spy(label.style, 'setProperty');
      const update = sinon.spy(el, 'requestUpdate');
      measure._measureLabels();
      expect(set.called).to.be.false;
      const previous = Number(label.style.getPropertyValue('--s'));
      label.style.setProperty('--s', String(previous + 0.04));
      set.resetHistory();
      measure._measureLabels();
      expect(set.called).to.be.false;
      label.style.setProperty('--s', String(previous + 1));
      set.resetHistory();
      measure._measureLabels();
      expect(set.calledOnce).to.be.true;
      const width = sinon.stub(el.shadowRoot!.querySelector<HTMLElement>('.dial')!, 'offsetWidth').get(() => 0);
      set.resetHistory();
      measure._measureLabels();
      expect(set.called).to.be.false;
      expect(update.called).to.be.false;
      width.restore();
      set.restore();
      update.restore();
    });

    it('remeasures on host resize and disconnects/reobserves on reconnect', async () => {
      const el = await mount();
      el.mode = 'cool';
      await el.updateComplete;
      await nextFrame();
      await nextFrame();
      const measure = sinon.spy(el as unknown as { _measureLabels(): void }, '_measureLabels');
      const observer = (el as unknown as { _labelResizeObserver: ResizeObserver })._labelResizeObserver;
      const disconnect = sinon.spy(observer, 'disconnect');
      const observe = sinon.spy(observer, 'observe');
      el.parentElement!.style.width = '160px';
      await aTimeout(100);
      expect(measure.called).to.be.true;
      const parent = el.parentElement!;
      el.remove();
      expect(disconnect.calledOnce).to.be.true;
      parent.append(el);
      expect(observe.calledOnceWithExactly(el)).to.be.true;
      await nextFrame();
      await nextFrame();
      for (const element of el.shadowRoot!.querySelectorAll('.o-label, .o-label ha-icon')) {
        expect(observe.calledWithExactly(element)).to.be.true;
      }
      observe.resetHistory();
      (el as unknown as { _measureLabels(): void })._measureLabels();
      expect(observe.called).to.be.false;
      measure.restore();
      disconnect.restore();
      observe.restore();
    });

    for (const dual of [false, true]) {
      it(`keeps label gaps constant as the band grows inward (dual=${dual})`, async () => {
        const el = await mount();
        el.style.setProperty('--mt-motion-dur', '0s');
        el.dual = dual;
        el.mode = 'cool';
        el.current = 28;
        el.lowValue = 18;
        el.highValue = 24;
        await el.updateComplete;
        const dial = el.shadowRoot!.querySelector('.dial')!;
        const labels = [...dial.querySelectorAll('.o-label')];
        expect(labels.some(label => label.classList.contains('icon-label'))).to.be.true;
        expect(labels.some(label => !label.classList.contains('icon-label'))).to.be.true;
        // Keep the collapsed dual icon mounted to verify its dragging CSS too;
        // a real dual drag replaces it with a number for the range readout.
        for (const dragging of [false, true, false]) {
          dial.classList.toggle('dragging', dragging);
          for (const label of labels) {
            const style = getComputedStyle(label);
            expectLabelGap(el, label, dragging ? 116 : 125);
            expect(style.getPropertyValue('--edge').trim()).to.equal(dragging ? '116' : '125');
            expect(style.transitionProperty).to.include('top');
          }
        }
      });
    }

    for (const dual of [false, true]) {
      it(`morphs the band and markers only during dragging (dual=${dual})`, async () => {
        const el = await mount();
        el.style.setProperty('--mt-motion-dur', '0s');
        el.dual = dual;
        el.mode = 'cool';
        el.current = 28;
        el.lowValue = 18;
        el.highValue = 24;
        await el.updateComplete;
        const sr = el.shadowRoot!;
        const dial = sr.querySelector('.dial')!;
        expect(dial.classList.contains('dragging')).to.be.false;
        for (const band of sr.querySelectorAll('.ring, .value')) {
          const style = getComputedStyle(band);
          expect(style.strokeWidth).to.equal('10px');
          expect(style.transform).to.equal('none');
          expect(style.transformOrigin).to.equal('160px 160px');
        }
        for (const marker of sr.querySelectorAll('.o-dot, .handle')) {
          expect(getComputedStyle(marker).top).to.equal('30px');
        }

        (el as any)._dragValue = 20;
        (el as any)._dragLow = 18;
        (el as any)._dragHigh = 24;
        if (!dual) (el as any)._wipeFrom = climateModeColor('heat');
        (el as any)._dragging = true;
        await el.updateComplete;
        expect(dial.classList.contains('dragging')).to.be.true;
        for (const band of sr.querySelectorAll('.ring, .value')) {
          const style = getComputedStyle(band);
          const matrix = new DOMMatrixReadOnly(style.transform);
          expect(matrix.a).to.be.closeTo(126.5 / 130, 0.000001);
          expect(matrix.d).to.be.closeTo(126.5 / 130, 0.000001);
          expect(matrix.b).to.equal(0);
          expect(matrix.c).to.equal(0);
          expect(matrix.e).to.equal(0);
          expect(matrix.f).to.equal(0);
          expect(style.transformOrigin).to.equal('160px 160px');
          expect(parseFloat(style.strokeWidth)).to.be.closeTo(17 / (126.5 / 130), 0.001);
          expect(style.transitionProperty).to.contain('transform');
          expect(getComputedStyle(band).transitionProperty).to.contain('stroke-width');
        }
        for (const unchanged of sr.querySelectorAll('.hit, .glow')) {
          expect(getComputedStyle(unchanged).transform).to.equal('none');
        }
        for (const marker of sr.querySelectorAll('.o-dot, .handle')) {
          expect(parseFloat(getComputedStyle(marker).top)).to.be.closeTo(33.5, 0.02);
          expect(getComputedStyle(marker).transitionProperty).to.contain('top');
        }
        for (const dot of sr.querySelectorAll('.o-dot')) {
          const style = getComputedStyle(dot);
          expect(parseFloat(style.height)).to.be.closeTo(dot.classList.contains('setpoint') ? 26 : 24, 0.1);
          expect(parseFloat(style.width)).to.be.closeTo(
            dot.classList.contains('setpoint') ? 5.6 : 3.84,
            0.02
          );
          expect(style.borderRadius).to.equal('999px');
          expect((parseFloat(style.height) - parseFloat(style.width)) / 2).to.be.at.least(8.5 + 1);
          // Even at any orbit angle, the outer tip fits inside the clipped 320u dial.
          expect(Math.hypot(126.5 + parseFloat(style.height) / 2, parseFloat(style.width) / 2)).to.be.lessThan(160);
          if (dot.classList.contains('current')) expect(style.opacity).to.equal('1');
          expect(style.transitionProperty).to.include('width');
          expect(style.transitionProperty).to.include('height');
          expect(style.transitionProperty).to.include('border-radius');
        }
        for (const label of sr.querySelectorAll('.o-label')) {
          expectLabelGap(el, label, 116);
          expect(getComputedStyle(label).transitionProperty).to.include('top');
        }
        if (dual) {
          expect(getComputedStyle(sr.querySelector('.setpoint.sel')!).boxShadow).to.not.equal('none');
        } else {
          expect(sr.querySelector('.wipe-value')).to.not.equal(null);
        }

        (el as any)._dragging = false;
        await el.updateComplete;
        expect(dial.classList.contains('dragging')).to.be.false;
        expect(getComputedStyle(sr.querySelector('.ring')!).strokeWidth).to.equal('10px');
        for (const band of sr.querySelectorAll('.ring, .value')) {
          expect(getComputedStyle(band).transform).to.equal('none');
          expect(getComputedStyle(band).strokeWidth).to.equal('10px');
        }
        for (const marker of sr.querySelectorAll('.o-dot, .handle')) {
          expect(getComputedStyle(marker).top).to.equal('30px');
        }
        expect(getComputedStyle(sr.querySelector('.o-dot.setpoint')!).height).to.equal('14px');
        for (const label of sr.querySelectorAll('.o-label')) {
          expectLabelGap(el, label, 125);
        }
      });
    }

    it('centres the step buttons at 41.5%/58.5% horizontally and 87.9% vertically', async () => {
      const el = await mount();
      const dial = el.shadowRoot!.querySelector('.dial')!.getBoundingClientRect();
      const buttons = el.shadowRoot!.querySelectorAll('.step');
      for (const [index, button] of [...buttons].entries()) {
        const rect = button.getBoundingClientRect();
        expect((rect.left + rect.width / 2 - dial.left) / dial.width).to.be.closeTo(
          index === 0 ? 0.415 : 0.585,
          0.001
        );
        expect((rect.top + rect.height / 2 - dial.top) / dial.height).to.be.closeTo(0.879, 0.001);
      }
    });
  });

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
      expect(valueText!.textContent!.trim()).to.equal('21');
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

    it('colors the preset icon with presetIconColor when set', async () => {
      const el = await mount();
      el.mode = 'heat';
      el.presetIcon = 'mdi:leaf';
      el.presetIconColor = '#4caf50';
      await el.updateComplete;
      const icon = el.shadowRoot!.querySelector('.preset-icon')!;
      expect(icon.getAttribute('style') ?? '').to.contain('color: #4caf50');
    });

    it('leaves the preset icon uncolored (default) when presetIconColor is unset', async () => {
      const el = await mount();
      el.mode = 'heat';
      el.presetIcon = 'mdi:leaf';
      await el.updateComplete;
      const icon = el.shadowRoot!.querySelector('.preset-icon')!;
      expect(icon.getAttribute('style')).to.equal(null);
    });

    it('a per-mode override drives the dial color (halo/number)', async () => {
      const el = await mount();
      el.mode = 'heat';
      el.modeColors = { heat: '#abcdef' };
      el.hvacAction = 'heating';
      await el.updateComplete;
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      expect(dial.getAttribute('style')).to.contain('--dial-color: #abcdef');
    });

    it('falls back to the built-in mode color when no override is set', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.modeColors = { heat: '#abcdef' }; // no override for cool
      el.hvacAction = 'cooling';
      await el.updateComplete;
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      expect(dial.getAttribute('style')).to.contain(`--dial-color: ${climateModeColor('cool')}`);
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
      expect(el.shadowRoot!.querySelector('.value-text')!.textContent!.trim()).to.equal('234');
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
      expect(el.shadowRoot!.querySelector('.value-text')!.textContent!.trim()).to.equal('21');
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
      expect(sr.querySelector('.center .value-text')!.textContent!.trim()).to.equal('28');
      // the setpoint marker now carries the target number...
      const labels = [...sr.querySelectorAll('.markers .o-label .num')].map((n) =>
        n.querySelector('.label-number')!.textContent!.trim()
      );
      expect(labels).to.include('21');
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
    it('keeps a fuller gradient that fades to transparent at the perimeter', async () => {
      const el = await mount();
      const stops = [...el.shadowRoot!.querySelectorAll('#mt-glow stop')];
      expect(stops.map(stop => [stop.getAttribute('offset'), stop.getAttribute('stop-opacity')])).to.deep.equal([
        ['0%', '0.38'],
        ['25%', '0.35'],
        ['45%', '0.3'],
        ['65%', '0.21'],
        ['80%', '0.12'],
        ['92%', '0.04'],
        ['100%', '0'],
      ]);
      for (const stop of stops) {
        expect(stop.getAttribute('stop-color')).to.equal('var(--dial-color)');
      }
    });

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
    it('renders a 306° ring from 207° to 153° wrapped', async () => {
      const el = await mount();
      const ring = el.shadowRoot!.querySelector('.ring') as SVGPathElement;
      const start = ring.getPointAtLength(0);
      const end = ring.getPointAtLength(ring.getTotalLength());
      expect(start.x).to.be.closeTo(160 - RADIUS * Math.sin(27 * Math.PI / 180), 0.01);
      expect(start.y).to.be.closeTo(160 + RADIUS * Math.cos(27 * Math.PI / 180), 0.01);
      expect(end.x).to.be.closeTo(160 + RADIUS * Math.sin(27 * Math.PI / 180), 0.01);
      expect(end.y).to.be.closeTo(start.y, 0.01);
      expect(ring.getTotalLength()).to.be.closeTo((RADIUS * SWEEP * Math.PI) / 180, 0.1);
      expect((el as any)._angleOf(el.min)).to.equal(207);
      expect((el as any)._angleOf(el.max)).to.equal(513);
    });
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
    it('excludes 180° and 205° in the bottom gap but includes 215°', async () => {
      const el = await mount();
      const { cx, cy, scale } = svgGeometry(el);
      for (const angle of [180, 205, 215]) {
        const t = ((angle - 90) * Math.PI) / 180;
        expect(
          (el as any)._isRingHit(
            cx + RADIUS * scale * Math.cos(t),
            cy + RADIUS * scale * Math.sin(t)
          )
        ).to.equal(angle === 215);
      }
    });
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
      // ARC_START = 210° from top, clockwise: point at lower-left.
      const t = ((ARC_START - 90) * Math.PI) / 180;
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
      const t = (((ARC_START + SWEEP) % 360 - 90) * Math.PI) / 180;
      const x = cx + RADIUS * scale * Math.cos(t);
      const y = cy + RADIUS * scale * Math.sin(t);
      const v = (el as any)._valueFromPoint(x, y);
      expect(v).to.equal(30);
    });

    it('gap near max end (angle 170°) snaps to max (p=SWEEP branch)', async () => {
      const el = await mount();
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      await el.updateComplete;
      const { cx, cy, scale } = svgGeometry(el);
      // a < 180 -> SWEEP. choose a top-based angle of 170 (between 150 and 180,
      // a<180 so snaps to SWEEP -> max).
      const t = ((170 - 90) * Math.PI) / 180;
      const x = cx + RADIUS * scale * Math.cos(t);
      const y = cy + RADIUS * scale * Math.sin(t);
      const v = (el as any)._valueFromPoint(x, y);
      expect(v).to.equal(30);
    });

    it('gap near min end (angle 200°) snaps to min (p=0 branch)', async () => {
      const el = await mount();
      el.min = 10;
      el.max = 30;
      el.step = 0.5;
      await el.updateComplete;
      const { cx, cy, scale } = svgGeometry(el);
      // top-based angle 200 (between 180 and 210): a>=180 -> p=0 -> min
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
      const t = ((ARC_START - 90) * Math.PI) / 180;
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
      const t = ((ARC_START - 90) * Math.PI) / 180;
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
      const t = (((ARC_START + SWEEP) % 360 - 90) * Math.PI) / 180; // near max -> nearer high
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
      const t = ((ARC_START - 90) * Math.PI) / 180; // near min -> value ~10, nearer low (14)
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
      const t = ((ARC_START - 90) * Math.PI) / 180;
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
      const t = (((ARC_START + SWEEP) % 360 - 90) * Math.PI) / 180; // near max -> nearer high
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
      const t = ((ARC_START - 90) * Math.PI) / 180;
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
      expect(selNum!.querySelector('.label-number')!.textContent!.trim()).to.equal('18');
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
      el.lowValue = 18; // angle 330
      el.highValue = 28; // angle 480
      el.current = 23; // angle 405 — all far apart
      await el.updateComplete;
      const angles = labelAngles(el);
      for (const [index, angle] of angles.entries()) {
        expect(angle).to.be.closeTo([329.4, 405.9, 482.4][index], 0.000001);
      }
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
      el.hvacAction = 'cooling';
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
      el.hvacAction = 'heating';
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
    it('wipes from the full demand color after an activity-only update', async () => {
      const el = await mount();
      el.mode = 'heat';
      el.hvacAction = 'heating';
      el.current = 18;
      await el.updateComplete;
      el.hvacAction = 'idle';
      await el.updateComplete;
      expect((el as any)._wipeFrom).to.equal(null);
      const heat = climateModeColor('heat');
      expect(el.shadowRoot!.querySelector('path.value')!.getAttribute('style')).to.contain(`stroke:${heat}`);

      el.mode = 'cool';
      el.value = 17;
      await el.updateComplete;
      expect((el as any)._wipeFrom).to.equal(heat);
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.wipe-value')!.getAttribute('style')).to.contain(heat);
    });

    it('still wipes from bright heat when changing directly to active cooling', async () => {
      const el = await mount();
      el.mode = 'heat';
      el.hvacAction = 'heating';
      el.value = 23;
      el.current = 20.6;
      await el.updateComplete;
      el.mode = 'cool';
      el.value = 18;
      el.hvacAction = 'cooling';
      await el.updateComplete;
      expect((el as any)._wipeFrom).to.equal(climateModeColor('heat'));
    });

    it('does not wipe between identical demand segment colors', async () => {
      const el = await mount();
      el.modeColors = { heat: '#abcdef', cool: '#abcdef' };
      el.mode = 'heat';
      el.hvacAction = 'idle';
      el.current = 18;
      await el.updateComplete;
      el.mode = 'cool';
      el.value = 17;
      await el.updateComplete;
      expect((el as any)._wipeFrom).to.equal(null);
    });

    it('wipes between two colored modes (creates the overlay then clears it)', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.value = 20;
      el.current = 24; // ensures showSeg true
      await el.updateComplete;
      // First render establishes the previous segment color; segment visible.
      expect((el as any)._prevSegColor).to.equal(climateModeColor('cool'));

      el.mode = 'heat';
      el.value = 26;
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
      // Touch a non-mode property: track the rendered color without a wipe.
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
      el.mode = 'auto';
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

    it('both dual sliders have tabindex -1 when disabled and expose their own values', async () => {
      const el = await mount();
      el.disabled = true;
      el.dual = true;
      el.highValue = 24;
      el.lowValue = 18;
      await el.updateComplete;
      const sliders = el.shadowRoot!.querySelectorAll('[role="slider"]');
      expect(sliders.length).to.equal(2);
      expect([...sliders].map(slider => slider.getAttribute('tabindex'))).to.deep.equal(['-1', '-1']);
      expect([...sliders].map(slider => slider.getAttribute('aria-valuenow'))).to.deep.equal(['18', '24']);
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

  describe('single-mode demand visibility', () => {
    for (const [mode, value, current, hvacAction, visible] of [
      ['heat', 15, 20.6, 'heating', false],
      ['cool', 25, 20, 'cooling', false],
      ['heat', 20, 20, 'heating', false],
      ['cool', 20, 20, 'cooling', false],
      ['heat', 23, undefined, 'heating', false],
      ['cool', 23, undefined, 'cooling', false],
      ['heat', 23, 0, 'heating', false],
      ['cool', 23, 40, 'cooling', false],
      ['heat', 23, 20.6, 'idle', true],
      ['heat', 23, 20.6, 'heating', true],
      ['auto', 25, 20, 'idle', true],
      ['dry', 25, 20, 'idle', true],
      ['fan_only', 25, 20, 'idle', true],
    ] as const) {
      it(`${mode}, target=${value}, current=${String(current)}, action=${hvacAction}: visible=${visible}`, async () => {
        const el = await mount();
        el.style.setProperty('--mt-motion-dur', '0s');
        el.mode = mode;
        el.value = value;
        el.current = current;
        el.hvacAction = hvacAction;
        await el.updateComplete;
        const segment = el.shadowRoot!.querySelector('.value')!;
        expect(getComputedStyle(segment).opacity).to.equal(visible ? '1' : '0');
        const color = climateModeColor(mode);
        expect(segment.getAttribute('style')).to.contain(`stroke:${color}`);
      });
    }

    it('fades the persistent segment in place as demand becomes sensible', async () => {
      const el = await mount();
      el.mode = 'heat';
      el.value = 15;
      el.current = 20.6;
      await el.updateComplete;
      const segment = el.shadowRoot!.querySelector('.value')!;
      // Settle the initial off→heat slide before checking the activity change.
      el.shadowRoot!.getAnimations().forEach(animation => animation.finish());
      const dash = segment.getAttribute('stroke-dasharray');
      const offset = segment.getAttribute('stroke-dashoffset');
      const wipe = sinon.spy(el as any, '_runWipe');
      expect(segment.getAttribute('style')).to.contain('opacity:0;');
      el.mode = 'cool';
      await el.updateComplete;
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.value')).to.equal(segment);
      expect(segment.getAttribute('stroke-dasharray')).to.equal(dash);
      expect(segment.getAttribute('stroke-dashoffset')).to.equal(offset);
      expect(segment.getAttribute('style')).to.contain('opacity:1;');
      expect((el as any)._wipeFrom).to.equal(null);
      expect(el.shadowRoot!.querySelector('.wipe-value')).to.equal(null);
      // Opacity/stroke fades are intentional; dash slides and WAAPI wipes are not.
      const animations = segment.getAnimations();
      expect(animations.every(animation => animation instanceof CSSTransition)).to.be.true;
      expect(animations.map(animation => (animation as CSSTransition).transitionProperty))
        .to.have.members(['opacity', 'stroke']);
      el.mode = 'heat';
      await el.updateComplete;
      expect((el as any)._wipeFrom).to.equal(null);
      expect(segment.getAttribute('style')).to.contain('opacity:0;');
      expect(wipe.called).to.be.false;
      wipe.restore();
    });

    it('tracks visibility after a temperature-only update before a mode change', async () => {
      const el = await mount();
      el.mode = 'heat';
      el.value = 23;
      el.current = 20.6;
      await el.updateComplete;
      expect((el as any)._prevSegVisible).to.be.true;
      el.value = 15;
      await el.updateComplete;
      expect((el as any)._prevSegVisible).to.be.false;
      el.mode = 'cool';
      await el.updateComplete;
      expect((el as any)._prevSegVisible).to.be.true;
      expect((el as any)._wipeFrom).to.equal(null);
    });
    it('cool: not cooling hides the neutral stroke', async () => {
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
      expect(style).to.contain('opacity:0;');
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

    it('heat: not heating hides the neutral stroke', async () => {
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
      expect(style).to.contain('opacity:0;');
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

    it('not-heating neutralizes the halo and hides the segment', async () => {
      const el = await mount();
      el.mode = 'heat';
      el.min = 10;
      el.max = 30;
      el.value = 15;
      el.current = 20.6;
      await el.updateComplete;
      const seg = el.shadowRoot!.querySelector('path.value') as SVGPathElement;
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      expect(seg.getAttribute('style')).to.contain(`stroke:${IDLE_COLOR}`);
      expect(seg.getAttribute('style')).to.contain('opacity:0;');
      expect(dial.style.getPropertyValue('--dial-color')).to.equal(IDLE_COLOR);
      expect(dial.classList.contains('idle')).to.be.true;
    });

    it('not-cooling neutralizes the halo and hides the segment', async () => {
      const el = await mount();
      el.mode = 'cool';
      el.min = 10;
      el.max = 30;
      el.value = 25;
      el.current = 20; // cooler at 21, room 20 -> not cooling
      await el.updateComplete;
      const seg = el.shadowRoot!.querySelector('path.value') as SVGPathElement;
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      expect(seg.getAttribute('style')).to.contain(`stroke:${IDLE_COLOR}`);
      expect(seg.getAttribute('style')).to.contain('opacity:0;');
      expect(dial.style.getPropertyValue('--dial-color')).to.equal(IDLE_COLOR);
      expect(dial.classList.contains('idle')).to.be.true;
    });
  });

  describe('single-mode reported activity', () => {
    for (const [mode, value, current, action, colored, active, visible = colored] of [
      ['heat', 23, 22, 'idle', true, false],
      ['heat', 23, 22, 'heating', true, true],
      ['heat', 16, 22, 'idle', false, false],
      ['heat', 16, 22, 'heating', true, true, false],
      ['heat', 15, 22, undefined, false, false],
      ['cool', 20, 24, 'idle', true, false],
    ] as const) {
      it(`${mode}, target=${value}, current=${current}, action=${String(action)}: demand color=${colored}`, async () => {
        const el = await mount();
        el.style.setProperty('--mt-motion-dur', '0s');
        el.mode = mode;
        el.value = value;
        el.current = current;
        el.hvacAction = action;
        await el.updateComplete;
        const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
        const segment = el.shadowRoot!.querySelector('.value')!;
        const light = `color-mix(in srgb, ${climateModeColor(mode)} 20%, var(--mt-on-surface))`;
        expect(segment.getAttribute('style')).to.contain(`stroke:${colored ? climateModeColor(mode) : IDLE_COLOR}`);
        expect(getComputedStyle(segment).opacity).to.equal(visible ? '1' : '0');
        expect(dial.style.getPropertyValue('--mode-tint')).to.equal(colored ? climateModeColor(mode) : light);
        expect(getComputedStyle(el.shadowRoot!.querySelector('.mode-icon')!).color).to.equal(
          getComputedStyle(dial).getPropertyValue('--mode-tint').trim()
        );
        expect(dial.style.getPropertyValue('--mode-light')).to.equal(light);
        expect(dial.classList.contains('idle')).to.equal(!active);
        expect(dial.style.getPropertyValue('--dial-color')).to.equal(active ? climateModeColor(mode) : IDLE_COLOR);
      });
    }

    it('registers and transitions the single-mode tint as a color with resolved variables', async () => {
      const el = await mount();
      el.style.setProperty('--mt-motion-dur', '0s');
      el.style.setProperty('--mt-on-surface-variant', '#808080');
      el.style.setProperty('--mt-on-surface', '#808080');
      el.modeColors = { heat: '#ff0000' };
      el.mode = 'heat';
      el.hvacAction = 'idle';
      el.current = 18;
      await el.updateComplete;
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      const style = getComputedStyle(dial);
      expect(style.getPropertyValue('--mode-tint').trim()).to.equal('rgb(255, 0, 0)');
      expect(style.getPropertyValue('--mode-light').trim()).to.equal('color(srgb 0.601569 0.401569 0.401569)');
      expect(getComputedStyle(el.shadowRoot!.querySelector('.o-dot.setpoint')!).backgroundColor).to.equal(style.getPropertyValue('--mode-light').trim());
      expect(style.transitionProperty.split(', ')).to.include('--mode-light');
      expect(style.transitionProperty.split(', ')).to.include('--mode-tint');
      expect(style.transitionDuration.split(', ')).to.deep.equal(['0s', '0s', '0s']);
      expect(getComputedStyle(el.shadowRoot!.querySelector('.mode-icon')!).color).to.equal(
        style.getPropertyValue('--mode-tint').trim()
      );
    });

    it('leaves dual icons on the animated dial color, including after single mode', async () => {
      const el = await mount();
      el.style.setProperty('--mt-motion-dur', '0s');
      el.mode = 'heat';
      el.hvacAction = 'idle';
      el.current = 18;
      await el.updateComplete;
      el.dual = true;
      el.mode = 'cool';
      el.current = 28;
      el.lowValue = 18;
      el.highValue = 24;
      await el.updateComplete;
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      expect(dial.style.getPropertyValue('--mode-tint')).to.equal('');
      const icon = el.shadowRoot!.querySelector('.mode-icon')!;
      expect(icon).to.not.equal(null);
      expect(getComputedStyle(icon).color).to.equal(
        getComputedStyle(dial).getPropertyValue('--dial-color').trim()
      );
    });

    for (const [mode, value, current, hvacAction, active] of [
      ['heat', 15, 20.6, 'heating', true],
      ['heat', 25, 20.6, 'idle', false],
      ['heat', 25, 20.6, undefined, true],
      ['heat', 25, 20.6, '', true],
      ['fan_only', 25, 20, undefined, true],
      ['fan_only', 25, 20, '', true],
      ['fan_only', 25, undefined, undefined, false],
      ['fan_only', 25, 20, 'fan', true],
      ['fan_only', 25, 20, 'idle', false],
      ['fan_only', 25, 20, 'off', false],
      ['fan_only', 25, undefined, 'idle', false],
      ['off', 25, 20, 'heating', false],
      ['dry', 25, 20, 'drying', true],
      ['dry', 25, 20, 'idle', false],
      ['dry', 25, 20, 'off', false],
      ['dry', 25, 20, undefined, true],
      ['dry', 25, 20, '', true],
      ['dry', 25, undefined, undefined, false],
      ['auto', 25, 20, 'heating', true],
      ['auto', 25, 20, 'idle', false],
      ['auto', 25, 20, 'off', false],
      ['auto', 25, 20, undefined, true],
      ['auto', 25, 20, '', true],
      ['auto', 25, undefined, undefined, false],
    ] as const) {
      it(`${mode}, action=${String(hvacAction)}, target=${value}, current=${String(current)}: active=${active}`, async () => {
        const el = await mount();
        el.style.setProperty('--mt-motion-dur', '0s');
        el.mode = mode;
        el.value = value;
        el.current = current;
        el.hvacAction = hvacAction;
        await el.updateComplete;
        const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
        expect(dial.style.getPropertyValue('--dial-color')).to.equal(
          active ? climateModeColor(mode) : IDLE_COLOR
        );
        expect(dial.classList.contains('idle')).to.equal(!active && mode !== 'off');
        expect(dial.classList.contains('off')).to.equal(mode === 'off');
        expect((el as any)._singleActive).to.equal(active);
        if (['fan_only', 'dry', 'auto'].includes(mode) && current != null) {
          const segment = el.shadowRoot!.querySelector('.value')!;
          expect(segment.getAttribute('style')).to.contain(`stroke:${climateModeColor(mode)}`);
          expect(dial.style.getPropertyValue('--mode-tint')).to.equal(climateModeColor(mode));
          expect(getComputedStyle(el.shadowRoot!.querySelector('.mode-icon')!).color).to.equal(
            getComputedStyle(dial).getPropertyValue('--mode-tint').trim()
          );
          expect((el as any)._prevSegColor).to.equal(climateModeColor(mode));
        }
      });
    }

    it('resolves inline variable-based mode tint without invalidating the registered dial color', async () => {
      const el = await mount();
      el.style.setProperty('--mt-motion-dur', '0s');
      el.style.setProperty('--state-climate-heat-color', 'rgb(200, 0, 0)');
      el.style.setProperty('--mt-on-surface-variant', 'rgb(100, 100, 100)');
      el.style.setProperty('--mt-on-surface', 'rgb(100, 100, 100)');
      el.mode = 'heat';
      el.value = 15;
      el.current = 20.6;
      await el.updateComplete;
      await nextFrame();
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      const tint = `color-mix(in srgb, ${climateModeColor('heat')} 20%, var(--mt-on-surface))`;
      expect(dial.style.getPropertyValue('--mode-tint')).to.equal(tint);
      expect(getComputedStyle(dial).getPropertyValue('--dial-color').trim()).to.equal('rgb(100, 100, 100)');
      const iconColor = getComputedStyle(el.shadowRoot!.querySelector('.mode-icon')!).color;
      expect(iconColor).to.equal('color(srgb 0.470588 0.313726 0.313726)');
      expect(getComputedStyle(el.shadowRoot!.querySelector('.value')!).stroke).to.equal('rgb(100, 100, 100)');
      expect(getComputedStyle(el.shadowRoot!.querySelector('.glow')!).opacity).to.equal('0.5');
    });

    it('cross-fades activity changes without a wipe, off state, or segment slide', async () => {
      const el = await mount();
      el.mode = 'heat';
      el.value = 23;
      el.current = 20.6;
      el.hvacAction = 'heating';
      await el.updateComplete;
      const dial = el.shadowRoot!.querySelector('.dial') as HTMLElement;
      const segment = el.shadowRoot!.querySelector('.value')!;
      const dash = segment.getAttribute('stroke-dasharray');
      const offset = segment.getAttribute('stroke-dashoffset');
      const wipe = sinon.spy(el as any, '_runWipe');
      for (const action of ['idle', 'heating']) {
        el.hvacAction = action;
        await el.updateComplete;
        expect((el as any)._wipeFrom).to.equal(null);
        expect((el as any)._prevOff).to.be.false;
        expect(dial.classList.contains('off')).to.be.false;
        expect(el.shadowRoot!.querySelector('.value')).to.equal(segment);
        expect(segment.getAttribute('stroke-dasharray')).to.equal(dash);
        expect(segment.getAttribute('stroke-dashoffset')).to.equal(offset);
        expect(segment.getAttribute('style')).to.contain('opacity:1;');
      }
      expect(dial.style.getPropertyValue('--mode-tint')).to.equal(climateModeColor('heat'));
      expect(getComputedStyle(segment).transitionProperty).to.contain('stroke');
      expect(wipe.called).to.be.false;
      wipe.restore();
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
        n.querySelector('.label-number')!.textContent!.trim()
      );
      expect(labels).to.include('18');
      expect(labels).to.include('24');
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
