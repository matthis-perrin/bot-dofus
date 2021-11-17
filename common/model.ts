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

export interface ScreenshotMessage {
  type: "screenshot";
  data: {
    image: string;
    isRunning: boolean;
  };
}

export interface SoleilMessage {
  type: "soleil";
  data: {
    x: number;
    y: number;
    score: number;
    label: string;
  }[];
}

export interface CoordinateMessage {
  type: "coordinate";
  data: {
    score: number;
    label: string;
  };
}

export type Message = ScreenshotMessage | SoleilMessage | CoordinateMessage;
