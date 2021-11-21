import {gameCoordinates, SQUARE_SIZE} from './model';

export interface Coordinate {
  x: number;
  y: number;
}

export function soleilCoordinateToMapCoordinate(coordinate: Coordinate): Coordinate {
  return {
    x: coordinate.x,
    y: coordinate.y * 2,
  };
}

export function mapCoordinateToImageCoordinate(coordinate: Coordinate): Coordinate {
  const {x, y} = coordinate;

  return {
    x: ((y % 2 === 0 ? x : x + 0.5) * SQUARE_SIZE.width) / 2,
    y: (y * SQUARE_SIZE.height) / 4,
  };
}

export function mapCoordinateToScreenCoordinate(coordinate: Coordinate): Coordinate {
  return imageCoordinateToScreenCoordinate(mapCoordinateToImageCoordinate(coordinate));
}

export function screenCoordinateToImageCoordinate(coordinate: Coordinate): Coordinate {
  const {x, y} = coordinate;
  return {
    x: x - gameCoordinates.x,
    y: y - gameCoordinates.y,
  };
}

export function imageCoordinateToScreenCoordinate(coordinate: Coordinate): Coordinate {
  const {x, y} = coordinate;
  return {
    x: x + gameCoordinates.x,
    y: y + gameCoordinates.y,
  };
}

export function imageCoordinateToMapCoordinate(coordinate: Coordinate): Coordinate {
  let {x, y} = coordinate;

  // Get the "soleil" coordinate (i.e coordinate as if we had square tiles)
  let px = Math.floor(x / (SQUARE_SIZE.width / 2));
  let py = Math.floor(y / (SQUARE_SIZE.height / 2));

  // Normalize the x/y coordinate to get the location within the "soleil" coordinate (min 0, max 1)
  x = x / (SQUARE_SIZE.width / 2) - px;
  y = y / (SQUARE_SIZE.height / 2) - py;

  // Transform the soleil coordinate to map coordinate
  py *= 2;

  // Adjuste the final coordinate based on which "triangle" we are
  if (y >= 0.5) {
    if (x >= 0.5) {
      if (x - 0.5 + (y - 0.5) > 0.5) {
        py++;
      }
    } else if (0.5 - x + (y - 0.5) > 0.5) {
      px--;
      py++;
    }
  } else if (x >= 0.5) {
    if (x - 0.5 + (0.5 - y) > 0.5) {
      py--;
    }
  } else if (0.5 - x + (0.5 - y) > 0.5) {
    px--;
    py--;
  }
  return {x: px, y: py};
}

export function squareCenter(coordinate: Coordinate): Coordinate {
  return {
    x: coordinate.x + SQUARE_SIZE.width / 4,
    y: coordinate.y + SQUARE_SIZE.height / 4,
  };
}
