import {createHash} from 'crypto';
import {promises} from 'fs';
import {join} from 'path';

import {convertToPng, screenshot} from './screenshot';

const {access, writeFile} = promises;

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
