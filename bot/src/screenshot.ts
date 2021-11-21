import Jimp, {MIME_PNG} from 'jimp';
import {screen} from 'robotjs';

import {
  Coordinate,
  gameCoordinates,
  HORIZONTAL_SQUARES,
  soleilCoordinateToMapCoordinate,
  SQUARE_SIZE,
  VERTICAL_SQUARES,
} from '../../common/src/coordinates';

interface RgbImage {
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
  let t1 = Date.now();
  // Take a screenshot of the game zone
  const {x, y, width, height} = gameCoordinates;
  const bitmap: Buffer = screen.capture(x, y, width, height).image;
  console.log('screen.capture', Date.now() - t1);
  t1 = Date.now();

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
  console.log('BGRA to ABGR', Date.now() - t1);
  t1 = Date.now();

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
  console.log('soleils', Date.now() - t1);
  t1 = Date.now();

  return {game: {data: game, width: 2 * width, height: 2 * height}, border: soleils};
}

export async function convertToPng(img: RgbImage): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    console.log(img);
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
      resolve(jimpImage.getBufferAsync(MIME_PNG));
    });
  });
}

export async function takeScreenshot(): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await Promise.resolve({})) as any;
}
export async function takeGameScreenshot(resize: boolean): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await Promise.resolve({resize})) as any;
}
