import { initDofusWindow } from "./dofus_window";
import { startScreenshotTaker } from "./screenshot_taker";
import { loadModel, Predictor } from "./tensorflow";
import { takeGameScreenshot } from "./screenshot";

async function printCoordinatePrediction(ml: Predictor): Promise<void> {
    const screenshot = await takeGameScreenshot(true);
    const prediction = await ml(screenshot);
    console.log(`${prediction.label} ${Math.round(1000 * prediction.score) / 10}%`)
    setTimeout(() => {
        printCoordinatePrediction(ml).catch(console.error)
    }, 0)
}

async function run(): Promise<void> {
  await initDofusWindow();
  startScreenshotTaker();
  // const ml = await loadModel();
  // printCoordinatePrediction(ml);
}

run().catch((err) => console.error(err));
