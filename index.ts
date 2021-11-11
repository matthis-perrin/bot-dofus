import {tmpdir} from 'os'
import {exec} from 'child_process'
import {promises} from 'fs';
import {join} from 'path';

import Jimp from 'jimp'
import { windowManager } from "node-window-manager";
import {} from 'robotjs'


const {readFile, unlink, writeFile} = promises

async function execAsync(cmd: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        exec(cmd, {}, (err => {
            if (err) {
                return reject(err);
            }
            resolve();
        }))
    })
}

async function takeScreenshot(): Promise<Buffer> {
    const filePath = join(tmpdir(), `${Math.random().toString(36).slice(2)}.bmp`)
    const cmd = `screencapture -D 1 -t bmp -x ${filePath}`
    await execAsync(cmd);
    const file = await readFile(filePath);
    await unlink(filePath);
    return file;
}

// async function analyzeScreenshot(img: Buffer): Promise<void> {
//     const original = await Jimp.read(img)
//     console.log(Jimp.intToRGBA(original.getPixelColor(100, 100)))
//     // const cropped = await original.crop(100, 100, 200, 200)
//     // await cropped.writeAsync('test.bmp')
// }

async function getScreenSize(): Promise<{width: number, height: number}> {
    const img = await takeScreenshot();
    const parsed = await Jimp.read(img);
    return {width: parsed.getWidth(), height: parsed.getHeight()}
}

let xOffset = 0;
let yOffset = 0;

async function initDofusWindow(): Promise<void> {
    const {width, height} = await getScreenSize();
    const targetWidth = 1130;
    const targetHeight = 875;

    const dofusWindow = windowManager.getWindows().find((w: any) => w.path.includes('Dofus Retro.app'));
    if (dofusWindow === undefined) {
        throw new Error(`Failure to find Dofus window`)
    }
    windowManager.requestAccessibility();
    dofusWindow.setBounds({x: width / 2 - targetWidth, y: height / 2 - targetHeight, width: targetWidth, height: targetHeight})
    dofusWindow.bringToTop();
}

function setIntervalAsync(fn: () => Promise<void>, ms: number): void {
    setInterval(() => {
        fn().catch(console.error);
    }, ms)
}

async function run(): Promise<void> {
    await initDofusWindow();
    setIntervalAsync(async () => {
        const img = await Jimp.read(await takeScreenshot());
        getTextInImage(img, 452, 102, 65, 25);
    }, 1000);
}

async function getTextInImage(img: Jimp, x: number, y: number, width: number, height: number): Promise<void> {
    const rawPath = 'test.bmp'
    const convertedPath = 'test-gray.bmp'
    const resPath = 'test-res'
    await img.crop(x * 2, y * 2, width * 2, height * 2).writeAsync(rawPath);
    await execAsync(`convert ${rawPath} -type Grayscale -negate ${convertedPath}`)
    await execAsync(`tesseract -c tessedit_char_whitelist=0123456789-, ${convertedPath} ${resPath}`) //-c tessedit_char_whitelist=0123456789
    console.log(await (await readFile(`${resPath}.txt`)).toString());
    await Promise.all([
        unlink(rawPath),
        unlink(convertedPath),
        unlink(`${resPath}.txt`),
    ])
}

run().catch(console.error)

// // // Move the mouse across the screen as a sine wave.
// // var robot = require("robotjs");
 
// // // Speed up the mouse.
// // robot.setMouseDelay(2);
 
// // var twoPI = Math.PI * 2.0;
// // var screenSize = robot.getScreenSize();
// // var height = (screenSize.height / 2) - 10;
// // var width = screenSize.width;
 
// // for (var x = 0; x < width; x++)
// // {
// //     y = height * Math.sin((twoPI * x) / width) + height;
// //     robot.moveMouse(x, y);
// // }