import { fixture, html, expect } from '@open-wc/testing';
import '../../src/editors/search-panel';
import type { MtSearchPanel, SearchItem } from '../../src/editors/search-panel';

const ITEMS: SearchItem[] = [
  { value: 'sensor.a', primary: 'Alpha', secondary: 'sensor.a', icon: 'mdi:a', keywords: ['kw1'] },
  { value: 'b', primary: 'Beta' },
  { value: 'mdi:home', primary: 'Gamma', secondary: 'sub-c' },
];

/**
 * Mount the search panel.
 * @param props value / allowCustom / customPrefix overrides
 */
async function mount(
  props: { value?: string; allowCustom?: boolean; customPrefix?: string } = {}
): Promise<MtSearchPanel> {
  const el = await fixture<MtSearchPanel>(
    html`<mt-search-panel
      .items=${ITEMS}
      .value=${props.value ?? ''}
      .allowCustom=${props.allowCustom ?? false}
      customPrefix=${props.customPrefix ?? ''}
    ></mt-search-panel>`
  );
  await el.updateComplete;
  return el;
}

const search = (el: MtSearchPanel) => el.shadowRoot!.querySelector('.search') as HTMLInputElement;
const opts = (el: MtSearchPanel) =>
  [...el.shadowRoot!.querySelectorAll('.opt')] as HTMLButtonElement[];
const names = (el: MtSearchPanel) =>
  opts(el).map((o) => o.querySelector('.opt-name')!.textContent);

/** Type into the search box. */
async function type(el: MtSearchPanel, value: string): Promise<void> {
  search(el).value = value;
  search(el).dispatchEvent(new Event('input'));
  await el.updateComplete;
}

/** Resolve with the next pick value. */
function onPick(el: MtSearchPanel): Promise<string> {
  return new Promise((res) =>
    el.addEventListener('pick', (e) => res((e as CustomEvent).detail.value), { once: true })
  );
}

describe('mt-search-panel', () => {
  it('renders a focused search box and a row per item (icon + primary + secondary)', async () => {
    const el = await mount();
    expect(search(el)).to.not.equal(null);
    expect(el.shadowRoot!.activeElement).to.equal(search(el));
    expect(names(el)).to.deep.equal(['Alpha', 'Beta', 'Gamma']);
    const alpha = opts(el)[0];
    expect(alpha.querySelector('ha-icon')!.getAttribute('icon')).to.equal('mdi:a');
    expect(alpha.querySelector('.opt-sub')!.textContent).to.equal('sensor.a');
    // Beta has no icon / secondary
    expect(opts(el)[1].querySelector('ha-icon')).to.equal(null);
    expect(opts(el)[1].querySelector('.opt-sub')).to.equal(null);
  });

  it('marks the active value', async () => {
    const el = await mount({ value: 'mdi:home' });
    expect(el.shadowRoot!.querySelector('.opt.active .opt-name')!.textContent).to.equal('Gamma');
  });

  describe('filtering', () => {
    it('matches primary text', async () => {
      const el = await mount();
      await type(el, 'alpha');
      expect(names(el)).to.deep.equal(['Alpha']);
    });
    it('matches a keyword', async () => {
      const el = await mount();
      await type(el, 'kw1');
      expect(names(el)).to.deep.equal(['Alpha']);
    });
    it('matches the secondary text', async () => {
      const el = await mount();
      await type(el, 'sub-c');
      expect(names(el)).to.deep.equal(['Gamma']);
    });
    it('matches the value', async () => {
      const el = await mount();
      await type(el, 'sensor.a');
      expect(names(el)).to.deep.equal(['Alpha']);
    });
    it('shows an empty message when nothing matches', async () => {
      const el = await mount();
      await type(el, 'zzzzz');
      expect(opts(el).length).to.equal(0);
      expect(el.shadowRoot!.querySelector('.empty')).to.not.equal(null);
    });
  });

  it('emits pick (bubbles+composed) when a row is clicked', async () => {
    const el = await mount();
    const p = onPick(el);
    opts(el)[0].click();
    expect(await p).to.equal('sensor.a');
  });

  describe('custom values', () => {
    it('prefixes a bare typed value when customPrefix is set', async () => {
      const el = await mount({ allowCustom: true, customPrefix: 'mdi:' });
      await type(el, 'rocket');
      const custom = el.shadowRoot!.querySelector('.opt.custom') as HTMLButtonElement;
      expect(custom).to.not.equal(null);
      expect(custom.querySelector('ha-icon')!.getAttribute('icon')).to.equal('mdi:rocket');
      const p = onPick(el);
      custom.click();
      expect(await p).to.equal('mdi:rocket');
    });

    it('keeps a typed value that already has a prefix', async () => {
      const el = await mount({ allowCustom: true, customPrefix: 'mdi:' });
      await type(el, 'mdi:fire');
      const custom = el.shadowRoot!.querySelector('.opt.custom') as HTMLButtonElement;
      const p = onPick(el);
      custom.click();
      expect(await p).to.equal('mdi:fire');
    });

    it('uses a mdi:plus glyph and the raw query when there is no prefix', async () => {
      const el = await mount({ allowCustom: true });
      await type(el, 'sensor.custom');
      const custom = el.shadowRoot!.querySelector('.opt.custom') as HTMLButtonElement;
      expect(custom.querySelector('ha-icon')!.getAttribute('icon')).to.equal('mdi:plus');
      const p = onPick(el);
      custom.click();
      expect(await p).to.equal('sensor.custom');
    });

    it('offers no custom row when the query exactly matches an item value', async () => {
      const el = await mount({ allowCustom: true });
      await type(el, 'mdi:home');
      expect(el.shadowRoot!.querySelector('.opt.custom')).to.equal(null);
    });

    it('offers no custom row when custom is disabled', async () => {
      const el = await mount({ allowCustom: false });
      await type(el, 'whatever');
      expect(el.shadowRoot!.querySelector('.opt.custom')).to.equal(null);
    });
  });

  describe('keyboard', () => {
    it('Escape dispatches dismiss', async () => {
      const el = await mount();
      const p = new Promise<boolean>((res) =>
        el.addEventListener('dismiss', () => res(true), { once: true })
      );
      search(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(await p).to.be.true;
    });

    it('Enter commits the custom value when allowed', async () => {
      const el = await mount({ allowCustom: true, customPrefix: 'mdi:' });
      await type(el, 'leaf');
      const p = onPick(el);
      search(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(await p).to.equal('mdi:leaf');
    });

    it('Enter does nothing when custom is disabled', async () => {
      const el = await mount({ allowCustom: false });
      await type(el, 'leaf');
      let fired = false;
      el.addEventListener('pick', () => (fired = true));
      search(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise((r) => setTimeout(r, 10));
      expect(fired).to.be.false;
    });

    it('Enter with an empty query does nothing even when allowed', async () => {
      const el = await mount({ allowCustom: true });
      let fired = false;
      el.addEventListener('pick', () => (fired = true));
      search(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise((r) => setTimeout(r, 10));
      expect(fired).to.be.false;
    });

    it('ignores other keys', async () => {
      const el = await mount();
      let dismissed = false;
      el.addEventListener('dismiss', () => (dismissed = true));
      search(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      await new Promise((r) => setTimeout(r, 10));
      expect(dismissed).to.be.false;
    });
  });
});
