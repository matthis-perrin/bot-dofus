import Jimp from 'jimp';
import {windowManager} from 'node-window-manager';

import {takeScreenshot} from './screenshot';

async function getScreenSize(): Promise<{width: number; height: number}> {
  const img = await takeScreenshot();
  const parsed = await Jimp.read(img);
  return {width: parsed.getWidth(), height: parsed.getHeight()};
}

export async function initDofusWindow(): Promise<void> {
  const {width} = await getScreenSize();
  const targetWidth = 1130;
  const targetHeight = 875;

  const dofusWindow = windowManager.getWindows().find(w => w.path.includes('Dofus Retro.app'));
  if (dofusWindow === undefined) {
    throw new Error(`Failure to find Dofus window`);
  }
  windowManager.requestAccessibility();
  dofusWindow.setBounds({
    x: width / 2 - targetWidth,
    y: 0,
    width: targetWidth,
    height: targetHeight,
  });
  dofusWindow.bringToTop();
}
