"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const jimp_1 = __importDefault(require("jimp"));
const node_window_manager_1 = require("node-window-manager");
const global_keypress_1 = __importDefault(require("global-keypress"));
const { readFile, unlink, writeFile } = fs_1.promises;
async function execAsync(cmd) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(cmd, {}, (err => {
            if (err) {
                return reject(err);
            }
            resolve();
        }));
    });
}
async function takeScreenshot() {
    const filePath = (0, path_1.join)((0, os_1.tmpdir)(), `${Math.random().toString(36).slice(2)}.bmp`);
    const cmd = `screencapture -D 1 -t bmp -x ${filePath}`;
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
async function getScreenSize() {
    const img = await takeScreenshot();
    const parsed = await jimp_1.default.read(img);
    return { width: parsed.getWidth(), height: parsed.getHeight() };
}
async function initDofusWindow() {
    const { width, height } = await getScreenSize();
    const targetWidth = 1130;
    const targetHeight = 875;
    const dofusWindow = node_window_manager_1.windowManager.getWindows().find((w) => w.path.includes('Dofus Retro.app'));
    if (dofusWindow === undefined) {
        throw new Error(`Failure to find Dofus window`);
    }
    node_window_manager_1.windowManager.requestAccessibility();
    dofusWindow.setBounds({ x: width / 2 - targetWidth, y: height / 2 - targetHeight, width: targetWidth, height: targetHeight });
    dofusWindow.bringToTop();
}
function setIntervalAsync(fn, ms) {
    setInterval(() => {
        fn().catch(console.error);
    }, ms);
}
async function run() {
    await initDofusWindow();
    // setIntervalAsync(async () => {
    //     const img = await Jimp.read(await takeScreenshot());
    //     getTextInImage(img, 452, 102, 65, 25);
    // }, 1000);
}
async function getTextInImage(img, x, y, width, height) {
    const rawPath = 'test.bmp';
    const convertedPath = 'test-gray.bmp';
    const resPath = 'test-res';
    await img.crop(x * 2, y * 2, width * 2, height * 2).writeAsync(rawPath);
    await execAsync(`convert ${rawPath} -type Grayscale -negate ${convertedPath}`);
    await execAsync(`tesseract -c tessedit_char_whitelist=0123456789-, ${convertedPath} ${resPath}`); //-c tessedit_char_whitelist=0123456789
    console.log(await (await readFile(`${resPath}.txt`)).toString());
    await Promise.all([
        unlink(rawPath),
        unlink(convertedPath),
        unlink(`${resPath}.txt`),
    ]);
}
(0, fs_1.mkdirSync)('./images');
async function saveCroppedImage(img, fileName, x, y, width, height) {
    await img.crop(x * 2, y * 2, width * 2, height * 2).writeAsync((0, path_1.join)('./images', fileName));
}
async function saveCoordinateImage() {
    const img = await jimp_1.default.read(await takeScreenshot());
    saveCroppedImage(img, `${Date.now()}.bmp`, 452, 102, 65, 25);
}
const gk = new global_keypress_1.default();
gk.start();
gk.on('press', data => {
    if (data.data === '<Space>') {
        saveCoordinateImage().catch(console.error);
    }
});
gk.on('error', error => { console.error(error); });
gk.on('close', () => { console.log('closed'); });
run().catch(console.error);
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
