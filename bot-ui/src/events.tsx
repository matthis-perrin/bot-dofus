import {CoordinateMessage, Message, SoleilMessage} from '../../common/model';
import {createDataStore} from './data_store';

interface ServerState {
  screenshot: string;
  soleil: SoleilMessage['data'];
  coordinate: CoordinateMessage['data'];
}

const serverStateStore = createDataStore<ServerState>({
  screenshot: '',
  soleil: [],
  coordinate: {label: '', score: 0},
});
export const useServerState = serverStateStore.useData;
export const getServerState = serverStateStore.getData;
export const setServerState = serverStateStore.setData;

export function subscribeToEvents(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiUrl = (window as any).env.apiUrl as string;
  const eventSource = new EventSource(`http://${apiUrl}/events`);
  eventSource.onmessage = rawEvent => {
    const event = JSON.parse(rawEvent.data as string) as Message;
    /* eslint-disable @typescript-eslint/no-unnecessary-condition */
    if (event.type === 'screenshot') {
      setServerState({...getServerState(), screenshot: event.data});
    } else if (event.type === 'soleil') {
      setServerState({...getServerState(), soleil: event.data});
    } else if (event.type === 'coordinate') {
      setServerState({...getServerState(), coordinate: event.data});
    } else {
      // eslint-disable-next-line no-console
      console.log('Unknown event', event);
    }
    /* eslint-enable @typescript-eslint/no-unnecessary-condition */
  };
}
