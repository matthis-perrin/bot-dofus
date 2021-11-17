import {promises} from 'fs';
import {createServer, ServerResponse} from 'http';
import {networkInterfaces} from 'os';
import {join} from 'path';

import {Message} from '../../common/model';
import {handleError} from './error';
import {screenhotManager} from './screenshot_manager';

const {readFile} = promises;

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
export async function apiHandler(url: string, params: any): Promise<unknown> {
  console.log(url, params);
  if (url === '/stop-screenshot') {
    screenhotManager.stop();
    return {};
  } else if (url === '/start-screenshot') {
    screenhotManager.start();
    return {};
  }
  return Promise.resolve(`unknown URL ${url}`);
}

export function startServer(): void {
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
          apiHandler(url, body)
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
