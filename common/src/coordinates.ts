export interface Coordinate {
  x: number;
  y: number;
}

export const GAME_WIDTH = 1130;
export const GAME_HEIGHT = 657;

export const HORIZONTAL_SQUARES = 14;
export const VERTICAL_SQUARES = 16;

export const SQUARE_SIZE = {
  width: (2 * GAME_WIDTH) / HORIZONTAL_SQUARES,
  height: (2 * GAME_HEIGHT) / VERTICAL_SQUARES,
};

export const INVENTORY_WIDTH = 6;
export const INVENTORY_HEIGHT = 6;
export const INVENTORY_SQUARE_SCREEN_SIZE = 84;
export const INVENTORY_SQUARE_SCREEN_HGAP = 13;
export const INVENTORY_SQUARE_SCREEN_VGAP = 13;
export const INVENTORY_TOP_LEFT_IMAGE_COORDINATE: Coordinate = {x: 786, y: 288}

export interface InventoryCoordinate {
  row: number;
  column: number;
}

export function mapCoordinateToImageCoordinate(coordinate: Coordinate): Coordinate {
  const {x, y} = coordinate;

  return {
    x: ((y % 2 === 0 ? x : x + 0.5) * SQUARE_SIZE.width) / 2,
    y: (y * SQUARE_SIZE.height) / 4,
  };
}

export function inventoryCoordinateToImageCoordinate(coordinate: InventoryCoordinate): Coordinate {
  const {row, column} = coordinate;

  return {
    x: INVENTORY_TOP_LEFT_IMAGE_COORDINATE.x + column * (INVENTORY_SQUARE_SCREEN_SIZE + INVENTORY_SQUARE_SCREEN_HGAP) / 2,
    y: INVENTORY_TOP_LEFT_IMAGE_COORDINATE.y + row * (INVENTORY_SQUARE_SCREEN_SIZE + INVENTORY_SQUARE_SCREEN_VGAP) / 2,
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

export function squareIsAngle(coordinate: Coordinate): boolean {
  const {x, y} = coordinate;
  return x === 0 || y === 0 || x === HORIZONTAL_SQUARES - 1 || y === VERTICAL_SQUARES - 1;
}
