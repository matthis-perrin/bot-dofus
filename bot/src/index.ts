import {initDofusWindow} from './dofus_window';
import {handleError} from './error';
import {Intelligence} from './intelligence';
import {findBorderSquares} from './screenshot';
import {screenhotManager} from './screenshot_manager';
import {sendEvent, startServer} from './server';
import {loadMapModel, loadSoleilModel} from './tensorflow';

async function run(): Promise<void> {
  const [soleilModel, mapModel] = await Promise.all([
    loadSoleilModel(),
    loadMapModel(),
    initDofusWindow(),
  ]);
  const ai = new Intelligence(soleilModel, mapModel);
  startServer(ai);
  ai.start();
}

run().catch(handleError);
