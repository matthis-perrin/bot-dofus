import {getMousePos} from 'robotjs';

import {
  Coordinate,
  GAME_HEIGHT,
  GAME_WIDTH,
  mapCoordinateToImageCoordinate,
  SQUARE_SIZE,
} from '../../../common/src/coordinates';
import {
  allFishSize,
  allFishType,
  COORDINATE_MIN_SCORE,
  Fish,
  fishPopupSizes,
  FishSize,
  FishType,
} from '../../../common/src/model';
import {click, moveToSafeZone, pressEscape, randSleep, sleep} from '../actions';
import {saveCharacterImage} from '../character_screenshots';
import {imageCoordinateToScreenCoordinate, screenCoordinateToImageCoordinate} from '../coordinate';
import {hasLevelUpModal, isTalkingToMerchand, isTalkingToPnj} from '../detectors';
import {hashCoordinate} from '../fight';
import {fishDb} from '../fish_db';
import {logError, logEvent} from '../logger';
import {restart} from '../process';
import {CanContinue, Scenario} from '../scenario_runner';

const MAX_PO = 8;

const fishingTimePerFish: Record<FishType, Record<FishSize, number>> = {
  [FishType.River]: {
    [FishSize.Small]: 5000,
    [FishSize.Medium]: 4000,
    [FishSize.Big]: 3000,
    [FishSize.Giant]: 3000,
  },
  [FishType.Sea]: {
    [FishSize.Small]: 5000,
    [FishSize.Medium]: 4000,
    [FishSize.Big]: 3000,
    [FishSize.Giant]: 3000,
  },
};

function shouldFish(f: Fish): boolean {
  return f.distance === undefined || f.distance <= MAX_PO;
  // return f.size !== FishSize.Small && f.size !== FishSize.Giant && f.type === FishType.Sea
}

function fishToString(info: {size?: FishSize; type?: FishType}): string {
  return `${info.size ?? '?'} poisson de ${info.type ?? '?'}`;
}

const squareWidth = SQUARE_SIZE.width / 2;
const squareHeight = SQUARE_SIZE.height / 2;

function getFishPopupCoordinate(fishSize: FishSize, fishType: FishType): Coordinate {
  // Convert current mouse pos to in game pos
  const {x, y} = screenCoordinateToImageCoordinate(getMousePos());
  // Get the popup dimension based on the type of fish
  const popupSize = fishPopupSizes[fishType][fishSize];
  // Return the adjusted position
  return {
    x: Math.min(x, GAME_WIDTH - popupSize.width),
    y: Math.min(y, GAME_HEIGHT - popupSize.height),
  };
}

async function checkLvlUp(canContinue: CanContinue): Promise<void> {
  // Check for the lvl up modal color
  if (hasLevelUpModal()) {
    await logEvent('up');
    console.log('Up!', new Date().toLocaleString());
    // Click on the "Ok" button
    await click(canContinue, {x: 560, y: 370, radius: 10});
    // Wait a bit
    await randSleep(canContinue, 500, 1000);
  }
}

