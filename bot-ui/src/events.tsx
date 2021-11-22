import {Message} from '../../common/src/model';
import {apiCall} from './api';
import {env} from './env';
import {getScenarioState, ServerState, setScenarioState, setServerState} from './stores';

export function subscribeToEvents(): void {
  const eventSource = new EventSource(`http://${env.apiUrl}/events`);
  eventSource.onmessage = rawEvent => {
    const event = JSON.parse(rawEvent.data as string) as Message;

    if (event.type === 'scenario') {
      setScenarioState(event.data);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (event.type === 'scenario-new-status') {
      const currentState = getScenarioState();
      const statusHistory = currentState.statusHistory;
      statusHistory.unshift(event.data.newStatus);
      setScenarioState({isRunning: event.data.isRunning, statusHistory});
    } else {
      console.log('Unknown event', event);
    }
  };
}

export function startRefreshLoop(): void {
  apiCall('/refresh')
    .then((newState: ServerState) => setServerState(newState))
    .catch(console.error)
    .finally(() => setTimeout(startRefreshLoop, 1000));
}
