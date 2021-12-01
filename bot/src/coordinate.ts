import {getScreenSize} from 'robotjs';

import {Coordinate, GAME_WIDTH, mapCoordinateToImageCoordinate} from '../../common/src/coordinates';

const {width, height} = getScreenSize();

export const gameCoordinates = {
  x: width - GAME_WIDTH,
  y: height > 900 ? 133 / 2 : 54,
};
export const safeZone = {x: 563, y: 675};

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
