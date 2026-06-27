import { fixture, html, expect } from '@open-wc/testing';
import { prettyLabel } from '../../src/theme';
import '../../src/features/selector-row';
import type { MtSelectorRow } from '../../src/features/selector-row';

describe('smoke', () => {
  it('runs a pure function', () => {
    expect(prettyLabel('fan_only')).to.equal('Fan Only');
  });

  it('mounts a Lit component with decorators', async () => {
    const el = await fixture<MtSelectorRow>(html`
      <mt-selector-row
        .items=${[{ value: 'a', label: 'Alpha', icon: 'mdi:a', active: true }]}
      ></mt-selector-row>
    `);
    const chips = el.shadowRoot!.querySelectorAll('.chip');
    expect(chips.length).to.equal(1);
    expect(chips[0].classList.contains('active')).to.be.true;
  });
});
