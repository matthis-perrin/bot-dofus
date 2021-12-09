import {Coordinate} from '../../common/src/coordinates';
import {
  CoordinateData,
  FishData,
  MapScan,
  ScenarioStatusWithTime,
  ScenarioType,
  SoleilData,
} from '../../common/src/model';
import {createDataStore} from './data_store';

export interface ServerState {
  screenshot: string;
  mapScan: MapScan;
  soleil: SoleilData;
  coordinate: CoordinateData;
  fish: FishData;
}

const serverStateStore = createDataStore<ServerState>({
  screenshot: '',
  mapScan: {},
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
  currentScenario: ScenarioType;
  statusHistory: ScenarioStatusWithTime[];
}

const scenarioStateStore = createDataStore<ScenarioState>({
  isRunning: false,
  currentScenario: ScenarioType.Fishing,
  statusHistory: [],
});
export const useScenarioState = scenarioStateStore.useData;
export const getScenarioState = scenarioStateStore.getData;
export const setScenarioState = scenarioStateStore.setData;

//

interface ClientState {
  action?: 'editing-fish' | 'editing-soleil' | 'take-screenshot' | 'view-fight';
}

const clientStateStore = createDataStore<ClientState>({});
export const useClientState = clientStateStore.useData;
export const getClientState = clientStateStore.getData;
export const setClientState = clientStateStore.setData;

//

interface SquareFetcher {
  selectedSquares: {
    coordinate: Coordinate;
    borderColor?: string;
    fillColor?: string;
    content?: JSX.Element;
  }[];
  hoverColor: string;
  onSquareClick: (coordinate: Coordinate) => void;
}

interface SquareFetching {
  fishFetcher?: SquareFetcher;
  soleilFetcher?: SquareFetcher;
}

const squareFetchingStore = createDataStore<SquareFetching>({});
export const useSquareFetching = squareFetchingStore.useData;
export const getSquareFetching = squareFetchingStore.getData;
export const setSquareFetching = squareFetchingStore.setData;

//

interface SquareOverlay {
  overlay?: {
    coordinate: Coordinate;
    color: string;
  }[];
}

const squareOverlayStore = createDataStore<SquareOverlay>({});
export const useSquareOverlay = squareOverlayStore.useData;
export const getSquareOverlay = squareOverlayStore.getData;
export const setSquareOverlay = squareOverlayStore.setData;
