import { expect } from '@open-wc/testing';
import { spreadAngles } from '../../src/dial/label-spread';

/**
 * Assert two number arrays are equal within a tolerance (PAVA means involve
 * division, so compare with a small epsilon rather than strict equality).
 * @param actual the computed angles
 * @param expected the expected angles
 */
function closeArray(actual: number[], expected: number[]): void {
  expect(actual.length).to.equal(expected.length);
  actual.forEach((v, i) => expect(v).to.be.closeTo(expected[i], 1e-9));
}

describe('spreadAngles', () => {
  it('returns a copy unchanged for fewer than two angles', () => {
    expect(spreadAngles([], 24)).to.deep.equal([]);
    expect(spreadAngles([100], 24)).to.deep.equal([100]);
  });

  it('leaves already-separated angles untouched', () => {
    closeArray(spreadAngles([100, 200], 24), [100, 200]);
  });

  it('spreads two coincident angles symmetrically by the separation', () => {
    closeArray(spreadAngles([100, 100], 24), [88, 112]);
  });

  it('spreads three clustered angles to exactly the separation, centred on their mean', () => {
    closeArray(spreadAngles([100, 101, 102], 24), [77, 101, 125]);
  });

  it('preserves input order when the input is unsorted', () => {
    // sorted: 100,101,102 -> 77,101,125 ; mapped back to original positions.
    closeArray(spreadAngles([102, 100, 101], 24), [125, 77, 101]);
  });

  it('shifts the group up to respect a lower bound', () => {
    // unclamped [88,112] -> min 88 < 95 -> +7
    closeArray(spreadAngles([100, 100], 24, 95), [95, 119]);
  });

  it('shifts the group down to respect an upper bound', () => {
    // unclamped [88,112] -> max 112 > 110 -> -2
    closeArray(spreadAngles([100, 100], 24, undefined, 110), [86, 110]);
  });

  it('does not shift when already within the bounds', () => {
    closeArray(spreadAngles([100, 200], 24, 0, 300), [100, 200]);
  });
});
