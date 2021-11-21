import {Coordinate} from '../../common/src/coordinates';
import {initDofusWindow} from './dofus_window';
import {handleError} from './error';
import {fishDb} from './fish_db';
import {Intelligence} from './intelligence';
import {mapLoopScenario} from './scenario';
import {ScenarioRunner} from './scenario_runner';
import {sendEvent, startServer} from './server';
import {loadMapModel, loadSoleilModel} from './tensorflow';

async function run(): Promise<void> {
  const [soleilModel, mapModel] = await Promise.all([
    loadSoleilModel(),
    loadMapModel(),
    initDofusWindow(),
    fishDb.init(),
  ]);

  const ai = new Intelligence(soleilModel, mapModel);
  const runner = new ScenarioRunner(ai, mapLoopScenario);
  startServer(ai, runner);

  ai.start();

  fishDb.addListener(() => {
    const lastData = ai.getLastData();
    if (!lastData) {
      return;
    }
    const coordinate: Coordinate = lastData.coordinate.coordinate;
    sendEvent({type: 'fish', data: fishDb.get(coordinate)});
  });
}

run().catch(handleError);
