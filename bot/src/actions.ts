import {mouseClick, moveMouseSmooth} from 'robotjs';

import {Coordinate} from '../../common/src/coordinates';
import {CanContinue} from './scenario_runner';

export async function click(
  canContinue: CanContinue,
  opts: {x: number; y: number; button?: 'right' | 'left'; radius: number}
): Promise<Coordinate> {
  await canContinue();

  const {x, y, radius, button = 'left'} = opts;
  const target = {x, y};
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomRadius = Math.random() * radius;
  // Default speed in the library is 3.
  const minSpeed = 1.5;
  const maxSpeed = 2.5;
  const randomSpeed = minSpeed + Math.random() * (maxSpeed - minSpeed);

  const clickCoordinate = {
    x: target.x + randomRadius * Math.cos(randomAngle),
    y: target.y + randomRadius * Math.sin(randomAngle),
  };

  moveMouseSmooth(clickCoordinate.x, clickCoordinate.y, randomSpeed);
  await canContinue();

  await sleep(canContinue, Math.random() * 500 + 0);
  await canContinue();

  mouseClick(button);
  await canContinue();

  await sleep(canContinue, Math.random() * 500 + 0);
  await canContinue();

  return clickCoordinate;
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

export async function sleepInternal(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
