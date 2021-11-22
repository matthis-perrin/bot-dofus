import {writeFileSync} from 'fs';
import Jimp, {MIME_PNG, RESIZE_BILINEAR, RESIZE_NEAREST_NEIGHBOR} from 'jimp';
import {screen} from 'robotjs';

import {
  Coordinate,
  gameCoordinates,
  HORIZONTAL_SQUARES,
  SQUARE_SIZE,
  VERTICAL_SQUARES,
} from '../../common/src/coordinates';
import {fishPopupScreenshotSize} from '../../common/src/model';

export interface RgbImage {
  data: Uint8Array;
  width: number;
  height: number;
}

interface SquareScreenshot {
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

export function screenshot(): {
  game: RgbImage;
  border: SquareScreenshot[];
} {
  // Take a screenshot of the game zone
  const {x, y, width, height} = gameCoordinates;
  const bitmap: Buffer = screen.capture(x, y, width, height).image;

  // Convert from BGRA to RGB
  const game = Buffer.allocUnsafe(2 * width * 2 * height * 3);
  for (let sourceIndex = 0; sourceIndex < bitmap.length; sourceIndex += 4) {
    const targetIndex = (3 * sourceIndex) / 4;
    [game[targetIndex], game[targetIndex + 1], game[targetIndex + 2]] = [
      bitmap[sourceIndex + 2]!,
      bitmap[sourceIndex + 1]!,
      bitmap[sourceIndex]!,
    ];
  }

  const soleils = ALL_SOLEIL_POS.map(soleil => {
    const xPx = Math.round(soleil.x * SQUARE_SIZE.width);
    const yPx = Math.round(soleil.y * SQUARE_SIZE.height);
    const wPx = Math.round(SQUARE_SIZE.width);
    const hPx = Math.round(SQUARE_SIZE.height);
    const buffer = Buffer.allocUnsafe(wPx * hPx * 3);
    for (let i = 0; i < hPx; i++) {
      game.copy(
        buffer,
        i * wPx * 3,
        (xPx + (yPx + i) * width * 2) * 3,
        (xPx + (yPx + i) * width * 2 + wPx) * 3
      );
    }
    return {
      coordinate: soleil,
      image: {
        data: buffer,
        width: wPx,
        height: hPx,
      },
    };
  });

  return {game: {data: game, width: 2 * width, height: 2 * height}, border: soleils};
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
  resize?: {width: number; height: number}
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
      const finalImage = resize ? jimpImage.resize(resize.width, resize.height) : jimpImage;
      resolve(finalImage.getBufferAsync(MIME_PNG));
    });
  });
}
