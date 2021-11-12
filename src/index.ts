import {tmpdir} from 'os'
import {mkdirSync, promises} from 'fs';
import {join} from 'path';

import Jimp from 'jimp'
import { windowManager } from "node-window-manager";
import {} from 'robotjs'
import GK from 'global-keypress';
import { execAsync } from './utils';
import { initDofusWindow } from './dofus_window';
import { startScreenshotTaker } from './screenshot_taker';

async function run(): Promise<void> {
    await initDofusWindow();
    startScreenshotTaker();
}

run().catch(console.error)
