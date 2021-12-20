import {createHash} from 'crypto';
import {promises} from 'fs';
import {join} from 'path';

import {convertToPng, screenshot} from './screenshot';

const {access, writeFile, readFile} = promises;

let saved = 0;
export async function saveCharacterImages(): Promise<void> {
  const dir = join('./images/character');
  await Promise.all(
    screenshot().characterSquares.map(async square => {
      const hash = createHash('md5').update(square.image.data).digest('hex');
      try {
        await access(join(dir, `${hash}.png`));
      } catch {
        const image = await convertToPng(square.image);
        saved++;
        console.log(saved);
        await writeFile(join(dir, `${hash}.png`), image);
      }
    })
  );
}

export type CharacterDb = Record<string, 'yes' | 'no' | false>;
let db: CharacterDb = {};
const dbPath = join('./models/character.json');

export async function initDb(): Promise<void> {
  const content = await readFile(dbPath);
  db = JSON.parse(content.toString());
}

export async function saveDb(): Promise<void> {
  await writeFile(dbPath, JSON.stringify(db));
}

const imagesByBatch = 66;

export function getNextBatch(): string[] {
  return Object.entries(db)
    .filter(e => e[1] === false)
    .slice(0, imagesByBatch)
    .map(e => e[0]);
}

export function getAllCharacters(): string[] {
  return Object.entries(db)
    .filter(e => e[1] === 'yes')
    .map(e => e[0]);
}

export async function markBatch(values: CharacterDb): Promise<void> {
  for (const [key, value] of Object.entries(values)) {
    db[key] = value;
  }
  let done = 0;
  let notDone = 0;
  for (const value of Object.values(db)) {
    if (value === false) {
      notDone++;
    } else {
      done++;
    }
  }
  const total = done + notDone;
  const percent = Math.round((1000 * done) / total) / 10;
  console.log(`${done}/${total} (${percent}%)`);
  await saveDb();
}

export async function getImage(img: string): Promise<Buffer> {
  return readFile(join(`./images/character/${img}`));
}
