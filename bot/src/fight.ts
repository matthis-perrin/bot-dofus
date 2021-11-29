import {Coordinate, HORIZONTAL_SQUARES, VERTICAL_SQUARES} from '../../common/src/coordinates';
import {MapScan, SquareType} from '../../common/src/model';
import {ScenarioContext} from './scenario_runner';

function getCoordinatesOfType(mapScan: MapScan, squareTypes: SquareType[]): Coordinate[] {
  const coordinates: Coordinate[] = [];
  for (const [x, xScan] of Object.entries(mapScan)) {
    for (const [y, type] of Object.entries(xScan)) {
      if (squareTypes.includes(type)) {
        coordinates.push({x: parseFloat(x), y: parseFloat(y)});
      }
    }
  }
  return coordinates;
}

export function getPlayersCoordinates(mapScan: MapScan): Coordinate[] {
  return getCoordinatesOfType(mapScan, [SquareType.Red]);
}
export function getEnnemiesCoordinates(mapScan: MapScan): Coordinate[] {
  return getCoordinatesOfType(mapScan, [SquareType.Blue]);
}
export function getPathCoordinates(mapScan: MapScan): Coordinate[] {
  return getCoordinatesOfType(mapScan, [SquareType.Light, SquareType.Dark]);
}

function hashCoordinate(coordinate: Coordinate): string {
  return `${coordinate.x};${coordinate.y}`;
}

type Delta = -1 | 0 | 1;

function getMapCoordinateNeighbors(
  c: Coordinate
): {coordinate: Coordinate; dx: Delta; dy: Delta}[] {
  const candidates: {coordinate: Coordinate; dx: Delta; dy: Delta}[] = [];
  if (c.y % 2 === 0) {
    candidates.push(
      {coordinate: {x: c.x - 1, y: c.y - 1}, dx: -1, dy: 0},
      {coordinate: {x: c.x, y: c.y - 1}, dx: 0, dy: -1},
      {coordinate: {x: c.x, y: c.y + 1}, dx: 1, dy: 0},
      {coordinate: {x: c.x - 1, y: c.y + 1}, dx: 0, dy: 1}
    );
  } else {
    candidates.push(
      {coordinate: {x: c.x, y: c.y - 1}, dx: -1, dy: 0},
      {coordinate: {x: c.x + 1, y: c.y - 1}, dx: 0, dy: -1},
      {coordinate: {x: c.x + 1, y: c.y + 1}, dx: 1, dy: 0},
      {coordinate: {x: c.x, y: c.y + 1}, dx: 0, dy: 1}
    );
  }
  return candidates.filter(
    ({coordinate: c}) =>
      c.x >= 0 && c.x < HORIZONTAL_SQUARES - (c.y % 2) && c.y >= 0 && c.y < VERTICAL_SQUARES * 2 - 1
  );
}

function buildMapToGrid(
  mapToGrid: Record<string, Coordinate>,
  mapCoordinate: Coordinate,
  gridCoordinate: Coordinate
): void {
  const neighbors = getMapCoordinateNeighbors(mapCoordinate);
  console.log('buildMapToGrid', mapCoordinate, gridCoordinate, neighbors);
  for (const neighbor of neighbors) {
    const key = hashCoordinate(neighbor.coordinate);
    if (key in mapToGrid) {
      continue;
    }
    const neighborGridCoordinate = {
      x: gridCoordinate.x + neighbor.dx,
      y: gridCoordinate.y + neighbor.dy,
    };
    console.log('set', key, 'to', neighborGridCoordinate);
    mapToGrid[key] = neighborGridCoordinate;
    buildMapToGrid(mapToGrid, neighbor.coordinate, neighborGridCoordinate);
  }
}

const mapToGrid: Record<string, Coordinate> = {};
buildMapToGrid(mapToGrid, {x: 0, y: 0}, {x: 0, y: 0});
export async function test(): Promise<void> {
  console.log(mapToGrid);
}
