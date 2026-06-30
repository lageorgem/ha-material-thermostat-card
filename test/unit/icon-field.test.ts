import { fixture, html, expect, aTimeout } from '@open-wc/testing';
import { makeHass } from '../helpers';
import '../../src/editors/icon-field';
import type { MtIconField } from '../../src/editors/icon-field';
import { resetIconItemsForTest } from '../../src/editors/icon-list';

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

const iconSeg = (el: MtIconField) => el.shadowRoot!.querySelector('.seg.icon') as HTMLButtonElement;
const cancelSeg = (el: MtIconField) =>
  el.shadowRoot!.querySelector('.seg.cancel') as HTMLButtonElement;
const sp = (el: MtIconField) => el.shadowRoot!.querySelector('mt-search-panel') as any;
const opts = (el: MtIconField): HTMLButtonElement[] =>
  [...(sp(el)?.shadowRoot?.querySelectorAll('.opt') ?? [])] as HTMLButtonElement[];
const searchBox = (el: MtIconField): HTMLInputElement =>
  sp(el)!.shadowRoot!.querySelector('.search') as HTMLInputElement;

/** Open the icon search panel and let the icon list load + render. */
async function openIcons(el: MtIconField): Promise<void> {
  iconSeg(el).click();
  await el.updateComplete;
  await aTimeout(0);
  await el.updateComplete;
  await sp(el)!.updateComplete;
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
  beforeEach(() => resetIconItemsForTest());

  it('renders a two-segment pill (icon + cancel), closed by default', async () => {
    const el = await mount();
    expect(iconSeg(el)).to.not.equal(null);
    expect(cancelSeg(el)).to.not.equal(null);
    expect(sp(el)).to.equal(null);
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

    it('clicking cancel closes an open panel', async () => {
      const el = await mount(undefined);
      await openIcons(el);
      expect(sp(el)).to.not.equal(null);
      cancelSeg(el).click();
      await el.updateComplete;
      expect(sp(el)).to.equal(null);
    });
  });

  describe('icon search panel', () => {
    it('clicking the icon segment opens a search panel seeded with the value', async () => {
      const el = await mount('mdi:fire');
      await openIcons(el);
      expect(sp(el)).to.not.equal(null);
      expect(iconSeg(el).getAttribute('aria-expanded')).to.equal('true');
      expect(sp(el).value).to.equal('mdi:fire');
      expect(sp(el).allowCustom).to.equal(true);
      expect(sp(el).customPrefix).to.equal('mdi:');
    });

    it('loads a browsable list of icons', async () => {
      const el = await mount();
      await openIcons(el);
      expect(sp(el).items.length).to.be.greaterThan(20);
      expect(opts(el).length).to.be.greaterThan(0);
    });

    it('opens with an empty value when currently "no icon"', async () => {
      const el = await mount('');
      await openIcons(el);
      expect(sp(el).value).to.equal('');
    });

    it('reuses the loaded icon list when reopened', async () => {
      const el = await mount();
      await openIcons(el);
      expect(sp(el).items.length).to.be.greaterThan(0);
      iconSeg(el).click(); // close
      await el.updateComplete;
      expect(sp(el)).to.equal(null);
      iconSeg(el).click(); // reopen — icons already loaded, no reload
      await el.updateComplete;
      await sp(el).updateComplete;
      expect(sp(el).items.length).to.be.greaterThan(0);
    });

    it('clicking the icon segment again closes the panel', async () => {
      const el = await mount(undefined);
      await openIcons(el);
      expect(sp(el)).to.not.equal(null);
      iconSeg(el).click();
      await el.updateComplete;
      expect(sp(el)).to.equal(null);
    });

    it('choosing an icon from the list emits it and closes', async () => {
      const el = await mount();
      await openIcons(el);
      const home = opts(el).find((o) => o.querySelector('.opt-name')!.textContent === 'mdi:home')!;
      const p = onChange(el);
      home.click();
      expect(await p).to.equal('mdi:home');
      await el.updateComplete;
      expect(sp(el)).to.equal(null);
    });

    it('committing a typed custom icon emits it (free text for the long tail)', async () => {
      const el = await mount();
      await openIcons(el);
      const s = searchBox(el);
      s.value = 'unicorn-variant'; // not in the curated list
      s.dispatchEvent(new Event('input'));
      await sp(el).updateComplete;
      const custom = sp(el).shadowRoot.querySelector('.opt.custom') as HTMLButtonElement;
      expect(custom).to.not.equal(null);
      const p = onChange(el);
      custom.click();
      expect(await p).to.equal('mdi:unicorn-variant');
    });
  });

  describe('panel alignment', () => {
    /** Stub the pill's position so `_toggle` can decide the panel anchor. */
    const stubRect = (el: MtIconField, left: number): void => {
      el.getBoundingClientRect = () =>
        ({
          left,
          width: 80,
          right: left + 80,
          top: 0,
          bottom: 40,
          height: 40,
          x: left,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect;
    };

    it('left-aligns by default when the panel fits within the viewport', async () => {
      const el = await mount();
      stubRect(el, 10);
      await openIcons(el);
      expect(el.shadowRoot!.querySelector('.panel')!.classList.contains('right')).to.be.false;
    });

    it('right-anchors (grows leftward) near the viewport right edge', async () => {
      const el = await mount();
      stubRect(el, window.innerWidth - 40); // a left-anchored 256px panel would overflow
      await openIcons(el);
      expect(el.shadowRoot!.querySelector('.panel')!.classList.contains('right')).to.be.true;
    });

    it('measures against the editor host (the dialog), not the viewport', async () => {
      // Mount inside a real shadow root so getRootNode().host resolves to a
      // bounded "editor" — mirroring the narrow, centered edit dialog.
      const wrap = document.createElement('div');
      const shadow = wrap.attachShadow({ mode: 'open' });
      document.body.appendChild(wrap);
      try {
        const el = document.createElement('mt-icon-field') as MtIconField;
        el.hass = makeHass({});
        shadow.appendChild(el);
        await el.updateComplete;
        // host spans 100..500 (midpoint 300); the pill sits centered at 440 → it
        // is in the host's right half even though it's nowhere near the viewport
        // edge, so the panel must right-anchor.
        const rect = (left: number, width: number): DOMRect =>
          ({
            left,
            width,
            right: left + width,
            top: 0,
            bottom: 40,
            height: 40,
            x: left,
            y: 0,
            toJSON: () => ({}),
          }) as DOMRect;
        wrap.getBoundingClientRect = () => rect(100, 400);
        el.getBoundingClientRect = () => rect(400, 80);
        (el.shadowRoot!.querySelector('.seg.icon') as HTMLButtonElement).click();
        await el.updateComplete;
        await aTimeout(0);
        await el.updateComplete;
        expect(el.shadowRoot!.querySelector('.panel')!.classList.contains('right')).to.be.true;
      } finally {
        wrap.remove();
      }
    });
  });

  describe('outside-click handling', () => {
    it('a document click outside closes an open panel', async () => {
      const el = await mount(undefined);
      await openIcons(el);
      expect(sp(el)).to.not.equal(null);
      document.body.click();
      await el.updateComplete;
      expect(sp(el)).to.equal(null);
    });

    it('a click inside (on the panel) keeps it open', async () => {
      const el = await mount(undefined);
      await openIcons(el);
      searchBox(el).click();
      await el.updateComplete;
      expect(sp(el)).to.not.equal(null);
    });

    it('a document click while closed is a no-op', async () => {
      const el = await mount(undefined);
      document.body.click();
      await el.updateComplete;
      expect(sp(el)).to.equal(null);
    });
  });
});
