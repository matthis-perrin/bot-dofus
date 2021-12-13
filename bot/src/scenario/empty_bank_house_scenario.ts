import {COORDINATE_MIN_SCORE} from '../../../common/src/model';
import {click, waitFor, waitForMapChange} from '../actions';
import {isCoffreOpen} from '../detectors';
import {logError, logEvent} from '../logger';
import {restart} from '../process';
import {Scenario} from '../scenario_runner';
import {emptyToCoffreScenario} from './empty_to_coffre_scenario';
import {goOutOfHouseScenario} from './go_out_of_house_scenario';
import {goUpOfHouseScenario} from './go_up_of_house_scenario';

export const emptyBankHouseScenario: Scenario = async ctx => {
  const {canContinue, ia, updateStatus} = ctx;

  await logEvent('empty bank house');

  const lastData = await ia.refresh();
  if (lastData.coordinate.score < COORDINATE_MIN_SCORE) {
    await logError(
      'empty bank house',
      `unknown map ${lastData.coordinate.label} ${lastData.coordinate.score}`
    );
    updateStatus(
      `Infos écran non disponible (${lastData.coordinate.label} ${lastData.coordinate.score}). En attente...`
    );
    await restart();
  }

  const {coordinate} = lastData.coordinate;
  if (coordinate.x !== -1002 || coordinate.y !== -1002) {
    await goUpOfHouseScenario(ctx);
  }

  // Click on the coffre
  const mousePos = await click(canContinue, {x: 891, y: 404, radius: 5});

  // Click on open
  await click(canContinue, {x: mousePos.x + 67, y: mousePos.y + 80, radius: 10});

  // Wait for modal to open
  if (!(await waitFor(ctx, isCoffreOpen))) {
    await logError(
      'empty bank house',
      `Échec de l'ouverture du coffre durant le vidage de l'inventaire`
    );
    updateStatus(`Échec de l'ouverture du coffre durant le vidage de l'inventaire`);
    return;
  }

  // Empty to coffre
  await emptyToCoffreScenario(ctx);

  // Get out of the house
  await goOutOfHouseScenario(ctx);

  // Take a popo
  await click(canContinue, {x: 1024, y: 806, radius: 5, double: true});

  // Wait to be on the madrestam map
  await waitForMapChange(ctx, {x: 7, y: -4});
};
