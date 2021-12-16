// eslint-disable-next-line import/no-unassigned-import
import 'source-map-support/register';

import {initDofusWindow} from './dofus_window';
import {handleError} from './error';
import {fishDb} from './fish_db';
import {Intelligence} from './intelligence';
import {analyzeMaps} from './map_quality';
import {getCredentials} from './scenario/connection_scenario';
import {ScenarioRunner} from './scenario_runner';
import {startServer} from './server';
import {soleilDb} from './soleil_db';
import {loadFishPopupModel, loadMapModel} from './tensorflow';

// {canContinue: async () => {}, ia: ai, updateStatus: console.log}

async function run(): Promise<void> {
  const [mapModel, fishPopupModel] = await Promise.all([
    loadMapModel(),
    loadFishPopupModel(),
    initDofusWindow(),
    fishDb.init(),
    soleilDb.init(),
    getCredentials(),
  ]);
  analyzeMaps();
  const ai = new Intelligence(mapModel, fishPopupModel);
  const runner = new ScenarioRunner(ai);
  startServer(ai, runner);
  // runner.start();
  console.log(new Date().toLocaleString());
  setInterval(() => console.log(new Date().toLocaleString()), 15 * 60 * 1000);
}

run().catch(handleError);
