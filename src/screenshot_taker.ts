import { mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import GK from "global-keypress";
import { join } from "path";
import { takeBorderSquaresScreenshots, takeGameScreenshot } from "./screenshot";

export function startScreenshotTaker(): void {
  try {
    mkdirSync("./images/map", { recursive: true });
    mkdirSync("./images/soleil", { recursive: true });
  } catch {}

  async function saveCoordinateImage(): Promise<void> {
    const img = await takeGameScreenshot(true);
    await writeFile(join("./images/map", `${Date.now()}.png`), img);
  }

  async function saveBorderSquareImages(): Promise<void> {
    const imgs = await takeBorderSquaresScreenshots();
    await Promise.all(
      imgs.map((img, i) =>
        writeFile(join("./images/soleil", `${Date.now()}_${i}.png`), img)
      )
    );
    console.log("Soleil");
  }

  const gk = new GK();
  gk.start();
  gk.on("press", (data) => {
    if (data.data === "<Space>") {
      // saveCoordinateImage().catch((err) => console.error(err));
      saveBorderSquareImages().catch((err) => console.error(err));
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
