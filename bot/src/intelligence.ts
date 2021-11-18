import {Coordinate} from '../../common/src/coordinates';
import {
  CoordinateMessage,
  FishMessage,
  ScreenshotMessage,
  SoleilMessage,
} from '../../common/src/model';
import {handleError} from './error';
import {fishDb} from './fish_db';
import {findBorderSquares} from './screenshot';
import {screenhotManager} from './screenshot_manager';
import {sendEvent} from './server';
import {Predictor} from './tensorflow';

export class Intelligence {
  private lastData:
    | {
        screenshot: ScreenshotMessage['data'];
        soleil: SoleilMessage['data'];
        coordinate: CoordinateMessage['data'];
        fish: FishMessage['data'];
      }
    | undefined;

  public constructor(
    private readonly soleilModel: Predictor,
    private readonly mapModel: Predictor
  ) {
    screenhotManager.addListener(buffer => this.handleNewScreenshot(buffer));
    fishDb.addListener(() => {
      if (!this.lastData) {
        return;
      }
      const coordinate: Coordinate = this.lastData.coordinate.coordinate;
      sendEvent({type: 'fish', data: fishDb.get(coordinate)});
    });
  }

  public start(): void {
    screenhotManager.start();
  }

  public stop(): void {
    screenhotManager.stop();
  }

  public triggerManually(): void {
    screenhotManager
      .waitForFirstScreenshot()
      .then(buffer => {
        this.handleNewScreenshot(buffer);
      })
      .catch(handleError);
  }

  private handleNewScreenshot(buffer: Buffer): void {
    (async () => {
      // Serialize screenshot
      const screenshot = {
        image: buffer.toString('base64'),
        isRunning: screenhotManager.isRunning(),
      };

      // Run soleil model
      const borderSquares = await findBorderSquares(buffer);
      const soleil = await Promise.all(
        borderSquares.map(async borderSquare => {
          const prediction = await this.soleilModel(borderSquare.data);
          return {...prediction, ...borderSquare.coordinates};
        })
      );
      soleil.sort((p1, p2) => p1.score - p2.score);

      // Run coordinate model
      const prediction = await this.mapModel(buffer);
      const {label} = prediction;
      const [x = '', y = ''] = label.split(',');
      const coordinate = {...prediction, coordinate: {x: parseFloat(x), y: parseFloat(y)}};

      // Lookup fish
      const fish = fishDb.get(coordinate.coordinate);

      // Send events
      this.lastData = {screenshot, soleil, coordinate, fish};
      sendEvent({type: 'screenshot', data: screenshot});
      sendEvent({type: 'soleil', data: soleil});
      sendEvent({type: 'coordinate', data: coordinate});
      sendEvent({type: 'fish', data: fish});
    })().catch(handleError);
  }
}
