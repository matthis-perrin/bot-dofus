import {getPixelColor} from 'robotjs';

import {Coordinate} from '../../common/src/coordinates';
import {imageCoordinateToScreenCoordinate} from './coordinate';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function getColorAverage(colors: Rgb[]): Rgb {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const rgb of colors) {
    r += rgb.r;
    g += rgb.g;
    b += rgb.b;
  }
  return {
    r: Math.round(r / colors.length),
    g: Math.round(g / colors.length),
    b: Math.round(b / colors.length),
  };
}

export function fetchColorAverage(coordinates: Coordinate[]): Rgb {
  return getColorAverage(
    coordinates.map(c => {
      const coordinate = imageCoordinateToScreenCoordinate(c);
      const {x, y} = coordinate;
      const color = getPixelColor(x, y);
      return hexToRgb(color);
    })
  );
}

export function hexToRgb(color: string): Rgb {
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  return {r, g, b};
}

export function colorDistance(color1: Rgb, color2: Rgb): number {
  return (
    (Math.abs(color1.r - color2.r) +
      Math.abs(color1.g - color2.g) +
      Math.abs(color1.b - color2.b)) /
    3
  );
}

export function checkForColor(
  coordinates: Coordinate[],
  targetColor: string,
  tolerance = 25
): boolean {
  const color = hexToRgb(targetColor);
  const colorAverage = fetchColorAverage(coordinates);
  const distance = colorDistance(colorAverage, color);
  return distance <= tolerance;
}
