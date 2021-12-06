import {getPixelColor} from 'robotjs';

import {Coordinate} from '../../common/src/coordinates';
import {imageCoordinateToScreenCoordinate} from './coordinate';

const OLD_MAC_ORANGE = '#fc6621';
const NEW_MAC_ORANGE = '#ed702d';
export const ORANGE = averageHex(OLD_MAC_ORANGE, NEW_MAC_ORANGE);

const OLD_MAC_BLUE = '#0b24fb';
const NEW_MAC_BLUE = '#0000f5';
export const BLUE = averageHex(OLD_MAC_BLUE, NEW_MAC_BLUE);

const OLD_MAC_RED = '#fc0d1d';
const NEW_MAC_RED = '#ea3323';
export const RED = averageHex(OLD_MAC_RED, NEW_MAC_RED);

const OLD_MAC_GREEN = '#149718';
const NEW_MAC_GREEN = '#43972a';
export const GREEN = averageHex(OLD_MAC_GREEN, NEW_MAC_GREEN);

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

function averageHex(hex1: string, hex2: string): string {
  return rgbToHex(getColorAverage([hexToRgb(hex1), hexToRgb(hex2)]));
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
      // const s = imageCoordinateToScreenCoordinate(c);
      // moveMouseSmooth(s.x, s.y);
      const coordinate = imageCoordinateToScreenCoordinate(c);
      const {x, y} = coordinate;
      const color = getPixelColor(x, y);
      return hexToRgb(color);
    })
  );
}

export function hexToRgb(color: string): Rgb {
  const c = color.startsWith('#') ? color.slice(1) : color;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return {r, g, b};
}

function num(n: number): string {
  const s = n.toString(16);
  return s.length > 1 ? s : `0${s}`;
}
export function rgbToHex(rgb: Rgb): string {
  return `#${num(rgb.r)}${num(rgb.g)}${num(rgb.b)}`;
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
  if (distance <= tolerance && distance > 0) {
    console.log({
      color,
      colorHex: rgbToHex(color),
      colorAverage,
      averageHex: rgbToHex(colorAverage),
      distance,
    });
  }
  return distance <= tolerance;
}
