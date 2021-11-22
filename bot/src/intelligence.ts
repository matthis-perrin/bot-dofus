import {
  CoordinateMessage,
  FishMessage,
  ScreenshotMessage,
  SoleilMessage,
} from '../../common/src/model';
import {handleError} from './error';
import {fishDb} from './fish_db';
import {screenshot} from './screenshot';
import {screenhotManager} from './screenshot_manager';
import {sendEvent} from './server';
import {Predictor} from './tensorflow';

interface Data {
  screenshot: ScreenshotMessage['data'];
  soleil: SoleilMessage['data'];
  coordinate: CoordinateMessage['data'];
  fish: FishMessage['data'];
}

export class Intelligence {
  private lastData: Data | undefined;

  public constructor(
    private readonly soleilModel: Predictor,
    private readonly mapModel: Predictor,
    private readonly fishPopupModel: Predictor
  ) {
    screenhotManager.addListener(buffer => this.handleNewScreenshot(buffer));
  }

  public start(): void {
    screenhotManager.start();
  }

  public stop(): void {
    screenhotManager.stop();
  }

  public async getData(): Promise<Data> {
    return this.lastData ?? this.refresh();
  }

  public async refresh(): Promise<Data> {
    const {} = screenshot();
  }

  private handleNewScreenshot(buffer: Buffer): void {
    (async () => {
      // Serialize screenshot
      const screenshot = {
        image: buffer.toString('base64'),
        isRunning: screenhotManager.isRunning(),
      };

      // Run soleil model
      // const borderSquares = await findBorderSquares(buffer);
      // const soleil = await Promise.all(
      //   borderSquares.map(async borderSquare => {
      //     const prediction = await this.soleilModel(borderSquare.data);
      //     return {...prediction, ...borderSquare.coordinates};
      //   })
      // );
      // soleil.sort((p1, p2) => p1.score - p2.score);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const soleil: any[] = [];

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