export const fishOnMapScenario: Scenario = async ctx => {
  const {ia, canContinue, updateStatus} = ctx;

  updateStatus('Récupération des infos écran');

  const lastData = await ia.refresh();
  if (lastData.coordinate.score < COORDINATE_MIN_SCORE) {
    await logError(
      'fish map',
      `unknown map ${lastData.coordinate.label} ${lastData.coordinate.score}`
    );
    updateStatus('Infos écran non disponible. En attente...');
    await restart();
  }

  const allFishes = fishDb.get(lastData.coordinate.coordinate);
  const fishes = allFishes.filter(shouldFish);
  const ignoredFishes = allFishes.filter(f => f.size === undefined || f.type === undefined);

  const fishSummary = [...allFishSize, undefined]
    .flatMap(size =>
      [...allFishType, undefined].map(type => ({
        size,
        type,
        count: fishes.filter(f => f.size === size && f.type === type).length,
      }))
    )
    .filter(v => v.count > 0);
  updateStatus(
    `${fishes.length} poissons sur cette map:\n${fishSummary
      .map(({size, type, count}) => `x${count} ${fishToString({size, type})}`)
      .join('\n')}`
  );

  if (ignoredFishes.length > 0) {
    const ignoredFishesStr = ignoredFishes
      .map(f => `${fishToString(f)} (${hashCoordinate(f.coordinate)})`)
      .join(', ');
    // await logError('fish map', `incomplete fishes ${ignoredFishesStr}`);
    updateStatus(`*** WARNING *** Poissons incomplets : ${ignoredFishesStr}`);
  }

  /* eslint-disable no-await-in-loop */
  for (const fish of fishes) {
    // Check if we changed map
    const checkMapData = await ia.refresh();
    if (
      checkMapData.coordinate.coordinate.x !== lastData.coordinate.coordinate.x ||
      checkMapData.coordinate.coordinate.y !== lastData.coordinate.coordinate.y
    ) {
      return;
    }

    updateStatus(`Pêche de ${fishToString(fish)} en ${hashCoordinate(fish.coordinate)}`);
    // Click on the fish

    // If we are dealing with a fish at the far right, prevent clicking on the second half of the square
    const radius = 5;
    const xOffset = fish.coordinate.x === 13 && fish.coordinate.y % 2 === 1 ? -(radius + 5) : 0;
    const fishTopLeft = mapCoordinateToImageCoordinate(fish.coordinate);
    const fishTarget = {
      x: fishTopLeft.x + squareWidth / 2 + xOffset,
      y: fishTopLeft.y + (3 * squareHeight) / 4,
    };
    const currentPos = await click(canContinue, {
      ...fishTarget,
      radius,
      button: 'right',
    });

    // Check if the fishing popup is here
    const popupCoordinate = getFishPopupCoordinate(
      fish.size ?? FishSize.Medium,
      fish.type ?? FishType.River
    );
    const popupTopLeft = imageCoordinateToScreenCoordinate(popupCoordinate);
    const hasFish = await ia.hasFishPopup(popupTopLeft);
    await canContinue();

    // Check that we haven't clicked on a pnj, percepteur or merchand
    if (isTalkingToPnj() || isTalkingToMerchand()) {
      updateStatus('Fermeture de la fenêtre de dialogue');
      await pressEscape(canContinue);
      continue;
    }

    if (!hasFish) {
      updateStatus(`Poisson non présent. Click dans la safe-zone.`);
      await click(canContinue, {x: currentPos.x + 15, y: currentPos.y + 15, radius: 5});
      continue;
    }

    // Click on the popup
    await click(canContinue, {x: popupCoordinate.x + 20, y: popupCoordinate.y + 48, radius: 10});
    await moveToSafeZone(canContinue);

    updateStatus(`Attente de fin de pêche`);
    const waitTime =
      5000 + fishingTimePerFish[fish.type ?? FishType.River][fish.size ?? FishSize.Giant];

    // After 5 seconds, saves a screenshot of the character squares
    setTimeout(() => {
      saveCharacterImage().catch(console.error);
    }, 5000);

    await sleep(canContinue, waitTime);

    // After fishing save screenshot one more time
    await saveCharacterImage().catch(console.error);

    await checkLvlUp(canContinue);

    const newLastData = await ia.refresh();
    if (
      newLastData.coordinate.coordinate.x !== lastData.coordinate.coordinate.x ||
      newLastData.coordinate.coordinate.y !== lastData.coordinate.coordinate.y
    ) {
      const msg = `Changement de map non controllé détecté (${hashCoordinate(
        lastData.coordinate.coordinate
      )} vers ${hashCoordinate(newLastData.coordinate.coordinate)}).`;
      await logError('fish map', msg);
      updateStatus(msg);
      return;
    }
  }
  /* eslint-enable no-await-in-loop */
};
