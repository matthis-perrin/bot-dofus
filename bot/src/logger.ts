import {promises} from 'fs';
import {join} from 'path';

import {ScenarioStatusWithTime} from '../../common/src/model';
import {convertToPng, RgbImage, screenshot} from './screenshot';

const {mkdir, appendFile, writeFile} = promises;

export function padLeft(str: string, size: number, c: string): string {
  let val = str;
  while (val.length < size) {
    val = `${c}${val}`;
  }
  return val;
}

function getTodayPath(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = padLeft(String(date.getMonth() + 1), 2, '0');
  const dd = padLeft(String(date.getDate()), 2, '0');
  return join(`./logs/${yyyy}-${mm}-${dd}`);
}

export async function logEvent(event: string): Promise<void> {
  const dir = getTodayPath();
  await mkdir(dir, {recursive: true});
  const eventStr = `[${new Date().toLocaleString()}] ${event}`;
  await appendFile(join(dir, 'events.txt'), `${eventStr}\n`);
}

let recentLogs: ScenarioStatusWithTime[] = [];
export function setRecentLogs(logs: ScenarioStatusWithTime[]): void {
  recentLogs = logs;
}

const SCREENSHOT_HISTORY_SIZE = 10;
let lastScreenshots: RgbImage[] = [];
export function addScreenshot(rgbImage: RgbImage): void {
  lastScreenshots.unshift(rgbImage);
  lastScreenshots = lastScreenshots.slice(0, SCREENSHOT_HISTORY_SIZE);
}

export async function logError(context: string, err: unknown): Promise<void> {
  const dateStr = new Date().toLocaleTimeString();
  const dir = join(getTodayPath(), `error-${dateStr}`);
  await mkdir(dir, {recursive: true});
  const errStr = `[${context}] ${String(err)}`;
  console.log(errStr);
  await appendFile(
    join(dir, 'error.txt'),
    `${errStr}\n\n----\nRecent logs\n----\n\n${recentLogs
      .map(log => `[${new Date(log.time).toLocaleString()}] ${log.value}`)
      .join('\n')}`
  );
  const currentScreenshot = screenshot().game;
  await Promise.all(
    [currentScreenshot, ...lastScreenshots].map(async (s, i) =>
      writeFile(join(dir, `screenshot-${i}.png`), await convertToPng(s))
    )
  );
}
