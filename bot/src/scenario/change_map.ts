import {
  Coordinate,
  HORIZONTAL_SQUARES,
  mapCoordinateToImageCoordinate,
  squareCenter,
  squareIsAngle,
  VERTICAL_SQUARES,
} from '../../../common/src/coordinates';
import {ScenarioType} from '../../../common/src/model';
import {click, moveToSafeZone, sleep, waitForMapChange} from '../actions';
import {isMenuModalOpened} from '../detectors';
import {hashCoordinate} from '../fight';
import {Data} from '../intelligence';
import {logError} from '../logger';
import {ScenarioContext, StartScenarioError} from '../scenario_runner';
import {fishingScenario} from './fishing_scenario';

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

export async function changeMap(
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

  const clickPos = await click(canContinue, {...soleilCenter, radius: 10});
  await moveToSafeZone(canContinue);

  // Check if a player is in front of it
  if (isMenuModalOpened(clickPos)) {
    await click(canContinue, {x: clickPos.x + 5, y: clickPos.y + 8, radius: 2});
    // Move the player one square away from it (in case we are the one in the way)
    const nextToSoleil = {...soleil.coordinate};
    if (direction === Direction.Bottom) {
      nextToSoleil.y -= 2;
    } else if (direction === Direction.Top) {
      nextToSoleil.y += 2;
    } else if (direction === Direction.Left) {
      nextToSoleil.x += 1;
    } else {
      nextToSoleil.x -= 1;
    }
    const nextToSoleilPx = mapCoordinateToImageCoordinate(nextToSoleil);
    const nextToSoleilCenter = squareCenter(nextToSoleilPx);
    await click(canContinue, {...nextToSoleilCenter, radius: 10});
    await moveToSafeZone(canContinue);
    // Retry
    return changeMap(ctx, data, currentMap, nextMap, maxTries - 1);
  }

  // In case no map changed occured, we restart
  if (!(await waitForMapChange(ctx, nextMap))) {
    updateStatus(`Trying again`);
    await changeMap(ctx, data, currentMap, nextMap, maxTries - 1);
  }
}
