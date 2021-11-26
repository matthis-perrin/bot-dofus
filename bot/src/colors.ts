import {getPixelColor, moveMouse} from 'robotjs';

import {Coordinate} from '../../common/src/coordinates';
import {imageCoordinateToScreenCoordinate} from './coordinate';

interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function getColorAverage(coordinates: Coordinate[]): Rgb {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const c of coordinates) {
    const coordinate = imageCoordinateToScreenCoordinate(c);
    const {x, y} = coordinate;
    const color = getPixelColor(x, y);
    const rgb = hexToRgb(color);
    r += rgb.r;
    g += rgb.g;
    b += rgb.b;
  }
  return {
    r: Math.round(r / coordinates.length),
    g: Math.round(g / coordinates.length),
    b: Math.round(b / coordinates.length),
  };
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

export function checkForColor(coordinates: Coordinate[], targetColor: string): boolean {
  const color = hexToRgb(targetColor);
  const colorAverage = getColorAverage(coordinates);
  const distance = colorDistance(colorAverage, color);
  console.log(colorAverage, color, distance);
  return distance <= 25;
}
