import {Coordinate} from './coordinates';

export const gameCoordinates = {
  x: 310,
  y: 54,
  width: 1130,
  height: 657,
};

export const HORIZONTAL_SQUARES = 14;
export const VERTICAL_SQUARES = 16;

export const SQUARE_SIZE = {
  width: (2 * gameCoordinates.width) / HORIZONTAL_SQUARES,
  height: (2 * gameCoordinates.height) / VERTICAL_SQUARES,
};

////

export enum FishSize {
  Small = 'Petit',
  Medium = 'Normal',
  Big = 'Grand',
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

////

export interface ScreenshotMessage {
  type: 'screenshot';
  data: {
    image: string;
    isRunning: boolean;
  };
}

export const allFishDistance = [1, 2, 3, 4, 5, 6, 7, 8];

export interface SoleilMessage {
  type: 'soleil';
  data: {
    x: number;
    y: number;
    score: number;
    label: string;
  }[];
}

export interface CoordinateMessage {
  type: 'coordinate';
  data: {
    score: number;
    label: string;
    coordinate: Coordinate;
  };
}

export interface FishMessage {
  type: 'fish';
  data: Fish[];
}

export type Message = ScreenshotMessage | SoleilMessage | CoordinateMessage | FishMessage;
