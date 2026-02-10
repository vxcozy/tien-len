export interface SeatPosition {
  x: number;
  y: number;
  labelAnchor: 'top' | 'bottom' | 'left' | 'right';
}

/** Percentage-based positions for each seat around the elliptical table */
export const SEAT_POSITIONS: Record<number, SeatPosition[]> = {
  2: [
    { x: 50, y: 88, labelAnchor: 'bottom' },
    { x: 50, y: 10, labelAnchor: 'top' },
  ],
  3: [
    { x: 50, y: 88, labelAnchor: 'bottom' },
    { x: 12, y: 30, labelAnchor: 'left' },
    { x: 88, y: 30, labelAnchor: 'right' },
  ],
  4: [
    { x: 50, y: 88, labelAnchor: 'bottom' },
    { x: 8, y: 50, labelAnchor: 'left' },
    { x: 50, y: 8, labelAnchor: 'top' },
    { x: 92, y: 50, labelAnchor: 'right' },
  ],
  5: [
    { x: 50, y: 88, labelAnchor: 'bottom' },
    { x: 8, y: 55, labelAnchor: 'left' },
    { x: 22, y: 10, labelAnchor: 'top' },
    { x: 78, y: 10, labelAnchor: 'top' },
    { x: 92, y: 55, labelAnchor: 'right' },
  ],
  6: [
    { x: 50, y: 88, labelAnchor: 'bottom' },
    { x: 8, y: 55, labelAnchor: 'left' },
    { x: 20, y: 10, labelAnchor: 'top' },
    { x: 50, y: 5, labelAnchor: 'top' },
    { x: 80, y: 10, labelAnchor: 'top' },
    { x: 92, y: 55, labelAnchor: 'right' },
  ],
  7: [
    { x: 50, y: 88, labelAnchor: 'bottom' },
    { x: 12, y: 72, labelAnchor: 'left' },
    { x: 5, y: 38, labelAnchor: 'left' },
    { x: 22, y: 8, labelAnchor: 'top' },
    { x: 50, y: 5, labelAnchor: 'top' },
    { x: 78, y: 8, labelAnchor: 'top' },
    { x: 95, y: 38, labelAnchor: 'right' },
  ],
  8: [
    { x: 50, y: 88, labelAnchor: 'bottom' },
    { x: 12, y: 72, labelAnchor: 'left' },
    { x: 5, y: 38, labelAnchor: 'left' },
    { x: 22, y: 8, labelAnchor: 'top' },
    { x: 50, y: 5, labelAnchor: 'top' },
    { x: 78, y: 8, labelAnchor: 'top' },
    { x: 95, y: 38, labelAnchor: 'right' },
    { x: 88, y: 72, labelAnchor: 'right' },
  ],
};
