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

export async function takeGameScreenshot(resize: boolean): Promise<Buffer> {
  const x = 310;
  const y = 54;
  const width = 1130;
  const height = 657;

  const fullScreen = await takeScreenshot();
  let img = await Jimp.read(fullScreen);
  img = img.crop(x * 2, y * 2, width * 2, height * 2);
  if (resize) {
    const ratio = savedImageHeight / (height * 2);
    img = img.resize(Math.round(width * 2 * ratio), savedImageHeight);
  }

  return img.getBufferAsync(Jimp.MIME_PNG);
}
