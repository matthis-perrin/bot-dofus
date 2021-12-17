import {COORDINATE_MIN_SCORE} from '../../../common/src/model';
import {click, moveToSafeZone} from '../actions';
import {hashCoordinate} from '../fight';
import {logError} from '../logger';
import {restart} from '../process';
import {Scenario} from '../scenario_runner';
import {changeMap} from './change_map';
import {fishOnMapScenario} from './fish_on_map_scenario';

// const mapLoop = [
//   {x: 7, y: -4},
//   {x: 8, y: -4},
//   {x: 8, y: -3},
//   {x: 9, y: -3},
//   {x: 9, y: -2},
//   {x: 9, y: -1},
//   {x: 10, y: -1},
//   {x: 11, y: -1},
//   {x: 12, y: -1},
//   {x: 12, y: 0},
//   {x: 13, y: 0},
//   {x: 13, y: 1},
//   {x: 13, y: 2},
//   {x: 12, y: 2},
//   {x: 11, y: 2},
//   {x: 11, y: 1},
//   {x: 10, y: 1},
//   {x: 10, y: 0},
//   {x: 9, y: 0},
//   {x: 8, y: 0},
//   {x: 8, y: -1},
//   {x: 8, y: -2},
//   {x: 7, y: -2},
//   {x: 7, y: -3},
// ];

export const mapLoop = [
  {x: 7, y: -4},
  {x: 7, y: -3},
  {x: 7, y: -2},
  {x: 8, y: -2},
  {x: 8, y: -1},
  {x: 8, y: 0},
  {x: 8, y: 1},
  {x: 8, y: 2},
  {x: 8, y: 3},
  {x: 8, y: 4},
  {x: 8, y: 5},
  {x: 8, y: 6},
  {x: 8, y: 7},
  {x: 8, y: 8},
  {x: 8, y: 9},
  {x: 8, y: 10},
  {x: 8, y: 11},
  {x: 9, y: 11},
  {x: 10, y: 11},
  {x: 11, y: 11},
  {x: 11, y: 12},
  {x: 10, y: 12},
  {x: 9, y: 12},
  {x: 9, y: 13},
  {x: 8, y: 13},
  {x: 8, y: 14},
  {x: 7, y: 14},
  {x: 7, y: 15},
  {x: 7, y: 16},
  {x: 7, y: 17},
  {x: 7, y: 18},
  {x: 8, y: 18},
  {x: 8, y: 19},
  {x: 9, y: 19},
  {x: 10, y: 19},
  {x: 11, y: 19},
  {x: 11, y: 20},
  {x: 12, y: 20},
  {x: 12, y: 19},
  {x: 12, y: 18},
  {x: 13, y: 18},
  {x: 13, y: 17},
  {x: 13, y: 16},
  {x: 13, y: 15},
  {x: 13, y: 14},
  {x: 12, y: 14},
  {x: 12, y: 13},
  {x: 12, y: 12},
  {x: 12, y: 11},
  {x: 12, y: 10},
  {x: 12, y: 9},
  {x: 12, y: 8},
  {x: 13, y: 8},
  {x: 13, y: 7},
  {x: 13, y: 6},
  {x: 13, y: 5},
  {x: 13, y: 4},
  {x: 12, y: 4},
  {x: 11, y: 4},
  {x: 11, y: 3},
  {x: 10, y: 3},
  {x: 10, y: 2},
  {x: 9, y: 2},
  {x: 9, y: 1},
  {x: 10, y: 1},
  {x: 11, y: 1},
  {x: 11, y: 2},
  {x: 12, y: 2},
  {x: 13, y: 2},
  {x: 13, y: 1},
  {x: 13, y: 0},
  {x: 12, y: 0},
  {x: 12, y: -1},
  {x: 11, y: -1},
  {x: 10, y: -1},
  {x: 9, y: -1},
  {x: 9, y: -2},
  {x: 9, y: -3},
  {x: 8, y: -3},
  {x: 8, y: -4},
];

export const fishingScenario: Scenario = async ctx => {
  const {ia, canContinue, updateStatus} = ctx;
  await canContinue();

  let previousIndexInMapLoop: number | undefined;

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
    const coordinateStr = hashCoordinate(coordinate);

    // Map identification
    let indexInMapLoop = mapLoop.findIndex(m => m.x === coordinate.x && m.y === coordinate.y);
    // If we know the previous index we take instead the next index
    if (previousIndexInMapLoop !== undefined) {
      const nextIndex = (previousIndexInMapLoop + 1) % mapLoop.length;
      const coordinatesAtNextIndex = mapLoop[nextIndex];
      // Ensure this is the index correspond to the actual map we are in
      if (
        coordinatesAtNextIndex !== undefined &&
        coordinatesAtNextIndex.x === coordinate.x &&
        coordinatesAtNextIndex.y === coordinate.y
      ) {
        indexInMapLoop = nextIndex;
      }
    }
    if (indexInMapLoop === -1) {
      updateStatus(`Map courante (${coordinateStr}) n'est pas dans le chemin. Prise de popo.`);
      await click(canContinue, {x: 1024, y: 806, radius: 5, double: true});
      return fishingScenario(ctx);
    }

    // Fish on the map
    await canContinue();
    updateStatus(`Démarrage de la pêche sur la map (${coordinateStr})`);
    await fishOnMapScenario(ctx);
    await moveToSafeZone(canContinue);

    // Check if we changed map
    const newLastData = await ia.refresh();
    if (
      newLastData.coordinate.coordinate.x !== lastData.coordinate.coordinate.x ||
      newLastData.coordinate.coordinate.y !== lastData.coordinate.coordinate.y
    ) {
      return fishOnMapScenario(ctx);
    }

    // Change map
    const nextMap = mapLoop[(indexInMapLoop + 1) % mapLoop.length]!;
    previousIndexInMapLoop = indexInMapLoop;
    await changeMap(ctx, lastData, coordinate, nextMap, 3);
    updateStatus(`Déplacement terminé`);
  }
  /* eslint-enable no-await-in-loop */
};
