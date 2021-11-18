import {Coordinate} from '../../common/src/coordinates';
import {
  CoordinateMessage,
  FishMessage,
  ScreenshotMessage,
  SoleilMessage,
} from '../../common/src/model';
import {createDataStore} from './data_store';

interface ServerState {
  screenshot: ScreenshotMessage['data'];
  soleil: SoleilMessage['data'];
  coordinate: CoordinateMessage['data'];
  fish: FishMessage['data'];
}

const serverStateStore = createDataStore<ServerState>({
  screenshot: {image: '', isRunning: false},
  soleil: [],
  coordinate: {label: '', score: 0, coordinate: {x: 0, y: 0}},
  fish: [],
});
export const useServerState = serverStateStore.useData;
export const getServerState = serverStateStore.getData;
export const setServerState = serverStateStore.setData;

//

interface ClientState {
  action?: 'editing-fish' | 'take-screenshot';
}

const clientStateStore = createDataStore<ClientState>({});
export const useClientState = clientStateStore.useData;
export const getClientState = clientStateStore.getData;
export const setClientState = clientStateStore.setData;

//

interface SquareFetcher {
  selectedSquares: {
    coordinate: Coordinate;
    color: string;
    content?: JSX.Element;
  }[];
  hoverColor: string;
  onSquareClick: (coordinate: Coordinate) => void;
}

interface SquareFetching {
  fetcher?: SquareFetcher;
}

const squareFetchingStore = createDataStore<SquareFetching>({});
export const useSquareFetching = squareFetchingStore.useData;
export const getSquareFetching = squareFetchingStore.getData;
export const setSquareFetching = squareFetchingStore.setData;
