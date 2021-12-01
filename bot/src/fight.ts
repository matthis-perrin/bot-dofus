import {Coordinate, HORIZONTAL_SQUARES, VERTICAL_SQUARES} from '../../common/src/coordinates';
import {MapScan, SquareType} from '../../common/src/model';
import {blockLineOfSight} from './fight/collision';

// eslint-disable-next-line @typescript-eslint/naming-convention
type Brand<T, Name> = T & {__brand: Name};
export type MapCoordinate = Brand<Coordinate, 'MapCoordinate'>;
export type GridCoordinate = Brand<Coordinate, 'MapCoordinate'>;

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
export function getEnnemiesCoordinates(mapScan: MapScan): MapCoordinate[] {
  return getCoordinatesOfType(mapScan, [SquareType.Blue]);
}
export function getPathCoordinates(mapScan: MapScan): MapCoordinate[] {
  return getCoordinatesOfType(mapScan, [SquareType.Light, SquareType.Dark]);
}
export function getWallCoordinates(mapScan: MapScan): MapCoordinate[] {
  return getCoordinatesOfType(mapScan, [SquareType.Wall]);
}

export function hashCoordinate(coordinate: MapCoordinate | GridCoordinate | Coordinate): string {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (coordinate === undefined) {
    return `?`;
  }
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

function getGridCoordinateNeighbors(c: GridCoordinate): GridCoordinate[] {
  const candidates: GridCoordinate[] = [];
  candidates.push(
    {x: c.x + 1, y: c.y} as GridCoordinate,
    {x: c.x, y: c.y + 1} as GridCoordinate,
    {x: c.x - 1, y: c.y} as GridCoordinate,
    {x: c.x, y: c.y - 1} as GridCoordinate
  );
  return candidates.filter(c => hashCoordinate(c) in gridToMapRegistry);
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

export function getAvailableTargets(
  mapScan: MapScan,
  from: GridCoordinate,
  range: number
): GridCoordinate[] {
  // Find squares that are valid targets from the map scan
  const freeCoordinates = getPathCoordinates(mapScan).map(s => mapToGrid(s));
  // Filter coordinates to only keep the ones at range
  const atRange = freeCoordinates.filter(to => {
    const distance = distanceBetween(from, to);
    return distance > 0 && distance <= range;
  });
  // Filter coordinates to ensure there are no obstacle between them and the from position
  const targetables = atRange.filter(to =>
    hasLineOfSight(
      new Set(
        [
          ...getWallCoordinates(mapScan),
          ...getPlayersCoordinates(mapScan),
          ...getEnnemiesCoordinates(mapScan),
        ].map(s => hashCoordinate(mapToGrid(s)))
      ),
      from,
      to
    )
  );
  return targetables;
}

function isDefined<T>(val: T | undefined): val is T {
  return val !== undefined;
}

export function shortestPathLength(
  mapScan: MapScan,
  from: GridCoordinate,
  to: GridCoordinate
): number | undefined {
  if (from.x === to.x && from.y === to.y) {
    return 0;
  }
  const distances = exploreMap(mapScan, from, () => {});
  const firstNeighbor = getGridCoordinateNeighbors(to)
    .map(n => distances[hashCoordinate(n)])
    .find(isDefined);
  if (!firstNeighbor) {
    return undefined;
  }
  return firstNeighbor.steps + 1;
}

export function firstShortestPaths(
  mapScan: MapScan,
  from: GridCoordinate,
  to: GridCoordinate
): GridCoordinate[] {
  if (from.x === to.x && from.y === to.y) {
    return [];
  }
  const distances = exploreMap(mapScan, from, () => {});
  const targetNeighbors = getGridCoordinateNeighbors(to)
    .map(n => distances[hashCoordinate(n)])
    .filter(isDefined);
  if (targetNeighbors.length === 0) {
    return [];
  }
  const targetDistance: ExplorationResult = {
    coordinate: to,
    parents: targetNeighbors.map(n => n.coordinate),
    steps: targetNeighbors[0]!.steps + 1,
    data: undefined,
  };
  return buildFirstPath(distances, targetDistance).slice(1);
}

export function shortestPathsToLineOfSight(
  mapScan: MapScan,
  from: GridCoordinate,
  to: GridCoordinate,
  opts?: {
    minRange?: number;
    maxRange?: number;
    excludePlayersForLineOfSight?: boolean;
  }
): GridCoordinate[][] {
  // Find squares that can block line of sight
  const sightBlockingCoordinates = new Set(
    [
      ...getWallCoordinates(mapScan),
      ...(opts?.excludePlayersForLineOfSight
        ? []
        : [...getPlayersCoordinates(mapScan), ...getEnnemiesCoordinates(mapScan)]),
    ].map(s => hashCoordinate(mapToGrid(s)))
  );

  const squares = exploreMap(mapScan, from, c => ({
    hasSight: hasLineOfSight(sightBlockingCoordinates, c, to, opts),
  }));
  const squaresWithSight = Object.values(squares)
    .filter(d => d.data.hasSight)
    .sort((d1, d2) => d1.steps - d2.steps);
  const bestSteps = squaresWithSight[0]?.steps;
  if (bestSteps === undefined) {
    return [];
  }
  const bestSquares = squaresWithSight.filter(d => d.steps === bestSteps);
  const paths = bestSquares
    .flatMap(d => buildPaths(squares, d))
    .map(path => path.reverse().slice(1));
  return paths;
}

export function shortestPathsWithoutLineOfSight(
  mapScan: MapScan,
  from: GridCoordinate,
  to: GridCoordinate,
  minRange: number,
  maxRange: number
): GridCoordinate[][] {
  const squares = exploreMap(mapScan, from, c => {
    const distance = distanceBetween(c, to);
    return {isAtRange: distance >= minRange && distance <= maxRange};
  });
  const squaresAtRange = Object.values(squares)
    .filter(d => d.data.isAtRange)
    .sort((d1, d2) => d1.steps - d2.steps);
  const bestSteps = squaresAtRange[0]?.steps;
  if (bestSteps === undefined) {
    return [];
  }
  const bestSquares = squaresAtRange.filter(d => d.steps === bestSteps);
  const paths = bestSquares
    .flatMap(d => buildPaths(squares, d))
    .map(path => path.reverse().slice(1));
  return paths;
}

function buildPaths(
  results: Record<string, ExplorationResult<unknown>>,
  start: ExplorationResult<unknown>
): GridCoordinate[][] {
  if (start.steps === 0) {
    return [[start.coordinate]];
  }
  const res: GridCoordinate[][] = [];
  for (const parent of start.parents) {
    const paths = buildPaths(results, results[hashCoordinate(parent)]!);
    const newPaths = paths.map(p => [start.coordinate, ...p]);
    for (const path of newPaths) {
      res.push(path);
    }
  }
  return res;
}

function buildFirstPath(
  results: Record<string, ExplorationResult<unknown>>,
  start: ExplorationResult<unknown>
): GridCoordinate[] {
  if (start.steps === 0) {
    return [start.coordinate];
  }
  return [
    start.coordinate,
    ...buildFirstPath(results, results[hashCoordinate(start.parents[0]!)]!),
  ];
}

export function hasLineOfSight(
  blockingCoordinatesSet: Set<string>,
  from: GridCoordinate,
  to: GridCoordinate,
  opts?: {
    minRange?: number;
    maxRange?: number;
  }
): boolean {
  // Distance check
  if (opts !== undefined) {
    const {minRange, maxRange} = opts;
    const distance = distanceBetween(from, to);
    if (minRange !== undefined && distance < minRange) {
      return false;
    }
    if (maxRange !== undefined && distance > maxRange) {
      return false;
    }
  }
  // Check every squares in the rectangle area which has [from, to] for diagonal (excluding the from and to coordinates)
  for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x++) {
    for (let y = Math.min(from.y, to.y); y <= Math.max(from.y, to.y); y++) {
      // Don't check the `from` and `to` coordinates
      if ((x === from.x && y === from.y) || (x === to.x && y === to.y)) {
        continue;
      }
      // If there are no obstacles on the square, no need to check
      if (!blockingCoordinatesSet.has(hashCoordinate({x, y}))) {
        continue;
      }
      // If we the square is an obstacle, check if it is in the line of sight
      if (blockLineOfSight({x, y}, from, to)) {
        return false;
      }
    }
  }
  return true;
}

interface ExplorationResult<T = undefined> {
  coordinate: GridCoordinate;
  steps: number;
  parents: GridCoordinate[];
  data: T;
}

function exploreMap<T>(
  mapScan: MapScan,
  from: GridCoordinate,
  analysePosition: (c: GridCoordinate) => T
): Record<string, ExplorationResult<T>> {
  // Find squares where we can move to
  const freeCoordinatesSet = new Set(
    getPathCoordinates(mapScan)
      .map(s => mapToGrid(s))
      .map(hashCoordinate)
  );

  const squaresInfo: Record<string, ExplorationResult<T>> = {
    [hashCoordinate(from)]: {
      coordinate: from,
      steps: 0,
      parents: [],
      data: analysePosition(from),
    },
  };
  const toProcess: GridCoordinate[] = [from];
  while (toProcess.length > 0) {
    const current = toProcess.shift();
    if (current === undefined) {
      throw new Error('exploreMap error, shift failed');
    }
    const currentInfo = squaresInfo[hashCoordinate(current)];
    if (currentInfo === undefined) {
      throw new Error('exploreMap error, lookup failed');
    }
    const neighbors = getGridCoordinateNeighbors(current);
    for (const neighbor of neighbors) {
      const neighborHash = hashCoordinate(neighbor);
      if (!freeCoordinatesSet.has(neighborHash)) {
        continue;
      }
      const neighborInfo = squaresInfo[neighborHash];
      if (neighborInfo === undefined || neighborInfo.steps > currentInfo.steps + 1) {
        squaresInfo[neighborHash] = {
          coordinate: neighbor,
          steps: currentInfo.steps + 1,
          parents: [current],
          data: analysePosition(neighbor),
        };
        toProcess.push(neighbor);
      } else if (neighborInfo.steps === currentInfo.steps + 1) {
        neighborInfo.parents.push(current);
      }
    }
  }
  return squaresInfo;
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
