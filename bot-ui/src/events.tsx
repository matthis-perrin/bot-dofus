import {createDataStore} from './data_store';

interface ServerState {
  screenshot: string;
}

const serverStateStore = createDataStore<ServerState>({screenshot: ''});
export const useServerState = serverStateStore.useData;
export const getServerState = serverStateStore.getData;
export const setServerState = serverStateStore.setData;

export function subscribeToEvents(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiUrl = (window as any).env.apiUrl as string;
  const eventSource = new EventSource(`http://${apiUrl}/events`);
  eventSource.onmessage = rawEvent => {
    const event = JSON.parse(rawEvent.data);
    if (event.type === 'screenshot') {
      setServerState({...getServerState(), screenshot: event.data});
    } else {
      console.log('Unknown event', event);
    }
  };
}
