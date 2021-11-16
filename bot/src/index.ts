import {initDofusWindow} from './dofus_window';
import {handleError} from './error';
import {takeGameScreenshot} from './screenshot';
import {screenhotManager} from './screenshot_manager';
import {startScreenshotTaker} from './screenshot_taker';
import {sendEvent, startServer} from './server';
import {loadMapModel, loadSoleilModel, Predictor} from './tensorflow';

async function printCoordinatePrediction(ml: Predictor): Promise<void> {
  const screenshot = await takeGameScreenshot(true);
  const prediction = await ml(screenshot);
  console.log(`${prediction.label} ${Math.round(1000 * prediction.score) / 10}%`);
  setTimeout(() => {
    printCoordinatePrediction(ml).catch(handleError);
  }, 5000);
}

async function run(): Promise<void> {
  startServer();
  screenhotManager.start();
  screenhotManager.addListener(buffer => {
    sendEvent({type: 'screenshot', data: buffer.toString('base64')});
  });
  // await initDofusWindow();
  // const predictor = await loadSoleilModel();
  // startScreenshotTaker(predictor);
  // const ml = await loadMapModel();
  // printCoordinatePrediction(ml).catch(handleError);
}

run().catch(handleError);
