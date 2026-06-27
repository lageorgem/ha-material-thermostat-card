import { fixture, html, expect } from '@open-wc/testing';
import { captureEvents } from '../helpers';
import '../../src/editors/display-toggle';
import type { MtDisplayToggle } from '../../src/editors/display-toggle';

/** Grab the two <button> elements rendered by the toggle. */
function buttons(el: MtDisplayToggle): HTMLButtonElement[] {
  return Array.from(el.shadowRoot!.querySelectorAll('button')) as HTMLButtonElement[];
}

describe('mt-display-toggle', () => {
  it('renders two buttons and marks the one matching value with class "on"', async () => {
    const el = await fixture<MtDisplayToggle>(
      html`<mt-display-toggle .value=${'icons'}></mt-display-toggle>`
    );
    const [icons, dropdown] = buttons(el);
    expect(buttons(el).length).to.equal(2);
    expect(icons.classList.contains('on')).to.be.true;
    expect(dropdown.classList.contains('on')).to.be.false;
  });

  it('marks the dropdown button "on" when value is dropdown', async () => {
    const el = await fixture<MtDisplayToggle>(
      html`<mt-display-toggle .value=${'dropdown'}></mt-display-toggle>`
    );
    const [icons, dropdown] = buttons(el);
    expect(icons.classList.contains('on')).to.be.false;
    expect(dropdown.classList.contains('on')).to.be.true;
  });

  it('defaults value to "icons"', async () => {
    const el = await fixture<MtDisplayToggle>(html`<mt-display-toggle></mt-display-toggle>`);
    expect(el.value).to.equal('icons');
    expect(buttons(el)[0].classList.contains('on')).to.be.true;
  });

  it('clicking the OTHER value emits value-changed with that value', async () => {
    const el = await fixture<MtDisplayToggle>(
      html`<mt-display-toggle .value=${'icons'}></mt-display-toggle>`
    );
    const cap = captureEvents('value-changed');
    buttons(el)[1].click(); // dropdown
    cap.stop();
    expect(cap.events.length).to.equal(1);
    expect(cap.events[0].detail).to.deep.equal({ value: 'dropdown' });
  });

  it('clicking the OTHER value (icons from dropdown) emits value-changed', async () => {
    const el = await fixture<MtDisplayToggle>(
      html`<mt-display-toggle .value=${'dropdown'}></mt-display-toggle>`
    );
    const cap = captureEvents('value-changed');
    buttons(el)[0].click(); // icons
    cap.stop();
    expect(cap.events.length).to.equal(1);
    expect(cap.events[0].detail).to.deep.equal({ value: 'icons' });
  });

  it('clicking the CURRENT value emits nothing (early return)', async () => {
    const el = await fixture<MtDisplayToggle>(
      html`<mt-display-toggle .value=${'icons'}></mt-display-toggle>`
    );
    const cap = captureEvents('value-changed');
    buttons(el)[0].click(); // icons (already current)
    cap.stop();
    expect(cap.events.length).to.equal(0);
  });

  it('clicking the current dropdown value emits nothing', async () => {
    const el = await fixture<MtDisplayToggle>(
      html`<mt-display-toggle .value=${'dropdown'}></mt-display-toggle>`
    );
    const cap = captureEvents('value-changed');
    buttons(el)[1].click(); // dropdown (already current)
    cap.stop();
    expect(cap.events.length).to.equal(0);
  });
});
