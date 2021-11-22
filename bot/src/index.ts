import {writeFileSync} from 'fs';

import {Coordinate} from '../../common/src/coordinates';
import {sleep} from './actions';
import {initDofusWindow} from './dofus_window';
import {handleError} from './error';
import {fishDb} from './fish_db';
import {Intelligence} from './intelligence';
import {mapLoopScenario} from './scenario';
import {ScenarioRunner} from './scenario_runner';
import {screenshot} from './screenshot';
import {sendEvent, startServer} from './server';
import {loadFishPopupModel, loadMapModel, loadSoleilModel} from './tensorflow';

async function run(): Promise<void> {
  // const [soleilModel, mapModel, fishPopupModel] = await Promise.all([
  //   loadSoleilModel(),
  //   loadMapModel(),
  //   loadFishPopupModel(),
  //   initDofusWindow(),
  //   fishDb.init(),
  // ]);

  // const ai = new Intelligence(soleilModel, mapModel, fishPopupModel);
  // const runner = new ScenarioRunner(ai, mapLoopScenario);
  // startServer(ai, runner);

  // ai.start();

  // fishDb.addListener(() => {
  //   const lastData = ai.getLastData();
  //   if (!lastData) {
  //     return;
  //   }
  //   const coordinate: Coordinate = lastData.coordinate.coordinate;
  //   sendEvent({type: 'fish', data: fishDb.get(coordinate)});
  // });
  initDofusWindow();
  console.log(await (await loadMapModel())((await screenshot()).game));
}

run().catch(handleError);
