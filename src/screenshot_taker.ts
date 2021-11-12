import { mkdirSync } from "fs";
import GK from "global-keypress";
import Jimp from 'jimp'
import { join } from "path";
import { takeScreenshot } from "./screenshot";

export function startScreenshotTaker(): void {
try {
    mkdirSync('./images');
} catch {}

async function saveCroppedImage(img: Jimp, fileName: string, x: number, y: number, width: number, height: number): Promise<void> {
    await img.crop(x * 2, y * 2, width * 2, height * 2).writeAsync(join('./images', fileName));
    console.log(`Saved ${fileName}`)
}

async function saveCoordinateImage(): Promise<void> {
    const img = await Jimp.read(await takeScreenshot());
    saveCroppedImage(img, `${Date.now()}.bmp`, 310, 54, 1130, 657);
}

const gk = new GK();
gk.start();
gk.on('press', data => {
  if (data.data === '<Space>') {
    saveCoordinateImage().catch(console.error);
  }
});
gk.on('error', error => {console.error(error);});
gk.on('close', () => {console.log('closed');});

setInterval(() => {}, 1000)
}