import {initDofusWindow} from './dofus_window';
import {handleError} from './error';
import {fishDb} from './fish_db';
import {Intelligence} from './intelligence';
import {startServer} from './server';
import {loadMapModel, loadSoleilModel} from './tensorflow';

async function run(): Promise<void> {
  const [soleilModel, mapModel] = await Promise.all([
    loadSoleilModel(),
    loadMapModel(),
    initDofusWindow(),
    fishDb.init(),
  ]);
  const ai = new Intelligence(soleilModel, mapModel);
  startServer(ai);
  ai.start();
}

run().catch(handleError);
