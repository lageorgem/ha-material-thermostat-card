import { expect } from '@open-wc/testing';
import { applyCardTheme, type HassThemes } from '../../src/apply-theme';

describe('applyCardTheme', () => {
  let element: HTMLElement;
  let themes: HassThemes;

  beforeEach(() => {
    element = document.createElement('div');
    themes = { themes: {
      base: { 'primary-color': '#AbC', 'accent-color': '#123456', 'text-color': 'red', 'rgb-custom': '#fff' },
      next: { 'primary-color': 'blue' },
      modes: { 'primary-color': '#000', 'base-only': 'base', modes: {
        light: { 'primary-color': '#fff', 'light-only': 'light' },
        dark: { 'primary-color': '#123', 'dark-only': 'dark' },
      } },
      empty: { modes: {} },
      explicit: { 'primary-color': '#fff', 'rgb-primary-color': '1, 2, 3' },
    } };
  });

  it('sets base variables and expands only three/six-digit hex colours', () => {
    applyCardTheme(element, themes, 'base');
    expect(element.style.getPropertyValue('--primary-color')).to.equal('#AbC');
    expect(element.style.getPropertyValue('--rgb-primary-color')).to.equal('170, 187, 204');
    expect(element.style.getPropertyValue('--rgb-accent-color')).to.equal('18, 52, 86');
    expect(element.style.getPropertyValue('--text-color')).to.equal('red');
    expect(element.style.getPropertyValue('--rgb-text-color')).to.equal('');
    expect(element.style.getPropertyValue('--rgb-custom')).to.equal('#fff');
    expect(element.style.getPropertyValue('--rgb-rgb-custom')).to.equal('');
    themes.themes.invalid = { short: '#12', alpha: '#1234', long: '#12345678', invalid: '#gggggg' };
    applyCardTheme(element, themes, 'invalid');
    expect([...element.style].filter((key) => key.startsWith('--rgb-'))).to.deep.equal([]);
  });

  it('merges light/dark overrides and removes obsolete mode variables', () => {
    for (const darkMode of [false, true]) {
      applyCardTheme(element, { ...themes, darkMode }, 'modes');
      expect(element.style.getPropertyValue('--primary-color')).to.equal(darkMode ? '#123' : '#fff');
      expect(element.style.getPropertyValue('--rgb-primary-color')).to.equal(darkMode ? '17, 34, 51' : '255, 255, 255');
      expect(element.style.getPropertyValue('--base-only')).to.equal('base');
      expect(element.style.getPropertyValue(`--${darkMode ? 'dark' : 'light'}-only`)).not.to.equal('');
      expect(element.style.getPropertyValue(`--${darkMode ? 'light' : 'dark'}-only`)).to.equal('');
      expect(element.style.getPropertyValue('--modes')).to.equal('');
    }
    applyCardTheme(element, themes, 'empty');
    expect(element.style.length).to.equal(0);
    themes.themes.partial = { 'base-only': 'base', modes: { dark: { 'dark-only': 'dark' } } };
    applyCardTheme(element, themes, 'partial');
    expect(element.style.getPropertyValue('--base-only')).to.equal('base');
  });

  it('removes obsolete theme and generated keys without touching foreign styles', () => {
    element.style.setProperty('--foreign', 'keep');
    element.style.color = 'red';
    applyCardTheme(element, themes, 'base');
    applyCardTheme(element, themes, 'next');
    expect(element.style.getPropertyValue('--primary-color')).to.equal('blue');
    expect(element.style.getPropertyValue('--accent-color')).to.equal('');
    expect(element.style.getPropertyValue('--rgb-primary-color')).to.equal('');
    expect(element.style.getPropertyValue('--foreign')).to.equal('keep');
    expect(element.style.color).to.equal('red');
    const other = document.createElement('div');
    applyCardTheme(other, themes, 'base');
    applyCardTheme(element, themes, undefined);
    expect(other.style.getPropertyValue('--primary-color')).to.equal('#AbC');
  });

  for (const reason of ['unset', 'unknown', 'missing themes'] as const) {
    it(`clears its own styles for ${reason}`, () => {
      applyCardTheme(element, themes, 'base');
      applyCardTheme(element, reason === 'missing themes' ? undefined : themes, reason === 'unset' ? undefined : 'unknown');
      expect(element.style.length).to.equal(0);
      applyCardTheme(element, undefined, undefined);
      expect(element.style.length).to.equal(0);
    });
  }

  it('preserves explicitly supplied rgb variables', () => {
    applyCardTheme(element, themes, 'explicit');
    expect(element.style.getPropertyValue('--rgb-primary-color')).to.equal('1, 2, 3');
  });
});
