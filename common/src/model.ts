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

export const allFishDistance = [1, 2, 3, 4, 5, 6, 7, 8];

export type SoleilData = {
    x: number;
    y: number;
    score: number;
    label: string;
}[];

export interface CoordinateData {
  score: number;
  label: string;
  coordinate: Coordinate;
}
export const COORDINATE_MIN_SCORE = 0.75;

export type FishData = Fish[]

//

export type ScenarioStatus = string;
export interface ScenarioStatusWithTime {
  value: ScenarioStatus;
  time: number;
}
export interface ScenarioMessage {
  type: 'scenario';
  data: {
    isRunning: boolean;
    statusHistory: ScenarioStatusWithTime[];
  };
}
export interface ScenarioStatusMessage {
  type: 'scenario-new-status';
  data: {
    isRunning: boolean;
    newStatus: ScenarioStatusWithTime;
  };
}

export type Message =
  | ScenarioMessage
  | ScenarioStatusMessage;
