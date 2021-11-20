import {promises} from 'fs';
import {createServer, ServerResponse} from 'http';
import {networkInterfaces} from 'os';
import {join} from 'path';

import {Coordinate} from '../../common/src/coordinates';
import {Message} from '../../common/src/model';
import {handleError} from './error';
import {fishDb} from './fish_db';
import {Intelligence} from './intelligence';
import {FishMapScenario} from './scenario';
import {takeGameScreenshot} from './screenshot';
import {screenhotManager} from './screenshot_manager';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiHandler(ia: Intelligence, url: string, params: any): Promise<unknown> {
  let currentScenario: FishMapScenario | undefined;
  console.log(url, params);
  if (url === '/stop-screenshot') {
    screenhotManager.stop();
    return {};
  } else if (url === '/start-screenshot') {
    screenhotManager.start();
    return {};
  } else if (url === '/set-fish') {
    await fishDb.set(params.map as Coordinate, params.fish);
    return {};
  } else if (url === '/delete-fish') {
    await fishDb.delete(params.map as Coordinate, params.fish as Coordinate);
    return {};
  } else if (url === '/take-screenshot') {
    const {x, y} = params as Coordinate;
    const buffer = await takeGameScreenshot(true);
    const path = join('images', 'map', `${x}h${y}`);
    await mkdir(path, {recursive: true});
    await writeFile(join(path, `${Date.now()}.png`), buffer);
    return {};
  } else if (url === '/start-scenario') {
    if (currentScenario) {
      currentScenario.stop();
    }
    const data = ia.getLastData();
    if (data === undefined) {
      return;
    }
    currentScenario = new FishMapScenario(data.coordinate.coordinate);
    currentScenario.start();
  } else if (url === '/stop-scenario') {
    if (!currentScenario) {
      return;
    }
    currentScenario.stop();
  }
  return Promise.resolve(`unknown URL ${url}`);
}

export function startServer(ai: Intelligence): void {
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
          ai.triggerManually();
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
          apiHandler(ai, url, body)
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
