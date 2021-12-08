import {getMousePos} from 'robotjs';

import {
  Coordinate,
  GAME_HEIGHT,
  GAME_WIDTH,
  HORIZONTAL_SQUARES,
  mapCoordinateToImageCoordinate,
  soleilCoordinateToMapCoordinate,
  SQUARE_SIZE,
  squareCenter,
  squareIsAngle,
  VERTICAL_SQUARES,
} from '../../common/src/coordinates';
import {
  allFishSize,
  allFishType,
  COORDINATE_MIN_SCORE,
  fishPopupSizes,
  FishSize,
  FishType,
  ScenarioType,
} from '../../common/src/model';
import {click, moveToSafeZone, randSleep, sleep, waitForMapChange} from './actions';
import {imageCoordinateToScreenCoordinate, screenCoordinateToImageCoordinate} from './coordinate';
import {hasLevelUpModal} from './detectors';
import {fishDb} from './fish_db';
import {Data} from './intelligence';
import {logError, logEvent} from './logger';
import {restart} from './process';
import {CanContinue, Scenario, ScenarioContext, StartScenarioError} from './scenario_runner';

const mapLoop = [
  {x: 7, y: -4},
  {x: 8, y: -4},
  {x: 8, y: -3},
  {x: 9, y: -3},
  {x: 9, y: -2},
  {x: 9, y: -1},
  {x: 10, y: -1},
  {x: 11, y: -1},
  {x: 12, y: -1},
  {x: 12, y: 0},
  {x: 13, y: 0},
  {x: 13, y: 1},
  {x: 13, y: 2},
  {x: 12, y: 2},
  {x: 11, y: 2},
  {x: 11, y: 1},
  {x: 10, y: 1},
  {x: 10, y: 0},
  {x: 9, y: 0},
  {x: 8, y: 0},
  {x: 8, y: -1},
  {x: 8, y: -2},
  {x: 7, y: -2},
  {x: 7, y: -3},
];

const squareWidth = SQUARE_SIZE.width / 2;
const squareHeight = SQUARE_SIZE.height / 2;

function fishToString(info: {size?: FishSize; type?: FishType}): string {
  return `${info.size ?? '?'} poisson de ${info.type ?? '?'}`;
}

function coordinateToString({x, y}: Coordinate): string {
  return `${x};${y}`;
}

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

enum Direction {
  Top = 'haut',
  Right = 'droite',
  Bottom = 'bas',
  Left = 'gauche',
}

function getDirection(current: Coordinate, nextMap: Coordinate): Direction {
  if (nextMap.x > current.x) {
    return Direction.Right;
  }
  if (nextMap.x < current.x) {
    return Direction.Left;
  }
  if (nextMap.y > current.y) {
    return Direction.Top;
  }
  if (nextMap.y < current.y) {
    return Direction.Bottom;
  }
  throw new Error(`No direction, the map are the same`);
}

