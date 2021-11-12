import { mkdirSync } from "fs";
import GK from "global-keypress";
import Jimp from "jimp";
import { join } from "path";
import { takeScreenshot } from "./screenshot";

const savedImageHeight = 256;

export function startScreenshotTaker(): void {
  try {
    mkdirSync("./images");
  } catch {}

  async function saveCroppedImage(
    img: Jimp,
    fileName: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    const ratio = savedImageHeight / (height * 2);
    await img
      .crop(x * 2, y * 2, width * 2, height * 2)
      .resize(Math.round(width * 2 * ratio), savedImageHeight)
      .writeAsync(join("./images/map", fileName));
    console.log(`Saved ${fileName}`);
  }

  async function saveCoordinateImage(): Promise<void> {
    const img = await Jimp.read(await takeScreenshot());
    saveCroppedImage(img, `${Date.now()}.png`, 310, 54, 1130, 657);
  }

  const gk = new GK();
  gk.start();
  gk.on("press", (data) => {
    if (data.data === "<Space>") {
      console.log("Taking screenshot");
      saveCoordinateImage().catch((err) => console.error(err));
    }
  });
  gk.on("error", (error) => {
    console.error(error);
  });
  gk.on("close", () => {
    console.log("closed");
  });

  setInterval(() => {}, 1000);
}
