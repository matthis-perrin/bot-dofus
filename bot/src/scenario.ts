import {
  Coordinate,
  mapCoordinateToScreenCoordinate,
  soleilCoordinateToMapCoordinate,
  squareCenter,
} from '../../common/src/coordinates';
import {
  allFishSize,
  allFishType,
  FishSize,
  FishType,
  HORIZONTAL_SQUARES,
  SQUARE_SIZE,
  VERTICAL_SQUARES,
} from '../../common/src/model';
import {click, sleep} from './actions';
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
  // eslint-disable-next-line no-constant-condition
  while (true) {
    canContinue();

    // Get screen data
    updateStatus('Récupération des infos écran');
    let lastData = ia.getLastData();
    if (lastData === undefined || lastData.coordinate.score < 0.95) {
      updateStatus('Infos écran non disponible. En attente...');
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          mapLoopScenario(ctx).then(resolve).catch(reject);
        }, 500);
      });
    }

    // Map identification
    const coordinate = lastData.coordinate.coordinate;
    const indexInMapLoop = mapLoop.findIndex(m => m.x === coordinate.x && m.y === coordinate.y);
    if (indexInMapLoop === -1) {
      updateStatus(
        `Map courante (${coordinateToString(
          coordinate
        )}) n'est pas dans le chemin. Pause de 5s avant redémarrage du scénario.`
      );
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          mapLoopScenario(ctx).then(resolve).catch(reject);
        }, 5000);
      });
    }

    // Fish on the map
    canContinue();
    updateStatus(`Démarrage de la pêche sur la map (${coordinateToString(coordinate)})`);
    // eslint-disable-next-line no-await-in-loop
    await fishMapScenario(ctx);

    // Check if we changed map
    const checkMapData = ia.getLastData()!;
    if (
      checkMapData.coordinate.coordinate.x !== lastData.coordinate.coordinate.x ||
      checkMapData.coordinate.coordinate.y !== lastData.coordinate.coordinate.y
    ) {
      return mapLoopScenario(ctx);
    }

    // Get the next map
    const nextMap = mapLoop[(indexInMapLoop + 1) % mapLoop.length]!;
    const direction = getDirection(coordinate, nextMap);
    updateStatus(
      `Fin de la pêche sur la map (${coordinateToString(
        coordinate
      )}). Prochaine map est ${coordinateToString(nextMap)} (${direction})`
    );

    // Identification of the soleil
    lastData = ia.getLastData()!;
    const soleils = lastData.soleil.filter(s => {
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
        `Pas de soleil dans la direction ${direction} pour la map ${coordinateToString(
          lastData.coordinate.coordinate
        )}. Soleils disponibles : ${lastData.soleil
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
        updateStatus(
          `Plusieurs soleil disponible pour la direction ${direction} : ${soleils
            .map(s => coordinateToString(s))
            .join(', ')}. Le premier soleil est choisi.`
        );
      }
    }

    // Click on the soleil
    updateStatus(`Déplacement en ${coordinateToString(soleil)}`);
    const soleilPx = mapCoordinateToScreenCoordinate(soleilCoordinateToMapCoordinate(soleil));
    const soleilCenter = squareCenter(soleilPx);
    // eslint-disable-next-line no-await-in-loop
    await click(canContinue, {...soleilCenter, radius: SQUARE_SIZE.height / 4});
    canContinue();

    // Wait until we changed map (for 10s max)
    updateStatus(`Attente fin déplacement`);
    for (let index = 0; index < 10; index++) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(1000);
      canContinue();
      // Check if we are on the new map
      const newCoordinate = ia.getLastData()?.coordinate;
      if (
        newCoordinate &&
        newCoordinate.score > 0.95 &&
        newCoordinate.coordinate.x === nextMap.x &&
        newCoordinate.coordinate.y === nextMap.y
      ) {
        break;
      } else if (index >= 9) {
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
    }

    updateStatus(`Déplacement terminé`);
  }
};

export const fishMapScenario: Scenario = async ctx => {
  const {ia, canContinue, updateStatus} = ctx;

  updateStatus('Récupération des infos écran');

  const lastData = ia.getLastData();
  if (lastData === undefined || lastData.coordinate.score < 0.95) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        updateStatus('Infos écran non disponible. En attente...');
        fishMapScenario(ctx).then(resolve).catch(reject);
      }, 500);
    });
  }

  const fishes = fishDb.get(lastData.coordinate.coordinate);
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

  /* eslint-disable no-await-in-loop */
  for (const fish of fishes) {
    updateStatus(`Pêche de ${fishToString(fish)} en ${coordinateToString(fish.coordinate)}`);
    // Click on the fish
    const fishTopLeft = mapCoordinateToScreenCoordinate(fish.coordinate);
    const fishTarget = {
      x: fishTopLeft.x + squareWidth / 2,
      y: fishTopLeft.y + (3 * squareHeight) / 4,
    };
    const clickPos = await click(canContinue, {
      ...fishTarget,
      radius: squareHeight / 4,
      button: 'right',
    });

    // Click on the popup
    const popupOffset = {x: squareWidth / 4, y: 50};
    const popupTarget = {
      x: clickPos.x + popupOffset.x,
      y: clickPos.y + popupOffset.y,
    };

    await click(canContinue, {...popupTarget, radius: 10});

    canContinue();
    updateStatus(`Attente de fin de pêche`);
    const waitTime = 5000 + fishingTimePerFish[fish.size ?? FishSize.Giant];
    await sleep(waitTime);

    const newLastData = ia.getLastData();
    if (
      newLastData !== undefined &&
      (newLastData.coordinate.coordinate.x !== lastData.coordinate.coordinate.x ||
        newLastData.coordinate.coordinate.y !== lastData.coordinate.coordinate.y)
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
