import {initDofusWindow} from './dofus_window';
import {handleError} from './error';
import {takeGameScreenshot} from './screenshot';
import {startScreenshotTaker} from './screenshot_taker';
import {loadModel, Predictor} from './tensorflow';

async function printCoordinatePrediction(ml: Predictor): Promise<void> {
  const screenshot = await takeGameScreenshot(true);
  const prediction = await ml(screenshot);
  // eslint-disable-next-line no-console
  console.log(`${prediction.label} ${Math.round(1000 * prediction.score) / 10}%`);
  setTimeout(() => {
    printCoordinatePrediction(ml).catch(handleError);
  }, 0);
}

async function run(): Promise<void> {
  await initDofusWindow();
  startScreenshotTaker();
  const ml = await loadModel();
  await printCoordinatePrediction(ml);
}

run().catch(handleError);
