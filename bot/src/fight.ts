import {Coordinate, HORIZONTAL_SQUARES, VERTICAL_SQUARES} from '../../common/src/coordinates';
import {MapScan, SquareType} from '../../common/src/model';

// eslint-disable-next-line @typescript-eslint/naming-convention
type Brand<T, Name> = T & {__brand: Name};
type MapCoordinate = Brand<Coordinate, 'MapCoordinate'>;
type GridCoordinate = Brand<Coordinate, 'MapCoordinate'>;

function getCoordinatesOfType(mapScan: MapScan, squareTypes: SquareType[]): MapCoordinate[] {
  const coordinates: MapCoordinate[] = [];
  for (const [x, xScan] of Object.entries(mapScan)) {
    for (const [y, type] of Object.entries(xScan)) {
      if (squareTypes.includes(type)) {
        coordinates.push({x: parseFloat(x), y: parseFloat(y)} as MapCoordinate);
      }
    }
  }
  return coordinates;
}

export function getPlayersCoordinates(mapScan: MapScan): MapCoordinate[] {
  return getCoordinatesOfType(mapScan, [SquareType.Red]);
}
function getEnnemiesCoordinates(mapScan: MapScan): MapCoordinate[] {
  return getCoordinatesOfType(mapScan, [SquareType.Blue]);
}
function getPathCoordinates(mapScan: MapScan): MapCoordinate[] {
  return getCoordinatesOfType(mapScan, [SquareType.Light, SquareType.Dark]);
}

function hashCoordinate(coordinate: MapCoordinate | GridCoordinate): string {
  return `${coordinate.x};${coordinate.y}`;
}

type Delta = -1 | 0 | 1;

function getMapCoordinateNeighbors(
  c: MapCoordinate
): {coordinate: MapCoordinate; dx: Delta; dy: Delta}[] {
  const candidates: {coordinate: MapCoordinate; dx: Delta; dy: Delta}[] = [];
  if (c.y % 2 === 0) {
    candidates.push(
      {coordinate: {x: c.x - 1, y: c.y - 1} as MapCoordinate, dx: -1, dy: 0},
      {coordinate: {x: c.x, y: c.y - 1} as MapCoordinate, dx: 0, dy: -1},
      {coordinate: {x: c.x, y: c.y + 1} as MapCoordinate, dx: 1, dy: 0},
      {coordinate: {x: c.x - 1, y: c.y + 1} as MapCoordinate, dx: 0, dy: 1}
    );
  } else {
    candidates.push(
      {coordinate: {x: c.x, y: c.y - 1} as MapCoordinate, dx: -1, dy: 0},
      {coordinate: {x: c.x + 1, y: c.y - 1} as MapCoordinate, dx: 0, dy: -1},
      {coordinate: {x: c.x + 1, y: c.y + 1} as MapCoordinate, dx: 1, dy: 0},
      {coordinate: {x: c.x, y: c.y + 1} as MapCoordinate, dx: 0, dy: 1}
    );
  }
  return candidates.filter(
    ({coordinate: c}) =>
      c.x >= 0 && c.x < HORIZONTAL_SQUARES - (c.y % 2) && c.y >= 0 && c.y < VERTICAL_SQUARES * 2 - 1
  );
}

function buildMapToGrid(
  mapToGrid: Record<string, MapCoordinate>,
  mapCoordinate: MapCoordinate,
  gridCoordinate: GridCoordinate
): void {
  const neighbors = getMapCoordinateNeighbors(mapCoordinate);
  for (const neighbor of neighbors) {
    const key = hashCoordinate(neighbor.coordinate);
    if (key in mapToGrid) {
      continue;
    }
    const neighborCoordinate = {
      x: gridCoordinate.x + neighbor.dx,
      y: gridCoordinate.y + neighbor.dy,
    } as GridCoordinate;
    mapToGrid[key] = neighborCoordinate;
    gridToMapRegistry[hashCoordinate(neighborCoordinate)] = neighbor.coordinate;
    buildMapToGrid(mapToGrid, neighbor.coordinate, neighborCoordinate);
  }
}

function distanceBetween(c1: GridCoordinate, c2: GridCoordinate): number {
  return Math.abs(c1.x - c2.x) + Math.abs(c1.y - c2.y);
}

function getCoordinateInPath(c1: GridCoordinate, c2: GridCoordinate): GridCoordinate[] {
  const xDiff = c2.x - c1.x;
  const yDiff = c2.y - c1.y;
  const xDiffAbs = Math.abs(xDiff);
  const yDiffAbs = Math.abs(yDiff);
  if (xDiffAbs <= 1 && yDiffAbs <= 1) {
    return [];
  }

  const deltas = {dx: 0, dy: 0};
  if (xDiffAbs >= yDiffAbs) {
    deltas.dx = xDiffAbs / xDiff;
  }
  if (xDiffAbs <= yDiffAbs) {
    deltas.dy = yDiffAbs / yDiff;
  }

  const fromC1 = {x: c1.x + deltas.dx, y: c1.y + deltas.dy} as GridCoordinate;
  const fromC2 = {x: c2.x - deltas.dx, y: c2.y - deltas.dy} as GridCoordinate;
  //   console.log({deltas, xDiff, xDiffAbs, yDiff, yDiffAbs, fromC1, fromC2});
  return [fromC1, ...getCoordinateInPath(fromC1, fromC2), fromC2];
}

export function getAvailableTargets(
  mapScan: MapScan,
  from: GridCoordinate,
  range: number
): GridCoordinate[] {
  // Find squares that are valid targets from the map scan
  const freeSquare = getPathCoordinates(mapScan);
  // Convert to grid coordinates
  const freeCoordinates = freeSquare.map(s => mapToGrid(s));
  // Build a set for easy lookup
  const freeCoordinatesSet = new Set(freeCoordinates.map(hashCoordinate));
  // Filter coordinates to only keep the ones at range
  const atRange = freeCoordinates.filter(to => {
    const distance = distanceBetween(from, to);
    return distance > 0 && distance <= range;
  });
  // Filter coordinates to ensure there are no obstacle between them and the from position
  const targetables = atRange.filter(to => {
    const obstacles = getCoordinateInPath(from, to);
    return obstacles.every(c => freeCoordinatesSet.has(hashCoordinate(c)));
  });
  return targetables;
}

const mapToGridRegistry: Record<string, GridCoordinate> = {};
const gridToMapRegistry: Record<string, MapCoordinate> = {};
buildMapToGrid(mapToGridRegistry, {x: 0, y: 0} as MapCoordinate, {x: 0, y: 0} as GridCoordinate);

export function mapToGrid(c: MapCoordinate): GridCoordinate {
  return mapToGridRegistry[hashCoordinate(c)]!;
}

export function gridToMap(c: GridCoordinate): MapCoordinate {
  return gridToMapRegistry[hashCoordinate(c)]!;
}
