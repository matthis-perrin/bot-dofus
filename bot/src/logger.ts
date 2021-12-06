import {promises} from 'fs';
import {join} from 'path';

import {ScenarioStatusWithTime} from '../../common/src/model';
import {convertToPng, screenshot} from './screenshot';

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
  await appendFile(join(dir, 'events.txt'), `[${new Date().toLocaleString()}] ${event}\n`);
}

let recentLogs: ScenarioStatusWithTime[] = [];
export function setRecentLogs(logs: ScenarioStatusWithTime[]): void {
  recentLogs = logs;
}

export async function logError(context: string, err: unknown): Promise<void> {
  const dateStr = new Date().toLocaleTimeString();
  const dir = join(getTodayPath(), `error-${dateStr}`);
  await mkdir(dir, {recursive: true});
  await appendFile(
    join(dir, 'error.txt'),
    `[${context}] ${String(err)}\n\n----\nRecent logs\n----\n\n${recentLogs
      .map(log => `[${new Date(log.time).toLocaleString()}] ${log.value}`)
      .join('\n')}`
  );
  await writeFile(join(dir, 'screenshot.png'), await convertToPng(screenshot().game));
}
