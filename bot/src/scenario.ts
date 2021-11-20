import {mouseClick, moveMouseSmooth} from 'robotjs';

import {Coordinate, mapCoordinateToScreenCoordinate} from '../../common/src/coordinates';
import {Fish, SQUARE_SIZE} from '../../common/src/model';
import {fishDb} from './fish_db';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

const squareWidth = SQUARE_SIZE.width / 2;
const squareHeight = SQUARE_SIZE.height / 2;

export class FishMapScenario {
  private readonly fishes: Fish[];
  private isRunning = false;

  public constructor(coordinate: Coordinate) {
    this.fishes = fishDb.get(coordinate);
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    /* eslint-disable no-await-in-loop */
    console.log(this.fishes);
    for (const fish of this.fishes) {
      const fishTopLeft = mapCoordinateToScreenCoordinate(fish.coordinate);
      const fishTargetCenter = {
        x: fishTopLeft.x + squareWidth / 2,
        y: fishTopLeft.y + (3 * squareHeight) / 4,
      };
      const fishRandomAngle = Math.random() * 2 * Math.PI;
      const fishRandomRadius = (Math.random() * squareHeight) / 4;
      const fishTargetClick = {
        x: fishTargetCenter.x + fishRandomRadius * Math.cos(fishRandomAngle),
        y: fishTargetCenter.y + fishRandomRadius * Math.sin(fishRandomAngle),
      };

      const popupOffset = {x: squareWidth / 4, y: 50};
      const popupRandomAngle = Math.random() * 2 * Math.PI;
      const popupRandomRadius = (Math.random() * squareHeight) / 4;
      const popupTargetClick = {
        x: fishTargetClick.x + popupOffset.x + popupRandomRadius * Math.cos(popupRandomAngle),
        y: fishTargetClick.y + popupOffset.y + popupRandomRadius * Math.sin(popupRandomAngle),
      };

      moveMouseSmooth(fishTargetClick.x, fishTargetClick.y);
      await sleep(Math.random() * 500 + 0);
      if (!this.isRunning) {
        return;
      }
      mouseClick('right');
      await sleep(Math.random() * 500 + 0);
      if (!this.isRunning) {
        return;
      }
      moveMouseSmooth(popupTargetClick.x, popupTargetClick.y);
      await sleep(Math.random() * 500 + 0);
      if (!this.isRunning) {
        return;
      }
      mouseClick('left');
      await sleep(Math.random() * 500 + 5 * 1000);
      if (!this.isRunning) {
        return;
      }
    }
    /* eslint-enable no-await-in-loop */
  }

  public stop(): void {
    this.isRunning = false;
  }
}

// import {Coordinate} from '../../common/src/coordinates';
// import {handleError} from './error';
// import {fishDb} from './fish_db';

// export abstract class Scenario {
//   public abstract run(): Promise<void>;
// }

// export class WaitScenario extends Scenario {
//   public constructor(private readonly durationMs: number) {
//     super();
//   }

//   public async run(): Iterator<Promise<Scenario>> | Promise<void> {
//     return new Promise(resolve => {
//       setTimeout(resolve, this.durationMs);
//     });
//   }
// }

// export class StartFishing extends Scenario {
//   public constructor(private readonly fishCoordinate: Coordinate) {
//     super();
//   }

//   public async run(): Promise<void> {}
// }

// export class FishAllMap {
//   private readonly fishes: Fish[];
//   private readonly currentIndex = 0;

//   public constructor(private readonly coordinate: Coordinate) {
//     this.fishes = fishDb.get(this.coordinate);
//   }

//   public async run(): Promise<void> {}
// }

// export class ScenarioRunner {
//   private callback: (() => void) | undefined;
//   private readonly currentScenario: Scenario;

//   public constructor(rootScenario: Scenario) {
//     this.currentScenario = rootScenario;
//   }

//   public start(): void {
//     this.currentScenario
//       .run()
//       .then()
//       .catch(err => {
//         handleError(err);
//         this.stop();
//       });
//   }

//   public stop(): void {}

//   public pause(): void {}

//   public onFinish(cb: () => void): void {
//     this.callback = cb;
//   }
// }
