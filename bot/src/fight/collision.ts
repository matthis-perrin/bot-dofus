import {Coordinate} from '../../../common/src/coordinates';

export function blockLineOfSight(square: Coordinate, from: Coordinate, to: Coordinate): boolean {
  // Get coordinates of the segments that form the border of the square at the `square` coordinate
  const corners = [
    {x: square.x - 0.5, y: square.y - 0.5},
    {x: square.x - 0.5, y: square.y + 0.5},
    {x: square.x + 0.5, y: square.y + 0.5},
    {x: square.x + 0.5, y: square.y - 0.5},
  ];
  const segments: [Coordinate, Coordinate][] = [
    [corners[0]!, corners[1]!],
    [corners[1]!, corners[2]!],
    [corners[2]!, corners[3]!],
    [corners[3]!, corners[0]!],
  ];

  // `square` blocks the line of sight if one of the segments intercept with the line between `from` and `to`
  return !segments.every(s => !segmentsIntercect(s, [from, to]));
}

function segmentsIntercect(s1: [Coordinate, Coordinate], s2: [Coordinate, Coordinate]): boolean {
  // Check if any of the four points is on the other segment
  if (
    onSegment(s1[0], s2[0], s2[1]) ||
    onSegment(s1[1], s2[0], s2[1]) ||
    onSegment(s2[0], s1[0], s1[1]) ||
    onSegment(s2[1], s1[0], s1[1])
  ) {
    return false;
  }

  // Find the four orientations needed for general and
  // special cases
  const o1 = orientation(s1[0], s1[1], s2[0]);
  const o2 = orientation(s1[0], s1[1], s2[1]);
  const o3 = orientation(s2[0], s2[1], s1[0]);
  const o4 = orientation(s2[0], s2[1], s1[1]);

  // General case
  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  // Special Cases
  if ([o1, o2, o3, o4].includes('Collinear')) {
    throw new Error('Collinear');
  }

  return false; // Doesn't fall in any of the above cases
}

type Orientation = 'Collinear' | 'Clockwise' | 'Counterclowise';

// Find out the orientation of the angle formed by a -> b -> c
function orientation(a: Coordinate, b: Coordinate, c: Coordinate): Orientation {
  const sign = (b.y - a.y) * (c.x - b.x) - (c.y - b.y) * (b.x - a.x);
  return sign === 0 ? 'Collinear' : sign > 0 ? 'Clockwise' : 'Counterclowise';
}

// Checks if point is on the segment [from, to]
function onSegment(point: Coordinate, from: Coordinate, to: Coordinate): boolean {
  return (
    point.x >= Math.min(from.x, to.x) &&
    point.y >= Math.min(from.y, to.y) &&
    point.x <= Math.max(from.x, to.x) &&
    point.y <= Math.max(from.y, to.y) &&
    (point.x - from.x) * (to.y - point.y) === (to.x - point.x) * (point.y - from.y)
  );
}
