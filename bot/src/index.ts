import {getMousePos} from 'robotjs';

import {initDofusWindow} from './dofus_window';
import {handleError} from './error';
import {test} from './fight';
import {fishDb} from './fish_db';
import {Intelligence} from './intelligence';
import {fightScenario, mapLoopScenario} from './scenario';
import {ScenarioRunner} from './scenario_runner';
import {startServer} from './server';
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
  // const runner = new ScenarioRunner(ai, mapLoopScenario, fightScenario);
  // startServer(ai, runner);
  // await ai.hasFishPopup(getMousePos());
  await test();
}

run().catch(handleError);
