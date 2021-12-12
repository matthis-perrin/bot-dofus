import {Coordinate} from './coordinates';

export enum FishSize {
  Small = 'Petit',
  Medium = 'Normal',
  Big = 'Gros',
  Giant = 'Géant',
}
export const allFishSize = Object.values(FishSize);

export enum FishType {
  Sea = 'Mer',
  River = 'Rivère',
}
export const allFishType = Object.values(FishType);

export interface Fish {
  coordinate: Coordinate;
  type?: FishType;
  size?: FishSize;
  distance?: number;
}

export interface Soleil {
  coordinate: Coordinate;
}

export const fishPopupSizes: Record<FishType, Record<FishSize, {width: number; height: number}>> = {
  [FishType.Sea]: {
    [FishSize.Small]: {width: 187, height: 64},
    [FishSize.Medium]: {width: 161, height: 64},
    [FishSize.Big]: {width: 181, height: 64},
    [FishSize.Giant]: {width: 196, height: 64},
  },
  [FishType.River]: {
    [FishSize.Small]: {width: 208, height: 64},
    [FishSize.Medium]: {width: 161, height: 64},
    [FishSize.Big]: {width: 202, height: 64},
    [FishSize.Giant]: {width: 218, height: 64},
  },
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const fishPopupScreenshotSize = fishPopupSizes[FishType.Sea][FishSize.Medium]!;

////

export const allFishDistance = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export interface CoordinateData {
  score: number;
  label: string;
  coordinate: Coordinate;
}
export const COORDINATE_MIN_SCORE = 0.7;

export type FishData = Fish[];
export type SoleilData = Soleil[];

//

export type ScenarioStatus = string;
export interface ScenarioStatusWithTime {
  id: string;
  value: ScenarioStatus;
  time: number;
}

export enum SquareType {
  Red = 'red',
  Blue = 'blue',
  Light = 'light',
  Dark = 'dark',
  Wall = 'wall',
  Unknown = 'unknown',
}

export type MapScan = Record<number, Record<number, SquareType>>;
export interface FightScenarioData {
  isInFight: boolean;
  mapScan?: MapScan;
}

export interface ScenarioMessage {
  type: 'scenario';
  data: {
    isRunning: boolean;
    currentScenario: ScenarioType;
    statusHistory: ScenarioStatusWithTime[];
  };
}

export interface ScenarioStatusMessage {
  type: 'scenario-new-status';
  data: {
    isRunning: boolean;
    currentScenario: ScenarioType;
    newStatus: ScenarioStatusWithTime;
  };
}

export type Message = ScenarioMessage | ScenarioStatusMessage;

export enum ScenarioType {
  PostFight = 'PostFight',
  EmptyBank = 'EmptyBank',
  Fight = 'Fight',
  Connection = 'Connection',
  Fishing = 'Fishing',
  InitialScenario = 'Initial',
}
