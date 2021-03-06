import {promises} from 'fs';
import {createServer, ServerResponse} from 'http';
import {networkInterfaces} from 'os';
import {join} from 'path';

import {Coordinate, GAME_HEIGHT, GAME_WIDTH} from '../../common/src/coordinates';
import {Fish, Message, Soleil} from '../../common/src/model';
import {
  CharacterDb,
  getAllCharacters,
  getImage,
  getNextBatch,
  markBatch,
} from './character_screenshots';
import {handleError} from './error';
import {fishDb} from './fish_db';
import {Intelligence} from './intelligence';
import {ScenarioRunner} from './scenario_runner';
import {convertToPng, scanMap, screenshot} from './screenshot';
import {soleilDb} from './soleil_db';

const {readFile, writeFile, mkdir} = promises;

const eventsSubscribers: Set<ServerResponse> = new Set();
setInterval(() => {
  // Send keepalive
  for (const res of eventsSubscribers) {
    res.write('\n');
  }
}, 20 * 1000);

export function sendEvent(obj: Message): void {
  const msg = JSON.stringify(obj);
  for (const res of eventsSubscribers) {
    res.write(`data: ${msg}\n\n`);
  }
}

export async function apiHandler(
  ia: Intelligence,
  runner: ScenarioRunner,
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any
): Promise<unknown> {
  if (url === '/refresh') {
    const data = await ia.refresh();
    const png = await convertToPng(data.screenshot, {
      width: (2 * GAME_WIDTH) / 3,
      height: (2 * GAME_HEIGHT) / 3,
    });
    const inventory = await readFile('./inventory/last.png').catch(() => Buffer.from(''));
    return {
      ...data,
      screenshot: png.toString('base64'),
      inventory: inventory.toString('base64'),
      mapScan: scanMap(),
    };
  } else if (url === '/mark-character-batch') {
    await markBatch(params as CharacterDb);
    return {};
  }
  console.log(url, params);
  if (url === '/set-fish') {
    await fishDb.set(params.map as Coordinate, params.fish as Fish);
    return {};
  } else if (url === '/update-fish-pos') {
    await fishDb.updateFishPos(
      params.map as Coordinate,
      params.fish as Coordinate,
      params.up as boolean
    );
    return {};
  } else if (url === '/delete-fish') {
    await fishDb.delete(params.map as Coordinate, params.fish as Coordinate);
    return {};
  } else if (url === '/inverse-positions') {
    await fishDb.inversePositions(params.map as Coordinate);
  } else if (url === '/set-soleil') {
    await soleilDb.set(params.map as Coordinate, params.soleil as Soleil);
    return {};
  } else if (url === '/delete-soleil') {
    await soleilDb.delete(params.map as Coordinate, params.soleil as Coordinate);
    return {};
  } else if (url === '/take-screenshot') {
    const {x, y} = params as Coordinate;
    const {game} = screenshot();
    const buffer = await convertToPng(game, {width: 440, height: 256});
    const path = join('images', 'map', `${x}h${y}`);
    await mkdir(path, {recursive: true});
    await writeFile(join(path, `${Date.now()}.png`), buffer);
    return {};
  } else if (url === '/start-scenario') {
    runner.start();
  } else if (url === '/stop-scenario') {
    runner.stop();
  } else if (url === '/character-batch') {
    return getNextBatch();
  } else if (url === '/all-characters') {
    return getAllCharacters();
  }

  return Promise.resolve(`unknown URL ${url}`);
}

export function startServer(ai: Intelligence, runner: ScenarioRunner): void {
  const localIp = getLocalIp();
  const port = 3000;
  if (localIp === undefined) {
    throw new Error('Failure to identify local IP address');
  }
  const url = `${localIp}:${port}`;

  const uiDist = './bot-ui/dist';

  const envVariables = {
    apiUrl: url,
  };

  createServer((req, res) => {
    const {method, url} = req;

    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Max-Age', '300');

    try {
      if (method === 'GET') {
        let file = url;
        if (file === undefined || !file.startsWith('/')) {
          res.statusCode = 404;
          res.end();
          return;
        }
        if (file === '/events') {
          req.on('close', () => eventsSubscribers.delete(res));
          eventsSubscribers.add(res);
          /* eslint-disable @typescript-eslint/naming-convention */
          res.writeHead(200, {
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache',
            'Content-Type': 'text/event-stream',
          });
          /* eslint-enable @typescript-eslint/naming-convention */
          res.flushHeaders();
          res.write('\n');
          runner.sendStatus();
          return;
        }
        if (file.startsWith('/images/')) {
          getImage(file.slice('/images/'.length))
            .then(img => {
              res.setHeader('Content-Type', 'image/png');
              res.statusCode = 200;
              res.end(img);
            })
            .catch(err => {
              res.statusCode = 500;
              res.end(String(err));
            });
          return;
        }
        if (file === '/' || file === '/index.html') {
          file = '/index.html';
        }
        readFile(join(uiDist, file))
          .then(content => {
            if (file === '/index.html') {
              res.end(
                content
                  .toString()
                  .replace('window.env = {}', `window.env = ${JSON.stringify(envVariables)}`)
              );
            } else {
              res.end(content);
            }
          })
          .catch(err => {
            handleError(err);
            res.statusCode = 404;
            res.end();
          });
      }
      if (method === 'POST') {
        let data = '';
        req.on('data', chunk => {
          data += chunk;
        });
        req.on('end', () => {
          let body: unknown;
          try {
            body = JSON.parse(data);
          } catch {
            // leave body undefined
          }
          if (url === undefined) {
            res.statusCode = 404;
            res.end();
            return;
          }
          apiHandler(ai, runner, url, body)
            .then(returnValue => res.end(JSON.stringify(returnValue)))
            .catch(err => {
              res.statusCode = 500;
              res.end(String(err));
            });
        });
      }
      if (method === 'OPTIONS') {
        res.end();
      }
    } catch (err: unknown) {
      handleError(err);
      res.statusCode = 500;
      res.end(String(err));
    }
  }).listen(port, localIp);
  console.log(`Server started on \u001B[96mhttp://${url}\u001B[0m`);
}

export function getLocalIp(): string | undefined {
  return Object.values(networkInterfaces())
    .flat()
    .find(f => f?.family.includes('IPv4') && !f.internal)?.address;
}
