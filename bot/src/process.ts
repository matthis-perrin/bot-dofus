import {keyTap} from 'robotjs';

import {sleepInternal} from './actions';

export async function restart(): Promise<never> {
  keyTap('r', 'command');
  await sleepInternal(5000);
  // eslint-disable-next-line node/no-process-exit
  process.exit();
}

export function stopBotEntirely(): never {
  // eslint-disable-next-line node/no-process-exit
  process.exit(111);
}
