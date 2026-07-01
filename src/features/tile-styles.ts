import { css } from 'lit';

/**
 * Shared "tile" styling used by both the selector dropdown's tile variant
 * ({@link ../features/dropdown.MtDropdown}) and the entity tile feature
 * ({@link ../features/entity-tile.MtEntityTile}), so the two look identical.
 *
 * A tile is a full-width button with a leading icon chip and a title over its
 * value. The `on` class drives the "active" treatment — extra-rounded corners
 * plus a soft tint of `--mt-tile-accent` (the HVAC mode color for climate
 * selectors, else the primary) — while an "off" tile stays a squarer, neutral
 * surface. The title is intentionally smaller/dimmer than the value, matching
 * the Google Home tiles.
 */
export const tileStyles = css`
  .tile {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    min-height: 56px;
    box-sizing: border-box;
    border: none;
    /* "off" tiles are squarer rounded rectangles; "on" tiles morph to the
       extra-rounded card shape (see the .tile.on rule below). */
    border-radius: var(--mt-shape-chip-square);
    background: var(--mt-surface-container);
    color: var(--mt-on-surface);
    cursor: pointer;
    font: inherit;
    text-align: left;
    transition:
      background-color 200ms cubic-bezier(0.2, 0, 0, 1),
      border-radius 260ms cubic-bezier(0.2, 0, 0, 1),
      color 200ms cubic-bezier(0.2, 0, 0, 1);
    -webkit-tap-highlight-color: transparent;
  }
  .tile:hover {
    background: color-mix(in srgb, var(--mt-on-surface) 6%, var(--mt-surface-container));
  }
  .tile:active {
    background: color-mix(in srgb, var(--mt-on-surface) 12%, var(--mt-surface-container));
  }
  .tile.on {
    /* extra-rounded corners + a soft tint of the accent (the HVAC mode color
       for the climate selector, else the primary). */
    border-radius: var(--mt-shape-card);
    background: color-mix(in srgb, var(--mt-tile-accent, var(--mt-primary)) 16%, var(--mt-surface-container));
    color: var(--mt-tile-accent, var(--mt-primary));
  }
  .tile.on:hover {
    background: color-mix(in srgb, var(--mt-tile-accent, var(--mt-primary)) 22%, var(--mt-surface-container));
  }
  .tile .ic {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    border-radius: var(--mt-shape-full);
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--mt-on-surface-variant) 14%, transparent);
    color: var(--mt-on-surface-variant);
    transition:
      background-color 200ms cubic-bezier(0.2, 0, 0, 1),
      color 200ms cubic-bezier(0.2, 0, 0, 1);
  }
  .tile.on .ic {
    background: color-mix(in srgb, var(--mt-tile-accent, var(--mt-primary)) 26%, transparent);
    color: var(--mt-tile-accent, var(--mt-primary));
  }
  .tile .ic ha-icon {
    --mdc-icon-size: 22px;
  }
  .tile .ic .dot {
    background: currentColor;
  }
  .tile .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .tile .title {
    font-size: var(--md-sys-typescale-label-medium-size, 13px);
    font-weight: 500;
    color: var(--mt-on-surface-variant);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tile.on .title {
    color: currentColor;
  }
  .tile .value {
    font-size: var(--md-sys-typescale-body-large-size, 16px);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--mt-on-surface-variant);
    flex: 0 0 auto;
  }
`;
