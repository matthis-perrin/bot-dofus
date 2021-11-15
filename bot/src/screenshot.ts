import {promises} from 'fs';
import Jimp from 'jimp';
import {tmpdir} from 'os';
import {join} from 'path';

import {execAsync} from './utils';

const {readFile, unlink} = promises;

export async function takeScreenshot(): Promise<Buffer> {
  const filePath = join(tmpdir(), `${Math.random().toString(36).slice(2)}.png`);
  const screencaptureCmd = `screencapture -t png -x ${filePath}`;
  await execAsync(screencaptureCmd);
  const file = await readFile(filePath);
  await unlink(filePath);
  return file;
}

const savedImageHeight = 256;

export const gameCoordinates = {
  x: 310,
  y: 54,
  width: 1130,
  height: 657,
};

export async function takeGameScreenshot(resize: boolean): Promise<Buffer> {
  const {x, y, width, height} = gameCoordinates;

  const fullScreen = await takeScreenshot();
  let img = await Jimp.read(fullScreen);
  img = img.crop(x * 2, y * 2, width * 2, height * 2);
  if (resize) {
    const ratio = savedImageHeight / (height * 2);
    img = img.resize(Math.round(width * 2 * ratio), savedImageHeight);
  }

  return img.getBufferAsync(Jimp.MIME_PNG);
}

const HORIZONTAL_SQUARES = 14;
const VERTICAL_SQUARES = 16;

export const SQUARE_SIZE = {
  width: (2 * gameCoordinates.width) / HORIZONTAL_SQUARES,
  height: (2 * gameCoordinates.height) / VERTICAL_SQUARES,
};

interface BorderSquareImage {
  data: Buffer;
  coordinates: {x: number; y: number};
}

export async function takeBorderSquaresScreenshots(): Promise<BorderSquareImage[]> {
  const {x: gameX, y: gameY, width, height} = gameCoordinates;
  const fullScreen = await takeScreenshot();
  let img = await Jimp.read(fullScreen);
  img = img.crop(gameX * 2, gameY * 2, width * 2, height * 2);

  const bufferPromises: Promise<BorderSquareImage>[] = [];
  for (let x = 0; x < HORIZONTAL_SQUARES; x++) {
    bufferPromises.push(
      img
        .clone()
        .crop(Math.round(x * SQUARE_SIZE.width), 0, SQUARE_SIZE.width, SQUARE_SIZE.height)
        .getBufferAsync(Jimp.MIME_PNG)
        .then(data => ({data, coordinates: {x, y: 0}})),
      img
        .clone()
        .crop(
          Math.round(x * SQUARE_SIZE.width),
          Math.round((VERTICAL_SQUARES - 1) * SQUARE_SIZE.height),
          SQUARE_SIZE.width,
          SQUARE_SIZE.height
        )
        .getBufferAsync(Jimp.MIME_PNG)
        .then(data => ({data, coordinates: {x, y: VERTICAL_SQUARES - 1}}))
    );
  }
  for (let y = 1; y < VERTICAL_SQUARES - 1; y++) {
    bufferPromises.push(
      img
        .clone()
        .crop(0, Math.round(y * SQUARE_SIZE.height), SQUARE_SIZE.width, SQUARE_SIZE.height)
        .getBufferAsync(Jimp.MIME_PNG)
        .then(data => ({data, coordinates: {x: 0, y}})),
      img
        .clone()
        .crop(
          Math.round((HORIZONTAL_SQUARES - 1) * SQUARE_SIZE.width),
          Math.round(y * SQUARE_SIZE.height),
          SQUARE_SIZE.width,
          SQUARE_SIZE.height
        )
        .getBufferAsync(Jimp.MIME_PNG)
        .then(data => ({data, coordinates: {x: HORIZONTAL_SQUARES - 1, y}}))
    );
  }

  return Promise.all(bufferPromises);
}
