import {Coordinate, mapCoordinateToScreenCoordinate} from '../../common/src/coordinates';
import {allFishSize, allFishType, FishSize, FishType, SQUARE_SIZE} from '../../common/src/model';
import {click, sleep} from './actions';
import {fishDb} from './fish_db';
import {Scenario} from './scenario_runner';

const squareWidth = SQUARE_SIZE.width / 2;
const squareHeight = SQUARE_SIZE.height / 2;

function fishToString(info: {size?: FishSize; type?: FishType}): string {
  return `${info.size ?? '?'} poisson de ${info.type ?? '?'}`;
}

function coordinateToString({x, y}: Coordinate): string {
  return `${x};${y}`;
}

export const fishMapScenario: Scenario = async ctx => {
  const {ia, canContinue, updateStatus} = ctx;

  updateStatus('Récupération des infos écran');

  const lastData = ia.getLastData();
  if (lastData === undefined) {
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
    await sleep(15 * 1000);
  }
  /* eslint-enable no-await-in-loop */
};
