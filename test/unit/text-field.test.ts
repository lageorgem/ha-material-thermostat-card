import { fixture, html, expect } from '@open-wc/testing';
import '../../src/editors/text-field';
import type { MtTextField } from '../../src/editors/text-field';

/**
 * Mount mt-text-field.
 * @param value initial value
 * @param label placeholder/label
 */
async function mount(value = '', label = 'Title'): Promise<MtTextField> {
  const el = await fixture<MtTextField>(
    html`<mt-text-field .value=${value} label=${label}></mt-text-field>`
  );
  await el.updateComplete;
  return el;
}

/** The native input. */
function input(el: MtTextField): HTMLInputElement {
  return el.shadowRoot!.querySelector('input') as HTMLInputElement;
}

describe('mt-text-field', () => {
  it('renders a native input seeded with the value and label as placeholder', async () => {
    const el = await mount('Bedroom', 'Custom title');
    expect(input(el)).to.not.equal(null);
    expect(input(el).value).to.equal('Bedroom');
    expect(input(el).placeholder).to.equal('Custom title');
    expect(input(el).getAttribute('aria-label')).to.equal('Custom title');
  });

  it('coerces a nullish value to an empty string', async () => {
    const el = await fixture<MtTextField>(
      html`<mt-text-field .value=${undefined as any}></mt-text-field>`
    );
    await el.updateComplete;
    expect(input(el).value).to.equal('');
  });

  it('emits value-changed (bubbles+composed) with the typed value on input', async () => {
    const el = await mount('');
    const p = new Promise<CustomEvent>((res) =>
      el.addEventListener('value-changed', (e) => res(e as CustomEvent), { once: true })
    );
    const i = input(el);
    i.value = 'Kitchen';
    i.dispatchEvent(new Event('input'));
    const ev = await p;
    expect(ev.detail.value).to.equal('Kitchen');
    expect(ev.bubbles).to.be.true;
    expect(ev.composed).to.be.true;
  });

  it('emits an empty string when cleared', async () => {
    const el = await mount('Kitchen');
    const p = new Promise<string>((res) =>
      el.addEventListener('value-changed', (e) => res((e as CustomEvent).detail.value), {
        once: true,
      })
    );
    const i = input(el);
    i.value = '';
    i.dispatchEvent(new Event('input'));
    expect(await p).to.equal('');
  });
});
