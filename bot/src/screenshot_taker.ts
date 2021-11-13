import {promises} from 'fs';
import GK from 'global-keypress';
import {join} from 'path';

import {handleError} from './error';
import {takeGameScreenshot} from './screenshot';

const {mkdir, writeFile} = promises;

async function saveCoordinateImage(): Promise<void> {
  await mkdir('./images/map', {recursive: true}).catch(() => {});
  const img = await takeGameScreenshot(true);
  await writeFile(img, join('./images/map', `${Date.now()}.png`));
}

export function startScreenshotTaker(): void {
  const gk = new GK();
  gk.start();
  gk.on('press', data => {
    if (data.data === '<Space>') {
      // eslint-disable-next-line no-console
      console.log('Taking screenshot');
      saveCoordinateImage().catch(handleError);
    }
  });
  gk.on('error', handleError);

  setInterval(() => {}, 1000);
}
