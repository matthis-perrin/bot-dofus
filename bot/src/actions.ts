import {mouseClick, moveMouseSmooth} from 'robotjs';

import {Coordinate} from '../../common/src/coordinates';
import {COORDINATE_MIN_SCORE} from '../../common/src/model';
import {
  imageCoordinateToScreenCoordinate,
  safeZone,
  screenCoordinateToImageCoordinate,
} from './coordinate';
import {CanContinue, ScenarioContext} from './scenario_runner';

export async function click(
  canContinue: CanContinue,
  opts: {
    x: number;
    y: number;
    button?: 'right' | 'left';
    radius: number;
    fast?: boolean;
    double?: boolean;
  }
): Promise<Coordinate> {
  await canContinue();

  const {x, y, radius, button = 'left', fast, double} = opts;
  const target = imageCoordinateToScreenCoordinate({x, y});
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomRadius = Math.random() * radius;
  // Default speed in the library is 3.
  const minSpeed = fast ? 0 : 1.5;
  const maxSpeed = fast ? 0.75 : 2.5;
  const randomSpeed = minSpeed + Math.random() * (maxSpeed - minSpeed);

  const clickCoordinate = {
    x: target.x + randomRadius * Math.cos(randomAngle),
    y: target.y + randomRadius * Math.sin(randomAngle),
  };

  moveMouseSmooth(clickCoordinate.x, clickCoordinate.y, randomSpeed);
  await canContinue();

  await sleep(canContinue, Math.random() * 500);
  await canContinue();

  mouseClick(button);
  if (double) {
    await sleepInternal(100);
    mouseClick(button);
  }
  await canContinue();

  await sleep(canContinue, Math.random() * 500);
  await canContinue();

  return screenCoordinateToImageCoordinate(clickCoordinate);
}

export async function moveToSafeZone(canContinue: CanContinue): Promise<void> {
  const minSpeed = 0;
  const maxSpeed = 0.75;
  const randomSpeed = minSpeed + Math.random() * (maxSpeed - minSpeed);
  const safeZoneScreen = imageCoordinateToScreenCoordinate(safeZone);
  moveMouseSmooth(safeZoneScreen.x, safeZoneScreen.y, randomSpeed);
  await canContinue();
}

export async function sleep(canContinue: CanContinue, ms: number): Promise<void> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // eslint-disable-next-line no-await-in-loop
    await canContinue();
    // eslint-disable-next-line no-await-in-loop
    await sleepInternal(Math.min(100, Date.now() - end));
  }
}

export async function randSleep(
  canContinue: CanContinue,
  minMs: number,
  maxMs: number
): Promise<void> {
  return sleep(canContinue, minMs + Math.random() * (maxMs - minMs));
}

export async function sleepInternal(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export async function waitForMapChange(
  ctx: ScenarioContext,
  nextMap: Coordinate
): Promise<boolean> {
  return waitFor(ctx, async () => {
    const {coordinate: newCoordinate} = await ctx.ia.refresh();
    return (
      newCoordinate.score >= COORDINATE_MIN_SCORE &&
      newCoordinate.coordinate.x === nextMap.x &&
      newCoordinate.coordinate.y === nextMap.y
    );
  });
}

export async function waitFor(
  ctx: ScenarioContext,
  detector: () => Promise<boolean> | boolean
): Promise<boolean> {
  const {canContinue, updateStatus} = ctx;
  // Wait until we changed map (for 10s max)
  const MAX_WAIT_TIME_MS = 10000;
  const SLEEP_DURATION_MS = 300;
  const startTime = Date.now();
  let detected = false;
  updateStatus(`Attente de changement de map`);
  while (Date.now() - startTime < MAX_WAIT_TIME_MS) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(canContinue, SLEEP_DURATION_MS);
    // eslint-disable-next-line no-await-in-loop
    await canContinue();
    // Check if change was detected

    // eslint-disable-next-line no-await-in-loop
    if (await Promise.resolve(detector())) {
      detected = true;
      break;
    }
  }

  return detected;
}
