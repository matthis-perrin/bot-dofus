import {
  Coordinate,
  HORIZONTAL_SQUARES,
  mapCoordinateToImageCoordinate,
  squareCenter,
  squareIsAngle,
  VERTICAL_SQUARES,
} from '../../../common/src/coordinates';
import {COORDINATE_MIN_SCORE, ScenarioType} from '../../../common/src/model';
import {click, moveToSafeZone, sleep, waitForMapChange} from '../actions';
import {hashCoordinate} from '../fight';
import {Data} from '../intelligence';
import {logError} from '../logger';
import {restart} from '../process';
import {Scenario, ScenarioContext, StartScenarioError} from '../scenario_runner';
import {fishOnMapScenario} from './fish_on_map_scenario';

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

// const mapLoop = [
//   {x: 7, y: -4},
//   {x: 7, y: -3},
//   {x: 7, y: -2},
//   {x: 8, y: -2},
//   {x: 8, y: -1},
//   {x: 8, y: 0},
//   {x: 8, y: 1},
//   {x: 8, y: 2},
//   {x: 8, y: 3},
//   {x: 8, y: 4},
//   {x: 8, y: 5},
//   {x: 8, y: 6},
//   {x: 8, y: 7},
//   {x: 8, y: 8},
//   {x: 8, y: 9},
//   {x: 8, y: 10},
//   {x: 8, y: 11},
//   {x: 9, y: 11},
//   {x: 10, y: 11},
//   {x: 11, y: 11},
//   {x: 11, y: 12},
//   {x: 10, y: 12},
//   {x: 9, y: 12},
//   {x: 9, y: 13},
//   {x: 8, y: 13},
//   {x: 8, y: 14},
//   {x: 7, y: 14},
//   {x: 7, y: 15},
//   {x: 7, y: 16},
//   {x: 7, y: 17},
//   {x: 7, y: 18},
//   {x: 8, y: 18},
//   {x: 8, y: 19},
//   {x: 9, y: 19},
//   {x: 10, y: 19},
//   {x: 11, y: 19},
//   {x: 11, y: 20},
//   {x: 12, y: 20},
//   {x: 12, y: 19},
//   {x: 12, y: 18},
//   {x: 13, y: 18},
//   {x: 13, y: 17},
//   {x: 13, y: 16},
//   {x: 13, y: 15},
//   {x: 12, y: 15},
//   {x: 12, y: 14},
//   {x: 12, y: 13},
//   {x: 12, y: 12},
//   {x: 12, y: 11},
//   {x: 12, y: 10},
//   {x: 12, y: 9},
//   {x: 12, y: 8},
//   {x: 13, y: 8},
//   {x: 13, y: 7},
//   {x: 13, y: 6},
//   {x: 13, y: 5},
//   {x: 13, y: 4},
//   {x: 12, y: 4},
//   {x: 12, y: 3},
//   {x: 11, y: 3},
//   {x: 10, y: 3},
//   {x: 10, y: 2},
//   {x: 9, y: 2},
//   {x: 9, y: 1},
//   {x: 10, y: 1},
//   {x: 11, y: 1},
//   {x: 11, y: 2},
//   {x: 12, y: 2},
//   {x: 13, y: 2},
//   {x: 13, y: 1},
//   {x: 13, y: 0},
//   {x: 12, y: 0},
//   {x: 12, y: -1},
//   {x: 11, y: -1},
//   {x: 10, y: -1},
//   {x: 9, y: -1},
//   {x: 9, y: -2},
//   {x: 9, y: -3},
//   {x: 8, y: -3},
//   {x: 8, y: -4},
// ];

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
  const currentMapStr = hashCoordinate(currentMap);

  if (maxTries <= 0) {
    await logError(
      'map loop',
      `map change from ${currentMapStr} to ${hashCoordinate(nextMap)} failed after many tries`
    );
    updateStatus(`La map ${hashCoordinate(nextMap)} n'est toujours pas identifiée, déco/reco.`);
    throw new StartScenarioError(ScenarioType.Connection, 'changing map is too long');
  }

  // Get the next map direction
  const nextMapStr = hashCoordinate(nextMap);
  const direction = getDirection(currentMap, nextMap);
  updateStatus(
    `Fin de la pêche sur la map (${currentMapStr}). Prochaine map est ${nextMapStr} (${direction})`
  );

  // Identification of the soleil
  const soleils = data.soleil.filter(s => {
    if (direction === Direction.Right) {
      return s.coordinate.x >= HORIZONTAL_SQUARES - 2;
    }
    if (direction === Direction.Left) {
      return s.coordinate.x <= 1;
    }
    if (direction === Direction.Top) {
      return s.coordinate.y >= VERTICAL_SQUARES - 2;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (direction === Direction.Bottom) {
      return s.coordinate.y <= 1;
    }
    throw new Error(`Invalid direction ${direction}`);
  });

  if (soleils.length === 0) {
    const status = `Pas de soleil dans la direction ${direction} pour la map ${currentMapStr}. Soleils disponibles : ${data.soleil
      .map(s => hashCoordinate(s.coordinate))
      .join(', ')}. Pause de 5s avant redémarrage du scénario.`;
    await logError('map loop', status);
    updateStatus(status);
    await sleep(canContinue, 5000);
    return fishingScenario(ctx);
  }

  let soleil = soleils[0]!;
  if (soleils.length > 1) {
    soleil = [...soleils].sort((s1, s2) => {
      if (squareIsAngle(s1.coordinate)) {
        if (squareIsAngle(s2.coordinate)) {
          return -1;
        }
        return 1;
      }
      if (squareIsAngle(s2.coordinate)) {
        return -1;
      }
      return -1;
    })[0]!;
    updateStatus(
      `Plusieurs soleil disponible pour la direction ${direction} : ${soleils
        .map(s => hashCoordinate(s.coordinate))
        .join(', ')}. Le premier soleil qui n'est pas un angle est choisi.`
    );
    // }
  }

  // Click on the soleil
  updateStatus(`Déplacement en ${hashCoordinate(soleil.coordinate)}`);
  const soleilPx = mapCoordinateToImageCoordinate(soleil.coordinate);
  const soleilCenter = squareCenter(soleilPx);

  await click(canContinue, {...soleilCenter, radius: 10});
  await moveToSafeZone(canContinue);

  // In case no map changed occured, we restart
  if (!(await waitForMapChange(ctx, nextMap))) {
    updateStatus(`Trying again`);
    await changeMap(ctx, data, currentMap, nextMap, maxTries - 1);
  }
}

export const fishingScenario: Scenario = async ctx => {
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
    const coordinateStr = hashCoordinate(coordinate);

    // Map identification
    const indexInMapLoop = mapLoop.findIndex(m => m.x === coordinate.x && m.y === coordinate.y);
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
    await changeMap(ctx, lastData, coordinate, nextMap, 3);
    updateStatus(`Déplacement terminé`);
  }
  /* eslint-enable no-await-in-loop */
};
