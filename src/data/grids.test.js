import { describe, it, expect } from 'vitest';
import { VALID_GRID_SQUARES } from './grids.js';

describe('VALID_GRID_SQUARES', () => {
  it('includes known ZS grid squares', () => {
    expect(VALID_GRID_SQUARES.has('KG44')).toBe(true); // Div6
    expect(VALID_GRID_SQUARES.has('KF15')).toBe(true);  // Div1/Div2 overlap
  });

  it('includes neighboring-country grids', () => {
    expect(VALID_GRID_SQUARES.has('JG73')).toBe(true); // Namibia
    expect(VALID_GRID_SQUARES.has('KH31')).toBe(true); // Zimbabwe
  });

  it('does NOT include a made-up grid square', () => {
    expect(VALID_GRID_SQUARES.has('AA00')).toBe(false);
  });
});