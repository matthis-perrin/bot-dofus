import {windowManager} from 'node-window-manager';
import {getScreenSize} from 'robotjs';

export function initDofusWindow(): void {
  const {width} = getScreenSize();
  const targetWidth = 1130;
  const targetHeight = 875;

  const dofusWindow = windowManager.getWindows().find(w => w.path.includes('Dofus Retro.app'));
  if (dofusWindow === undefined) {
    throw new Error(`Failure to find Dofus window`);
  }
  windowManager.requestAccessibility();
  dofusWindow.setBounds({
    x: width - targetWidth,
    y: 0,
    width: targetWidth,
    height: targetHeight,
  });
  dofusWindow.bringToTop();
}
