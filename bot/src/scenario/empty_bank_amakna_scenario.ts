import {mapCoordinateToImageCoordinate, squareCenter} from '../../../common/src/coordinates';
import {COORDINATE_MIN_SCORE} from '../../../common/src/model';
import {click, waitFor, waitForMapChange} from '../actions';
import {isCoffreOpen, isTalkingToPnj} from '../detectors';
import {logError, logEvent} from '../logger';
import {restart} from '../process';
import {Scenario} from '../scenario_runner';
import {emptyToCoffreScenario} from './empty_to_coffre_scenario';
import {goToBankAmaknaScenario} from './go_to_bank_amakna_scenario';

const owlCoordinates = [
  {x: 5, y: 9},
  {x: 6, y: 10},
  {x: 6, y: 11},
  {x: 6, y: 9},
  {x: 7, y: 10},
  {x: 7, y: 13},
  {x: 8, y: 14},
  {x: 8, y: 13},
  {x: 8, y: 15},
  {x: 9, y: 17},
  {x: 10, y: 16},
  {x: 10, y: 18},
  {x: 10, y: 17},
  {x: 11, y: 18},
  {x: 10, y: 19},
  {x: 11, y: 20},
  {x: 11, y: 19},
];

export const emptyBankAmaknaScenario: Scenario = async ctx => {
  const {canContinue, ia, updateStatus} = ctx;

  await logEvent('empty bank amakna');

  const lastData = await ia.refresh();
  if (lastData.coordinate.score < COORDINATE_MIN_SCORE) {
    await logError(
      'empty bank amakna',
      `unknown map ${lastData.coordinate.label} ${lastData.coordinate.score}`
    );
    updateStatus(
      `Infos écran non disponible (${lastData.coordinate.label} ${lastData.coordinate.score}). En attente...`
    );
    await restart();
  }

  const {coordinate} = lastData.coordinate;
  if (coordinate.x !== -2000 || coordinate.y !== -2000) {
    await goToBankAmaknaScenario(ctx);
  }

  // Find the fucking owl
  let owlFound = false;
  /* eslint-disable no-await-in-loop */
  for (const owlCoordinate of owlCoordinates) {
    await canContinue();
    // Click on a possible position
    const currentPos = await click(canContinue, {
      ...squareCenter(mapCoordinateToImageCoordinate(owlCoordinate)),
      radius: 5,
      button: 'right',
    });
    // Check if dialog started
    if (isTalkingToPnj()) {
      owlFound = true;
      break;
    }
    // Dismiss menu
    await click(canContinue, {x: currentPos.x + 15, y: currentPos.y + 15, radius: 5});
  }
  /* eslint-enable no-await-in-loop */
  if (!owlFound) {
    await logError('empty bank amakna', `failure to found owl`);
    updateStatus(`Banquier non trouvé`);
    await restart();
  }
  updateStatus('Banquier trouvé. Dialogue engagé');

  // Open the coffre
  await click(canContinue, {x: 452, y: 376, radius: 10});

  // Wait for modal to open
  if (!(await waitFor(ctx, isCoffreOpen))) {
    await logError(
      'empty bank amakna',
      `Échec de l'ouverture du coffre durant le vidage de l'inventaire`
    );
    updateStatus(`Échec de l'ouverture du coffre durant le vidage de l'inventaire`);
    await restart();
  }

  // Empty to coffre
  await emptyToCoffreScenario(ctx);

  // Take a popo
  await click(canContinue, {x: 1024, y: 806, radius: 5, double: true});

  // Wait to be on the madrestam map
  await waitForMapChange(ctx, {x: 7, y: -4});
};
