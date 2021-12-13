import {promises} from 'fs';
import {join} from 'path';
import {mouseToggle, moveMouseSmooth} from 'robotjs';

import {click, pressEscape, randSleep, sleep} from '../actions';
import {checkForColor} from '../colors';
import {imageCoordinateToScreenCoordinate} from '../coordinate';
import {isEmptyItem} from '../detectors';
import {padLeft} from '../logger';
import {Scenario} from '../scenario_runner';

const {rename, mkdir} = promises;

function getTodayPath(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = padLeft(String(date.getMonth() + 1), 2, '0');
  const dd = padLeft(String(date.getDate()), 2, '0');
  return join(`./inventory/${yyyy}-${mm}-${dd}`);
}

export const emptyToCoffreScenario: Scenario = async ctx => {
  const {canContinue, updateStatus} = ctx;

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
  await pressEscape(canContinue);
  updateStatus('Closing coffre window');
  await randSleep(canContinue, 500, 750);

  // Backup "last inventory" image
  const dir = getTodayPath();
  await mkdir(dir, {recursive: true});
  try {
    await rename(join('./inventory/last.png'), join(dir, `${Date.now()}.png`));
  } catch {
    // Nothing to copy
  }
};
