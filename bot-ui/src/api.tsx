import {env} from './env';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiCall(url: string, data?: unknown): Promise<any> {
  return fetch(`http://${env.apiUrl}${url}`, {
    method: 'POST',
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then(async response => response.json().catch(() => undefined));
}
