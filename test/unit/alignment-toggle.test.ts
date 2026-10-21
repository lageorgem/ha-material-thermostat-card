import { fixture, html, expect } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import '../../src/editors/alignment-toggle';
import type { MtAlignmentToggle } from '../../src/editors/alignment-toggle';
import type { FeatureAlignment } from '../../src/types';

function buttons(el: MtAlignmentToggle): HTMLButtonElement[] {
  return Array.from(el.shadowRoot!.querySelectorAll('button'));
}

describe('mt-alignment-toggle', () => {
  it('has a labelled, described group and three named native toggle buttons', async () => {
    const el = await fixture<MtAlignmentToggle>(html`<mt-alignment-toggle></mt-alignment-toggle>`);
    const group = el.shadowRoot!.querySelector('[role="group"]')!;
    expect(group.getAttribute('aria-label')).to.equal('Feature alignment');
    expect(el.shadowRoot!.getElementById(group.getAttribute('aria-describedby')!)!.textContent)
      .to.contain('alone on its row');
    expect(buttons(el).map((b) => b.getAttribute('aria-label'))).to.deep.equal([
      'Align left', 'Align centre', 'Align right',
    ]);
    expect(buttons(el).map((b) => b.getAttribute('aria-pressed'))).to.deep.equal([
      'true', 'false', 'false',
    ]);
    expect(buttons(el).map((b) => b.querySelector('ha-icon')!.getAttribute('icon')))
      .to.deep.equal(['mdi:format-align-left', 'mdi:format-align-center', 'mdi:format-align-right']);
    buttons(el).forEach((b) => {
      expect(b.type).to.equal('button');
      expect(b.tabIndex).to.equal(0);
      expect(b.getBoundingClientRect().width).to.be.at.least(24);
      expect(b.getBoundingClientRect().height).to.be.at.least(24);
    });
  });

  it('normalizes unknown values to left and ignores the selected button', async () => {
    const el = await fixture<MtAlignmentToggle>(html`<mt-alignment-toggle
      .value=${'unknown' as FeatureAlignment}
    ></mt-alignment-toggle>`);
    const events: Event[] = [];
    el.addEventListener('alignment-changed', (e) => events.push(e));
    expect(buttons(el)[0].getAttribute('aria-pressed')).to.equal('true');
    buttons(el)[0].click();
    expect(events).to.have.length(0);
  });

  it('emits only alignment-changed, once, bubbling and composed; supports all selections', async () => {
    const el = await fixture<MtAlignmentToggle>(html`<mt-alignment-toggle></mt-alignment-toggle>`);
    const events: CustomEvent[] = [];
    const generic: Event[] = [];
    el.addEventListener('alignment-changed', (e) => events.push(e as CustomEvent));
    el.addEventListener('value-changed', (e) => generic.push(e));
    for (const [index, value] of [[1, 'center'], [2, 'right'], [0, 'left']] as const) {
      buttons(el)[index].click();
      const event = events[events.length - 1];
      expect(event.detail).to.deep.equal({ value });
      expect(event.bubbles).to.equal(true);
      expect(event.composed).to.equal(true);
      el.value = value;
      await el.updateComplete;
      expect(buttons(el)[index].getAttribute('aria-pressed')).to.equal('true');
      buttons(el)[index].click();
    }
    expect(events).to.have.length(3);
    expect(generic).to.have.length(0);
  });

  it('uses native Enter and Space activation without duplicate events', async () => {
    const el = await fixture<MtAlignmentToggle>(html`<mt-alignment-toggle></mt-alignment-toggle>`);
    const values: FeatureAlignment[] = [];
    el.addEventListener('alignment-changed', (e) => values.push((e as CustomEvent).detail.value));
    buttons(el)[1].focus();
    await sendKeys({ press: 'Enter' });
    expect(buttons(el)[1].matches(':focus-visible')).to.equal(true);
    expect(getComputedStyle(buttons(el)[1]).outlineStyle).to.equal('solid');
    expect(getComputedStyle(buttons(el)[1]).outlineWidth).to.equal('2px');
    buttons(el)[2].focus();
    await sendKeys({ press: 'Space' });
    expect(values).to.deep.equal(['center', 'right']);
  });
});
