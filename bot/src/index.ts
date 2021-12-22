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
import {
  loadCharacterFishingModel,
  loadCharacterModel,
  loadFishPopupModel,
  loadMapModel,
} from './tensorflow';

async function run(): Promise<void> {
  const [mapModel, fishPopupModel, characterModel, characterFishingModel] = await Promise.all([
    loadMapModel(),
    loadFishPopupModel(),
    loadCharacterModel(),
    loadCharacterFishingModel(),
    initDofusWindow(),
    fishDb.init(),
    soleilDb.init(),
    getCredentials(),
  ]);
  analyzeMaps();
  const ia = new Intelligence(mapModel, fishPopupModel, characterModel, characterFishingModel);
  const runner = new ScenarioRunner(ia);
  startServer(ia, runner);
  runner.start();

  // const ctx = {canContinue: async () => {}, ia, updateStatus: console.log};
  console.log(new Date().toLocaleString());
  setInterval(() => console.log(new Date().toLocaleString()), 15 * 60 * 1000);
}

run().catch(handleError);
