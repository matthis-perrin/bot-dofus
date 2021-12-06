// eslint-disable-next-line import/no-unassigned-import
import 'source-map-support/register';

import {initDofusWindow} from './dofus_window';
import {handleError} from './error';
import {fishDb} from './fish_db';
import {Intelligence} from './intelligence';
import {logEvent} from './logger';
import {getCredentials} from './scenario/connection_scenario';
import {ScenarioRunner} from './scenario_runner';
import {startServer} from './server';
import {loadFishPopupModel, loadMapModel, loadSoleilModel} from './tensorflow';

async function run(): Promise<void> {
  await logEvent('start');
  const [soleilModel, mapModel, fishPopupModel] = await Promise.all([
    loadSoleilModel(),
    loadMapModel(),
    loadFishPopupModel(),
    initDofusWindow(),
    fishDb.init(),
    getCredentials(),
  ]);
  const ai = new Intelligence(soleilModel, mapModel, fishPopupModel);
  const runner = new ScenarioRunner(ai);
  startServer(ai, runner);
  runner.start();
  console.log(new Date().toLocaleString());
  setInterval(() => console.log(new Date().toLocaleString()), 15 * 60 * 1000);
}

run().catch(handleError);
