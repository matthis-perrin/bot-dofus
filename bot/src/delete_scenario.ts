import {keyTap} from 'robotjs';

import {click, randSleep} from './actions';
import {checkForColor} from './colors';
import {Scenario} from './scenario_runner';

export const deleteBagsScenario: Scenario = async ctx => {
  const {canContinue} = ctx;
  // Wait a bit
  await randSleep(canContinue, 1000, 1500);
  // Click on the inventory icon
  await click(canContinue, {x: 840, y: 690, radius: 0});
  // Click the "divers" category
  await click(canContinue, {x: 974, y: 147, radius: 0});
  // Loop until there are no more items to delete
  /* eslint-disable no-await-in-loop */
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const noItemColor = 'beb999';
    const firstItemCenter = {x: 910, y: 245};
    const hasNoItem = checkForColor(
      [
        firstItemCenter,
        {x: firstItemCenter.x + 10, y: firstItemCenter.y + 10},
        {x: firstItemCenter.x + 10, y: firstItemCenter.y + 0},
        {x: firstItemCenter.x + 10, y: firstItemCenter.y - 10},
        {x: firstItemCenter.x + 0, y: firstItemCenter.y + 10},
        {x: firstItemCenter.x + 0, y: firstItemCenter.y + 0},
        {x: firstItemCenter.x + 0, y: firstItemCenter.y - 10},
        {x: firstItemCenter.x - 10, y: firstItemCenter.y + 10},
        {x: firstItemCenter.x - 10, y: firstItemCenter.y + 0},
        {x: firstItemCenter.x - 10, y: firstItemCenter.y - 10},
      ],
      noItemColor,
      3
    );
    if (hasNoItem) {
      break;
    }
    // Click on the item
    await click(canContinue, {...firstItemCenter, radius: 15, button: 'left'});
    // Click on the menu button
    const clickPos = await click(canContinue, {x: 500, y: 550, radius: 5, button: 'left'});
    // Click on the menu "Détruire l'objet"
    await click(canContinue, {x: clickPos.x + 78, y: clickPos.y + 88, radius: 5});
    // Press enter
    keyTap('enter');
    // Wait a bit
    await randSleep(canContinue, 1000, 1500);
  }
  /* eslint-enable no-await-in-loop */
  // Once we are done deleting, press escape to close inventory
  keyTap('escape');
  // Wait a bit
  await randSleep(canContinue, 500, 700);
};
