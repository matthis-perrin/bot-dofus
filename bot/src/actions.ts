import {mouseClick, moveMouseSmooth} from 'robotjs';

import {Coordinate} from '../../common/src/coordinates';
import {CanContinue} from './scenario_runner';

export async function click(
  checkCanContinue: CanContinue,
  opts: {x: number; y: number; button?: 'right' | 'left'; radius: number}
): Promise<Coordinate> {
  checkCanContinue();

  const {x, y, radius, button = 'left'} = opts;
  const target = {x, y};
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomRadius = Math.random() * radius;
  // Default speed is 3. Generate between 2 and 4.
  const randomSpeed = 3 + Math.random() * 2 - 1;

  const clickCoordinate = {
    x: target.x + randomRadius * Math.cos(randomAngle),
    y: target.y + randomRadius * Math.sin(randomAngle),
  };

  moveMouseSmooth(clickCoordinate.x, clickCoordinate.y, randomSpeed);
  checkCanContinue();

  await sleep(Math.random() * 500 + 0);
  checkCanContinue();

  mouseClick(button);
  checkCanContinue();

  await sleep(Math.random() * 500 + 0);
  checkCanContinue();

  return clickCoordinate;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
