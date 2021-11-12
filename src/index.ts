
import { setIntervalAsync } from "./utils";
import { initDofusWindow } from "./dofus_window";
import { startScreenshotTaker } from "./screenshot_taker";
import { loadModel } from "./tensorflow";
import { takeScreenshot } from "./screenshot";

async function run(): Promise<void> {
  await initDofusWindow();
  startScreenshotTaker();
  const ml = await loadModel();
  setIntervalAsync(async () => {
    const screenshot = await takeScreenshot();
    console.log(await ml(screenshot));
  }, 3000);
}

run().catch(console.error);
