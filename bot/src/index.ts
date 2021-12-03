import 'source-map-support/register';

import {isInventoryFull} from './detectors';
import {initDofusWindow} from './dofus_window';
import {handleError} from './error';
import {fightScenario} from './fight/fight_scenario';
import {fishDb} from './fish_db';
import {Intelligence} from './intelligence';
import {mapLoopScenario} from './scenario';
import {ScenarioRunner} from './scenario_runner';
import {startServer} from './server';
import {loadFishPopupModel, loadMapModel, loadSoleilModel} from './tensorflow';

async function run(): Promise<void> {
  const [soleilModel, mapModel, fishPopupModel] = await Promise.all([
    loadSoleilModel(),
    loadMapModel(),
    loadFishPopupModel(),
    initDofusWindow(),
    fishDb.init(),
  ]);

  // const ai = new Intelligence(soleilModel, mapModel, fishPopupModel);
  // const runner = new ScenarioRunner(ai, mapLoopScenario, fightScenario);
  // startServer(ai, runner);
  // // runner.start();
  // console.log(new Date());
  // setInterval(() => console.log(new Date()), 15 * 60 * 1000);
  isInventoryFull();
}

run().catch(handleError);
