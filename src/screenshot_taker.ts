import { mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import GK from "global-keypress";
import { join } from "path";
import { takeGameScreenshot } from "./screenshot";

export function startScreenshotTaker(): void {
  try {
    mkdirSync("./images");
  } catch {}

  async function saveCoordinateImage(): Promise<void> {
    const img = await takeGameScreenshot(true);
    await writeFile(img, join("./images/map", `${Date.now()}.png`));
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
