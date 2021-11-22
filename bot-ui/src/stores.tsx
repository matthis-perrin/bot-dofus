import {Coordinate} from '../../common/src/coordinates';
import {CoordinateData, FishData, ScenarioStatusWithTime, SoleilData} from '../../common/src/model';
import {createDataStore} from './data_store';

export interface ServerState {
  screenshot: string;
  soleil: SoleilData;
  coordinate: CoordinateData;
  fish: FishData;
}

const serverStateStore = createDataStore<ServerState>({
  screenshot: '',
  soleil: [],
  coordinate: {label: '', score: 0, coordinate: {x: 0, y: 0}},
  fish: [],
});
export const useServerState = serverStateStore.useData;
export const getServerState = serverStateStore.getData;
export const setServerState = serverStateStore.setData;

//

interface ScenarioState {
  isRunning: boolean;
  statusHistory: ScenarioStatusWithTime[];
}

const scenarioStateStore = createDataStore<ScenarioState>({
  isRunning: false,
  statusHistory: [],
});
export const useScenarioState = scenarioStateStore.useData;
export const getScenarioState = scenarioStateStore.getData;
export const setScenarioState = scenarioStateStore.setData;

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
