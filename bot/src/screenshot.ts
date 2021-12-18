import Jimp, {MIME_PNG} from 'jimp';
import {screen} from 'robotjs';

import {
  Coordinate,
  GAME_HEIGHT,
  GAME_WIDTH,
  HORIZONTAL_SQUARES,
  mapCoordinateToImageCoordinate,
  SQUARE_SIZE,
  VERTICAL_SQUARES,
} from '../../common/src/coordinates';
import {fishPopupScreenshotSize, MapScan, SquareType} from '../../common/src/model';
import {BLUE, colorDistance, getColorAverage, hexToRgb, RED, Rgb} from './colors';
import {gameCoordinates} from './coordinate';
import {addScreenshot} from './logger';

export interface RgbImage {
  data: Uint8Array;
  width: number;
  height: number;
}

interface CharacterSquareScreenshot {
  coordinate: Coordinate;
  image: RgbImage;
}

const ALL_SOLEIL_POS: Coordinate[] = [];
for (let x = 0; x < HORIZONTAL_SQUARES; x++) {
  ALL_SOLEIL_POS.push({x, y: 0}, {x, y: VERTICAL_SQUARES - 1});
}
for (let y = 1; y < VERTICAL_SQUARES - 1; y++) {
  ALL_SOLEIL_POS.push({x: 0, y}, {x: HORIZONTAL_SQUARES - 1, y});
}

const ALL_SQUARE_POS: Coordinate[] = [];
for (let y = 0; y < VERTICAL_SQUARES * 2 - 1; y++) {
  for (let x = 0; x < HORIZONTAL_SQUARES - (y % 2); x++) {
    ALL_SQUARE_POS.push({x, y});
  }
}

function identifyColor(circleColor: Rgb, squareColor: Rgb): SquareType {
  const circleTypesAndDistance: [SquareType, number][] = [
    [SquareType.Red, colorDistance(circleColor, hexToRgb(RED))],
    [SquareType.Blue, colorDistance(circleColor, hexToRgb(BLUE))],
  ];
  const squareTypesAndDistance: [SquareType, number][] = [
    [SquareType.Light, colorDistance(squareColor, hexToRgb('#84878c'))],
    [SquareType.Dark, colorDistance(squareColor, hexToRgb('#777a7f'))],
    [SquareType.Wall, colorDistance(squareColor, hexToRgb('#c8c8c8'))],
  ];
  const circleType = circleTypesAndDistance
    .filter(v => v[1] < 25)
    .sort((v1, v2) => v1[1] - v2[1])[0];
  const squareType = squareTypesAndDistance
    .filter(v => v[1] < 25)
    .sort((v1, v2) => v1[1] - v2[1])[0];
  return circleType?.[0] ?? squareType?.[0] ?? SquareType.Unknown;
}

function getOffsets(x: number, y: number): Coordinate[] {
  const bottom = {x: 41, y: 33};
  const left = {x: 15, y: 20};
  const right = {x: 67, y: 20};
  if (x === HORIZONTAL_SQUARES - 1 && y === 0) {
    return [bottom];
  }
  if (x === HORIZONTAL_SQUARES - 1 && y === 2 * VERTICAL_SQUARES - 4) {
    return [left, bottom];
  }
  if (x === HORIZONTAL_SQUARES - 2 && y === 2 * VERTICAL_SQUARES - 4) {
    return [left, bottom];
  }
  if (x === HORIZONTAL_SQUARES - 1 && y === 2 * VERTICAL_SQUARES - 2) {
    return [left, bottom];
  }
  if (x === HORIZONTAL_SQUARES - 2 && y === 2 * VERTICAL_SQUARES - 5) {
    return [bottom];
  }
  return [left, right];
}

export function scanMap(): MapScan {
  // Take a screenshot of the game zone
  const {x, y} = gameCoordinates;
  const bitmap: Buffer = screen.capture(x, y, GAME_WIDTH, GAME_HEIGHT).image;

  // Utility to extract colors at a square coordinates on multiple offset
  // and compute the average
  function findPixelColor(x: number, y: number, offsets: Coordinate[]): Rgb {
    const imageCoordinate = mapCoordinateToImageCoordinate({x, y});
    const colors: Rgb[] = [];

    for (const imageOffset of offsets) {
      const imageX = Math.floor(imageCoordinate.x + imageOffset.x);
      const imageY = Math.floor(imageCoordinate.y + imageOffset.y);
      const offset = (imageY * 2 * GAME_WIDTH * 2 + imageX * 2) * 4;

      const color = {
        r: bitmap[offset + 2]!,
        g: bitmap[offset + 1]!,
        b: bitmap[offset]!,
      };

      colors.push(color);
    }

    return getColorAverage(colors);
  }

  const scan: MapScan = {};
  for (const {x, y} of ALL_SQUARE_POS) {
    // Identify square type
    const isTopRight = x === HORIZONTAL_SQUARES - 1 && y === 0;
    const circleColor = findPixelColor(x, y, getOffsets(x, y));
    const squareColor = isTopRight ? circleColor : findPixelColor(x, y, [{x: 40, y: 15}]);
    const squareType = identifyColor(circleColor, squareColor);

    // Add to map scan
    const scanX = scan[x];
    if (scanX === undefined) {
      scan[x] = {[y]: squareType};
    } else {
      scanX[y] = squareType;
    }
  }

  return scan;
}

