import {promises} from 'fs';
import {join} from 'path';
import {keyTap, mouseToggle, moveMouseSmooth} from 'robotjs';

import {COORDINATE_MIN_SCORE} from '../../../common/src/model';
import {click, randSleep, sleep, waitFor, waitForMapChange} from '../actions';
import {checkForColor} from '../colors';
import {imageCoordinateToScreenCoordinate} from '../coordinate';
import {isCoffreOpen, isEmptyItem} from '../detectors';
import {logError, logEvent, padLeft} from '../logger';
import {restart} from '../process';
import {Scenario} from '../scenario_runner';
import {goOutOfHouseScenario} from './go_out_of_house_scenario';
import {goUpOfHouseScenario} from './go_up_of_house_scenario';

const {rename, mkdir} = promises;

export function getTodayPath(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = padLeft(String(date.getMonth() + 1), 2, '0');
  const dd = padLeft(String(date.getDate()), 2, '0');
  return join(`./inventory/${yyyy}-${mm}-${dd}`);
}

export const emptyBankScenario: Scenario = async ctx => {
  const {canContinue, ia, updateStatus} = ctx;

  await logEvent('empty bank');

  const lastData = await ia.refresh();
  if (lastData.coordinate.score < COORDINATE_MIN_SCORE) {
    await logError(
      'empty bank',
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
    await logError('empty bank', `Échec de l'ouverture du coffre durant le vidage de l'inventaire`);
    updateStatus(`Échec de l'ouverture du coffre durant le vidage de l'inventaire`);
    return;
  }

  // Select resources category
  await click(canContinue, {x: 1054, y: 185, radius: 3});
  await sleep(canContinue, 2000);

  // Empty the inventory

  const firstItemCenter = {x: 863, y: 270};
  const dropZoneCenter = {x: 249, y: 270};
  const firstItemScreenCenter = imageCoordinateToScreenCoordinate(firstItemCenter);
  const dropZoneScreenCenter = imageCoordinateToScreenCoordinate(dropZoneCenter);
  /* eslint-disable no-await-in-loop */
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (isEmptyItem(firstItemCenter)) {
      break;
    }
    moveMouseSmooth(firstItemScreenCenter.x, firstItemScreenCenter.y);
    mouseToggle('down');
    moveMouseSmooth(dropZoneScreenCenter.x, dropZoneScreenCenter.y);
    mouseToggle('up');
    await randSleep(canContinue, 500, 600);
    if (checkForColor([{x: dropZoneCenter.x - 100, y: dropZoneCenter.y - 20}], '#ffffff', 5)) {
      await click(canContinue, {x: dropZoneCenter.x - 167, y: dropZoneCenter.y - 22, radius: 3});
      await randSleep(canContinue, 300, 500);
      await click(canContinue, {x: dropZoneCenter.x - 167, y: dropZoneCenter.y - 22, radius: 3});
      await randSleep(canContinue, 1000, 1200);
    }
  }
  /* eslint-enable no-await-in-loop */

  // Close the coffre
  keyTap('escape');
  updateStatus('Closing coffre window');
  await randSleep(canContinue, 500, 750);

  // Backup "last inventory" image
  const dir = getTodayPath();
  await mkdir(dir, {recursive: true});
  await rename(join('./inventory/last.png'), join(dir, `${Date.now()}.png`));

  // Get out of the house
  await goOutOfHouseScenario(ctx);

  // Take a popo
  await click(canContinue, {x: 1024, y: 806, radius: 5, double: true});

  // Wait to be on the madrestam map
  await waitForMapChange(ctx, {x: 7, y: -4});
};
