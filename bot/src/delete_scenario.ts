import {keyTap} from 'robotjs';

import {click, randSleep, sleep} from './actions';
import {checkForColor} from './colors';
import {Scenario} from './scenario_runner';

export const deleteBags: Scenario = async ctx => {
  const {canContinue} = ctx;
  // Click on the inventory icon
  await click(canContinue, {x: 840, y: 690, radius: 0});
  // Click the "divers" category
  await click(canContinue, {x: 974, y: 147, radius: 0});
  // Loop until there are no more items to delete
  /* eslint-disable no-await-in-loop */
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const noItemColor = 'beb999';
    const firstItemCenter = {x: 910, y: 300};
    // const firstItemCenter = {x: 910, y: 250};
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
      noItemColor
    );
    if (hasNoItem) {
      break;
    }
    // Right click on the item
    const clickPos = await click(canContinue, {...firstItemCenter, radius: 15, button: 'right'});
    // Click on the menu "Détruire l'objet"
    await click(canContinue, {x: clickPos.x + 82, y: clickPos.y + 136, radius: 5});
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
