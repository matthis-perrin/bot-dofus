import {initDofusWindow} from './dofus_window';
import {handleError} from './error';
import {findBorderSquares} from './screenshot';
import {screenhotManager} from './screenshot_manager';
import {sendEvent, startServer} from './server';
import {loadMapModel, loadSoleilModel} from './tensorflow';

async function run(): Promise<void> {
  startServer();
  const [soleilModel, mapModel] = await Promise.all([
    loadSoleilModel(),
    loadMapModel(),
    initDofusWindow(),
  ]);

  screenhotManager.start();
  screenhotManager.addListener(buffer => {
    // SCREENSHOT
    sendEvent({
      type: 'screenshot',
      data: buffer.toString('base64'),
    });
    // SOLEIL
    (async () => {
      const borderSquares = await findBorderSquares(buffer);
      const predictions = await Promise.all(
        borderSquares.map(async borderSquare => {
          const prediction = await soleilModel(borderSquare.data);
          return {...prediction, ...borderSquare.coordinates};
        })
      );
      predictions.sort((p1, p2) => p1.score - p2.score);
      sendEvent({
        type: 'soleil',
        data: predictions,
      });
    })().catch(handleError);
    // COORDINATE
    (async () => {
      const prediction = await mapModel(buffer);
      sendEvent({
        type: 'coordinate',
        data: prediction,
      });
    })().catch(handleError);
  });
}

run().catch(handleError);
