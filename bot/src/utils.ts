import {exec} from 'child_process';

import {handleError} from './error';

export async function execAsync(cmd: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    exec(cmd, {}, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }
      if (stderr.length > 0) {
        return reject(stderr);
      }
      resolve();
    });
  });
}

export function setIntervalAsync(fn: () => Promise<void>, ms: number): void {
  setInterval(() => {
    fn().catch(handleError);
  }, ms);
}
