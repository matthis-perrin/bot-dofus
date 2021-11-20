import {Message} from '../../common/src/model';
import {env} from './env';
import {getServerState, setServerState} from './stores';

export function subscribeToEvents(): void {
  const eventSource = new EventSource(`http://${env.apiUrl}/events`);
  eventSource.onmessage = rawEvent => {
    const event = JSON.parse(rawEvent.data as string) as Message;
    /* eslint-disable @typescript-eslint/no-unnecessary-condition */
    if (event.type === 'screenshot') {
      setServerState({...getServerState(), screenshot: event.data});
    } else if (event.type === 'soleil') {
      setServerState({...getServerState(), soleil: event.data});
    } else if (event.type === 'coordinate') {
      setServerState({...getServerState(), coordinate: event.data});
    } else if (event.type === 'fish') {
      setServerState({...getServerState(), fish: event.data});
    } else if (event.type === 'scenario') {
      setServerState({...getServerState(), scenario: event.data});
      console.log(event.data);
    } else if (event.type === 'scenario-new-status') {
      const currentState = getServerState();
      const statusHistory = currentState.scenario.statusHistory;
      statusHistory.unshift(event.data.newStatus);
      setServerState({...currentState, scenario: {isRunning: event.data.isRunning, statusHistory}});
      console.log(event.data);
    } else {
      console.log('Unknown event', event);
    }
    /* eslint-enable @typescript-eslint/no-unnecessary-condition */
  };
}
