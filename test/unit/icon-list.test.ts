import { expect } from '@open-wc/testing';
import { loadIconItems, resetIconItemsForTest } from '../../src/editors/icon-list';

describe('loadIconItems', () => {
  let saved: unknown;

  beforeEach(() => {
    resetIconItemsForTest();
    saved = (window as unknown as { customIcons?: unknown }).customIcons;
  });
  afterEach(() => {
    (window as unknown as { customIcons?: unknown }).customIcons = saved;
    resetIconItemsForTest();
  });

  it('returns the curated MDI common set (mdi:-prefixed)', async () => {
    (window as unknown as { customIcons?: unknown }).customIcons = undefined;
    const items = await loadIconItems();
    expect(items.length).to.be.greaterThan(50);
    expect(items.every((i) => i.value.startsWith('mdi:'))).to.be.true;
    expect(items.some((i) => i.value === 'mdi:home')).to.be.true;
  });

  it('memoizes the result', async () => {
    (window as unknown as { customIcons?: unknown }).customIcons = undefined;
    const a = await loadIconItems();
    const b = await loadIconItems();
    expect(b).to.equal(a);
  });

  it('merges registered custom icon sets via getIconList, skipping sets without one', async () => {
    (window as unknown as { customIcons?: unknown }).customIcons = {
      mt: { getIconList: async () => [{ name: 'swing-x', keywords: ['ac'] }] },
      noList: { getIcon: async () => ({ path: '' }) },
    };
    const items = await loadIconItems();
    expect(items.some((i) => i.value === 'mt:swing-x')).to.be.true;
    expect(items.some((i) => i.value.startsWith('noList:'))).to.be.false;
  });

  it('ignores a custom set whose getIconList throws', async () => {
    (window as unknown as { customIcons?: unknown }).customIcons = {
      bad: {
        getIconList: async () => {
          throw new Error('boom');
        },
      },
    };
    const items = await loadIconItems();
    expect(items.some((i) => i.value === 'mdi:home')).to.be.true;
    expect(items.some((i) => i.value.startsWith('bad:'))).to.be.false;
  });
});
