import {getMousePos} from 'robotjs';

import {
  Coordinate,
  GAME_HEIGHT,
  GAME_WIDTH,
  HORIZONTAL_SQUARES,
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
} from '../../common/src/model';
import {click, sleep} from './actions';
import {
  imageCoordinateToScreenCoordinate,
  mapCoordinateToScreenCoordinate,
  screenCoordinateToImageCoordinate,
} from './coordinate';
import {fishDb} from './fish_db';
import {Scenario} from './scenario_runner';

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
  {x: 7, y: -1},
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

export const mapLoopScenario: Scenario = async ctx => {
  const {ia, canContinue, updateStatus} = ctx;
  /* eslint-disable no-await-in-loop */
  // eslint-disable-next-line no-constant-condition
  while (true) {
    canContinue();

    // Get current data
    const lastData = await ia.refresh();
    const coordinate = lastData.coordinate.coordinate;
    const coordinateStr = coordinateToString(coordinate);

    // Map identification
    const indexInMapLoop = mapLoop.findIndex(m => m.x === coordinate.x && m.y === coordinate.y);
    if (indexInMapLoop === -1) {
      updateStatus(
        `Map courante (${coordinateStr}) n'est pas dans le chemin. Pause de 5s avant redémarrage du scénario.`
      );
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          mapLoopScenario(ctx).then(resolve).catch(reject);
        }, 5000);
      });
    }

    // Fish on the map
    canContinue();
    updateStatus(`Démarrage de la pêche sur la map (${coordinateStr})`);
    await fishMapScenario(ctx);

    // Check if we changed map
    const newLastData = await ia.refresh();
    if (
      newLastData.coordinate.coordinate.x !== lastData.coordinate.coordinate.x ||
      newLastData.coordinate.coordinate.y !== lastData.coordinate.coordinate.y
    ) {
      return mapLoopScenario(ctx);
    }

    // Get the next map
    const nextMap = mapLoop[(indexInMapLoop + 1) % mapLoop.length]!;
    const nextMapStr = coordinateToString(nextMap);
    const direction = getDirection(coordinate, nextMap);
    updateStatus(
      `Fin de la pêche sur la map (${coordinateStr}). Prochaine map est ${nextMapStr} (${direction})`
    );

    // Identification of the soleil
    const soleils = newLastData.soleil.filter(s => {
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
      updateStatus(
        `Pas de soleil dans la direction ${direction} pour la map ${coordinateStr}. Soleils disponibles : ${newLastData.soleil
          .map(s => coordinateToString(s))
          .join(', ')}. Pause de 5s avant redémarrage du scénario.`
      );
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          mapLoopScenario(ctx).then(resolve).catch(reject);
        }, 5000);
      });
    }

    let soleil = soleils[0]!;
    if (soleils.length > 1) {
      // Special case when going from 8;0 to 8;-1. We take the soleil the furthest right
      if (coordinate.x === 8 && coordinate.y === 0 && nextMap.x === 8 && nextMap.y === -1) {
        soleil = [...soleils].sort((s1, s2) => s2.x - s1.x)[0]!;
        updateStatus(
          `Plusieurs soleil disponible pour la direction ${direction} : ${soleils
            .map(s => coordinateToString(s))
            .join(', ')}. Cas particulier 8;0 vers 8;-1, le soleil le plus à droite est choisi.`
        );
      } else {
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
            .join(', ')}. Le premier soleil qui m'est pas un angle est choisi.`
        );
      }
    }

    // Click on the soleil
    updateStatus(`Déplacement en ${coordinateToString(soleil)}`);
    const soleilPx = mapCoordinateToScreenCoordinate(soleilCoordinateToMapCoordinate(soleil));
    const soleilCenter = squareCenter(soleilPx);

    await click(canContinue, {...soleilCenter, radius: 10});
    canContinue();

    // Wait until we changed map (for 10s max)
    const MAX_WAIT_TIME_MS = 10000;
    const SLEEP_DURATION_MS = 300;
    const startTime = Date.now();
    let mapChangeDetected = false;
    updateStatus(`Attente fin déplacement`);
    while (Date.now() - startTime < MAX_WAIT_TIME_MS) {
      await sleep(canContinue, SLEEP_DURATION_MS);
      canContinue();
      // Check if we are on the new map
      const {coordinate: newCoordinate} = await ia.refresh();
      if (
        newCoordinate.score >= COORDINATE_MIN_SCORE &&
        newCoordinate.coordinate.x === nextMap.x &&
        newCoordinate.coordinate.y === nextMap.y
      ) {
        mapChangeDetected = true;
        break;
      }
    }

    // In case no map changed occured, we restart
    if (!mapChangeDetected) {
      // Last loop
      updateStatus(
        `La map ${coordinateToString(
          nextMap
        )} n'est toujours pas identifiée. Pause de 5s avant redémarrage du scénario.`
      );
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          mapLoopScenario(ctx).then(resolve).catch(reject);
        }, 5000);
      });
    }

    updateStatus(`Déplacement terminé`);
  }
  /* eslint-enable no-await-in-loop */
};

export const fishMapScenario: Scenario = async ctx => {
  const {ia, canContinue, updateStatus} = ctx;

  updateStatus('Récupération des infos écran');

  const lastData = await ia.refresh();
  if (lastData.coordinate.score < COORDINATE_MIN_SCORE) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        updateStatus('Infos écran non disponible. En attente...');
        fishMapScenario(ctx).then(resolve).catch(reject);
      }, 500);
    });
  }

  const allFishes = fishDb.get(lastData.coordinate.coordinate);
  const fishes = allFishes.filter(
    f =>
      f.size !== undefined &&
      f.type !== undefined &&
      (f.size !== FishSize.Big || f.type === FishType.River)
  );
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
    updateStatus(
      `*** WARNING *** Poissons incomplets : ${ignoredFishes
        .map(f => `${fishToString(f)} (${coordinateToString(f.coordinate)})`)
        .join(', ')}`
    );
  }

  /* eslint-disable no-await-in-loop */
  for (const fish of fishes) {
    updateStatus(`Pêche de ${fishToString(fish)} en ${coordinateToString(fish.coordinate)}`);
    // Click on the fish
    const fishTopLeft = mapCoordinateToScreenCoordinate(fish.coordinate);
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
    canContinue();

    if (!hasFish) {
      updateStatus(`Poisson non présent. Click dans la safe-zone.`);
      await click(canContinue, {x: currentPos.x + 15, y: currentPos.y + 15, radius: 5});
      continue;
    }

    // Click on the popup
    await click(canContinue, {x: popupTopLeft.x + 20, y: popupTopLeft.y + 48, radius: 10});

    canContinue();
    updateStatus(`Attente de fin de pêche`);
    const waitTime = 5000 + fishingTimePerFish[fish.size ?? FishSize.Giant];
    await sleep(canContinue, waitTime);

    const newLastData = await ia.refresh();
    if (
      newLastData.coordinate.coordinate.x !== lastData.coordinate.coordinate.x ||
      newLastData.coordinate.coordinate.y !== lastData.coordinate.coordinate.y
    ) {
      updateStatus(
        `Changement de map non controllé détecté (${coordinateToString(
          lastData.coordinate.coordinate
        )} vers ${coordinateToString(newLastData.coordinate.coordinate)}).`
      );
      return;
    }
  }
  /* eslint-enable no-await-in-loop */
};

const fishingTimePerFish: Record<FishSize, number> = {
  [FishSize.Small]: 10300,
  [FishSize.Medium]: 11300,
  [FishSize.Big]: 12300,
  [FishSize.Giant]: 20000,
};
