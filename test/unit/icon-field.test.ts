import { fixture, html, expect } from '@open-wc/testing';
import { makeHass } from '../helpers';
import '../../src/editors/icon-field';
import type { MtIconField } from '../../src/editors/icon-field';

/**
 * Mount mt-icon-field with the given value (undefined = default · '' = no icon).
 * @param value the icon value
 */
async function mount(value?: string): Promise<MtIconField> {
  const el = await fixture<MtIconField>(
    html`<mt-icon-field .hass=${makeHass({})} .value=${value}></mt-icon-field>`
  );
  await el.updateComplete;
  return el;
}

/** The nested ha-icon-picker. */
function picker(el: MtIconField): any {
  return el.shadowRoot!.querySelector('ha-icon-picker');
}
/** The "No icon" toggle button. */
function noneBtn(el: MtIconField): HTMLButtonElement {
  return el.shadowRoot!.querySelector('button.none') as HTMLButtonElement;
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
  it('renders an icon picker and a "No icon" toggle', async () => {
    const el = await mount();
    expect(picker(el)).to.not.equal(null);
    expect(noneBtn(el)).to.not.equal(null);
  });

  it('default (undefined): toggle inactive, picker enabled and empty', async () => {
    const el = await mount(undefined);
    expect(noneBtn(el).classList.contains('active')).to.be.false;
    expect(picker(el).value).to.equal('');
    expect(picker(el).disabled).to.equal(false);
  });

  it('clicking the toggle selects "no icon" (emits "")', async () => {
    const el = await mount(undefined);
    const p = onChange(el);
    noneBtn(el).click();
    expect(await p).to.equal('');
  });

  it('"no icon" active: toggle highlighted, picker disabled; clicking reverts to default', async () => {
    const el = await mount('');
    expect(noneBtn(el).classList.contains('active')).to.be.true;
    expect(picker(el).disabled).to.equal(true);
    const p = onChange(el);
    noneBtn(el).click();
    expect(await p).to.equal(undefined);
  });

  it('shows a custom icon and forwards picker changes', async () => {
    const el = await mount('mdi:fire');
    expect(picker(el).value).to.equal('mdi:fire');
    expect(noneBtn(el).classList.contains('active')).to.be.false;
    const p = onChange(el);
    picker(el).dispatchEvent(
      new CustomEvent('value-changed', {
        detail: { value: 'mdi:snowflake' },
        bubbles: true,
        composed: true,
      })
    );
    expect(await p).to.equal('mdi:snowflake');
  });

  it('clearing the picker reverts to the default (undefined), not "no icon"', async () => {
    const el = await mount('mdi:fire');
    const p = onChange(el);
    picker(el).dispatchEvent(
      new CustomEvent('value-changed', { detail: { value: '' }, bubbles: true, composed: true })
    );
    expect(await p).to.equal(undefined);
  });
});