export function screenshot(): {
  game: RgbImage;
  characterSquares: CharacterSquareScreenshot[];
} {
  // Take a screenshot of the game zone
  const {x, y} = gameCoordinates;
  const bitmap: Buffer = screen.capture(x, y, GAME_WIDTH, GAME_HEIGHT).image;

  // Convert from BGRA to RGB
  const game = Buffer.allocUnsafe(2 * GAME_WIDTH * 2 * GAME_HEIGHT * 3);
  for (let sourceIndex = 0; sourceIndex < bitmap.length; sourceIndex += 4) {
    const targetIndex = (3 * sourceIndex) / 4;
    [game[targetIndex], game[targetIndex + 1], game[targetIndex + 2]] = [
      bitmap[sourceIndex + 2]!,
      bitmap[sourceIndex + 1]!,
      bitmap[sourceIndex]!,
    ];
  }

  const gameImage = {data: game, width: 2 * GAME_WIDTH, height: 2 * GAME_HEIGHT};
  addScreenshot(gameImage);

  const characterSquares = ALL_SQUARE_POS.filter(p => p.y < VERTICAL_SQUARES * 2 - 3).map(pos => {
    const {x, y} = mapCoordinateToImageCoordinate(pos);
    const xPx = Math.round(x * 2);
    const yPx = Math.round(y * 2);
    const wPx = Math.round(SQUARE_SIZE.width);
    const hPx = Math.round(SQUARE_SIZE.height * 2);
    const buffer = Buffer.allocUnsafe(wPx * hPx * 3);
    for (let i = 0; i < hPx; i++) {
      game.copy(
        buffer,
        i * wPx * 3,
        (xPx + (yPx + i) * GAME_WIDTH * 2) * 3,
        (xPx + (yPx + i) * GAME_WIDTH * 2 + wPx) * 3
      );
    }
    return {
      coordinate: {x: pos.x, y: pos.y},
      image: {
        data: buffer,
        width: wPx,
        height: hPx,
      },
    };
  });

  return {game: gameImage, characterSquares};
}

export function fishingPopupScreenshot(mousePos: Coordinate): RgbImage {
  const bitmap = screen.capture();
  const sourceBuffer = bitmap.image;
  const x = mousePos.x * 2;
  const y = mousePos.y * 2;
  const w = fishPopupScreenshotSize.width * 2;
  const h = fishPopupScreenshotSize.height * 2;
  const pixels = w * h;

  // Convert from BGRA to RGB
  const popupImage = Buffer.allocUnsafe(pixels * 3);
  for (let targetIndex = 0; targetIndex < pixels * 3; targetIndex += 3) {
    const targetPx = targetIndex / 3;
    const targetX = targetPx % w;
    const targetY = Math.floor(targetPx / w);
    const sourceIndex = ((targetY + y) * bitmap.width + targetX + x) * 4;
    [popupImage[targetIndex], popupImage[targetIndex + 1], popupImage[targetIndex + 2]] = [
      sourceBuffer[sourceIndex + 2]!,
      sourceBuffer[sourceIndex + 1]!,
      sourceBuffer[sourceIndex]!,
    ];
  }

  return {data: popupImage, width: w, height: h};
}

export async function convertToPng(
  img: RgbImage,
  resize?: {width: number; height: number},
  crop?: {x: number; y: number; width: number; height: number}
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    // eslint-disable-next-line no-new
    new Jimp(img.width, img.height, (err, jimpImage) => {
      if (err) {
        reject(err);
      }
      const jimpBuffer = jimpImage.bitmap.data;
      for (let x = 0; x < img.width; x++) {
        for (let y = 0; y < img.height; y++) {
          const srcOffset = (y * img.width + x) * 3;
          const dstOffset = (y * img.width + x) * 4;
          jimpBuffer[dstOffset] = img.data[srcOffset]!;
          jimpBuffer[dstOffset + 1] = img.data[srcOffset + 1]!;
          jimpBuffer[dstOffset + 2] = img.data[srcOffset + 2]!;
          jimpBuffer[dstOffset + 3] = 255;
        }
      }
      const resizedImage = resize ? jimpImage.resize(resize.width, resize.height) : jimpImage;
      const croppedImage = crop
        ? resizedImage.crop(crop.x * 2, crop.y * 2, crop.width * 2, crop.height * 2)
        : resizedImage;
      resolve(croppedImage.getBufferAsync(MIME_PNG));
    });
  });
}
