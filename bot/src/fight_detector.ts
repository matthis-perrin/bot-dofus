import {getPixelColor} from 'robotjs';

import {Coordinate} from '../../common/src/coordinates';
import {imageCoordinateToScreenCoordinate} from './coordinate';

const topCoordinates: Coordinate[] = [
  {x: 1095, y: 740},
  {x: 1095, y: 755},
  {x: 1095, y: 770},
];
const bottomCoordinates: Coordinate[] = [
  {x: 1095, y: 795},
  {x: 1095, y: 810},
  {x: 1095, y: 825},
];

function getColorAverage(coordinates: Coordinate[]): {r: number; g: number; b: number} {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const c of coordinates) {
    const coordinate = imageCoordinateToScreenCoordinate(c);
    const {x, y} = coordinate;
    const color = getPixelColor(x, y);
    r += parseInt(color.slice(0, 2), 16);
    g += parseInt(color.slice(2, 4), 16);
    b += parseInt(color.slice(4, 6), 16);
  }
  return {
    r: Math.round(r / coordinates.length),
    g: Math.round(g / coordinates.length),
    b: Math.round(b / coordinates.length),
  };
}

export function isInFight(): boolean {
  const topColor = getColorAverage(topCoordinates);
  const bottomColor = getColorAverage(bottomCoordinates);
  const topIsLighter =
    topColor.r + topColor.g + topColor.b > bottomColor.r + bottomColor.g + bottomColor.b;
  return topIsLighter;
}