async function changeMap(
  ctx: ScenarioContext,
  data: Data,
  currentMap: Coordinate,
  nextMap: Coordinate,
  maxTries = 3
): Promise<void> {
  const {canContinue, updateStatus} = ctx;
  const currentMapStr = coordinateToString(currentMap);

  if (maxTries <= 0) {
    await logError(
      'map loop',
      `map change from ${currentMapStr} to ${coordinateToString(nextMap)} failed after many tries`
    );
    updateStatus(`La map ${coordinateToString(nextMap)} n'est toujours pas identifiée, déco/reco.`);
    throw new StartScenarioError(ScenarioType.Connection);
  }

  // Get the next map direction
  const nextMapStr = coordinateToString(nextMap);
  const direction = getDirection(currentMap, nextMap);
  updateStatus(
    `Fin de la pêche sur la map (${currentMapStr}). Prochaine map est ${nextMapStr} (${direction})`
  );

  // Identification of the soleil
  const soleils = data.soleil.filter(s => {
    if (s.label !== 'OK') {
      return false;
    }
    if (direction === Direction.Right) {
      return s.x === HORIZONTAL_SQUARES - 1;
    }
    if (direction === Direction.Left) {
      return s.x === 0;
    }
    if (direction === Direction.Top) {
      return s.y === VERTICAL_SQUARES - 1;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (direction === Direction.Bottom) {
      return s.y === 0;
    }
    throw new Error(`Invalid direction ${direction}`);
  });

  if (soleils.length === 0) {
    const status = `Pas de soleil dans la direction ${direction} pour la map ${currentMapStr}. Soleils disponibles : ${data.soleil
      .map(s => coordinateToString(s))
      .join(', ')}. Pause de 5s avant redémarrage du scénario.`;
    await logError('map loop', status);
    updateStatus(status);
    await sleep(canContinue, 5000);
    return mapLoopScenario(ctx);
  }

  let soleil = soleils[0]!;
  if (soleils.length > 1) {
    soleil = [...soleils].sort((s1, s2) => {
      if (squareIsAngle(s1)) {
        if (squareIsAngle(s2)) {
          return -1;
        }
        return 1;
      }
      if (squareIsAngle(s2)) {
        return -1;
      }
      return -1;
    })[0]!;
    updateStatus(
      `Plusieurs soleil disponible pour la direction ${direction} : ${soleils
        .map(s => coordinateToString(s))
        .join(', ')}. Le premier soleil qui n'est pas un angle est choisi.`
    );
    // }
  }

  // Click on the soleil
  updateStatus(`Déplacement en ${coordinateToString(soleil)}`);
  const soleilPx = mapCoordinateToImageCoordinate(soleilCoordinateToMapCoordinate(soleil));
  const soleilCenter = squareCenter(soleilPx);

  await click(canContinue, {...soleilCenter, radius: 10});
  await moveToSafeZone(canContinue);

  // In case no map changed occured, we restart
  if (!(await waitForMapChange(ctx, nextMap))) {
    updateStatus(`Trying again`);
    await changeMap(ctx, data, currentMap, nextMap, maxTries - 1);
  }
}

export const mapLoopScenario: Scenario = async ctx => {
  const {ia, canContinue, updateStatus} = ctx;
  await canContinue();

  /* eslint-disable no-await-in-loop */
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await moveToSafeZone(canContinue);

    // Get current data
    const lastData = await ia.refresh();
    if (lastData.coordinate.score < COORDINATE_MIN_SCORE) {
      await logError(
        'map loop',
        `unknown map ${lastData.coordinate.label} ${lastData.coordinate.score}`
      );
      updateStatus('Infos écran non disponible. En attente...');
      await restart();
    }
    const coordinate = lastData.coordinate.coordinate;
    const coordinateStr = coordinateToString(coordinate);

    // Map identification
    const indexInMapLoop = mapLoop.findIndex(m => m.x === coordinate.x && m.y === coordinate.y);
    if (indexInMapLoop === -1) {
      updateStatus(`Map courante (${coordinateStr}) n'est pas dans le chemin. Prise de popo.`);
      await click(canContinue, {x: 1024, y: 806, radius: 5, double: true});
      return mapLoopScenario(ctx);
    }

    // Fish on the map
    await canContinue();
    updateStatus(`Démarrage de la pêche sur la map (${coordinateStr})`);
    await fishMapScenario(ctx);
    await moveToSafeZone(canContinue);

    // Check if we changed map
    const newLastData = await ia.refresh();
    if (
      newLastData.coordinate.coordinate.x !== lastData.coordinate.coordinate.x ||
      newLastData.coordinate.coordinate.y !== lastData.coordinate.coordinate.y
    ) {
      return mapLoopScenario(ctx);
    }

    const nextMap = mapLoop[(indexInMapLoop + 1) % mapLoop.length]!;
    await changeMap(ctx, newLastData, coordinate, nextMap);

    updateStatus(`Déplacement terminé`);
  }
  /* eslint-enable no-await-in-loop */
};

export const fishMapScenario: Scenario = async ctx => {
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
  const fishes = allFishes.filter(f => f.size !== undefined && f.type !== undefined);
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
      .map(f => `${fishToString(f)} (${coordinateToString(f.coordinate)})`)
      .join(', ');
    await logError('fish map', `incomplete fishes ${ignoredFishesStr}`);
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

    updateStatus(`Pêche de ${fishToString(fish)} en ${coordinateToString(fish.coordinate)}`);
    // Click on the fish
    const fishTopLeft = mapCoordinateToImageCoordinate(fish.coordinate);
    const fishTarget = {
      x: fishTopLeft.x + squareWidth / 2,
      y: fishTopLeft.y + (3 * squareHeight) / 4,
    };
    const currentPos = await click(canContinue, {
      ...fishTarget,
      radius: squareHeight / 4,
      button: 'right',
    });

    // Check if the fishing popup is here
    const popupCoordinate = getFishPopupCoordinate(fish.size!, fish.type!);
    const popupTopLeft = imageCoordinateToScreenCoordinate(popupCoordinate);
    const hasFish = await ia.hasFishPopup(popupTopLeft);
    await canContinue();

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
    await sleep(canContinue, waitTime);
    await checkLvlUp(canContinue);

    const newLastData = await ia.refresh();
    if (
      newLastData.coordinate.coordinate.x !== lastData.coordinate.coordinate.x ||
      newLastData.coordinate.coordinate.y !== lastData.coordinate.coordinate.y
    ) {
      const msg = `Changement de map non controllé détecté (${coordinateToString(
        lastData.coordinate.coordinate
      )} vers ${coordinateToString(newLastData.coordinate.coordinate)}).`;
      await logError('fish map', msg);
      updateStatus(msg);
      return;
    }
  }
  /* eslint-enable no-await-in-loop */
};

const fishingTimePerFish: Record<FishType, Record<FishSize, number>> = {
  [FishType.River]: {
    [FishSize.Small]: 9200,
    [FishSize.Medium]: 8200,
    [FishSize.Big]: 7200,
    [FishSize.Giant]: 20000,
  },
  [FishType.Sea]: {
    [FishSize.Small]: 9200,
    [FishSize.Medium]: 8200,
    [FishSize.Big]: 6500,
    [FishSize.Giant]: 20000,
  },
};

export async function checkLvlUp(canContinue: CanContinue): Promise<void> {
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
