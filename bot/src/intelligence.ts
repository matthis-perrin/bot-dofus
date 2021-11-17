import {handleError} from './error';
import {findBorderSquares} from './screenshot';
import {screenhotManager} from './screenshot_manager';
import {sendEvent} from './server';
import {Predictor} from './tensorflow';

export class Intelligence {
  public constructor(
    private readonly soleilModel: Predictor,
    private readonly mapModel: Predictor
  ) {
    screenhotManager.addListener(buffer => this.handleNewScreenshot(buffer));
  }

  public start(): void {
    screenhotManager.start();
  }

  public stop(): void {
    screenhotManager.stop();
  }

  public triggerManually(): void {
    this.handleNewScreenshot(screenhotManager.getLastScreenshot());
  }

  private handleNewScreenshot(buffer: Buffer): void {
    // SCREENSHOT
    sendEvent({
      type: 'screenshot',
      data: {
        image: buffer.toString('base64'),
        isRunning: screenhotManager.isRunning(),
      },
    });
    // SOLEIL
    (async () => {
      const borderSquares = await findBorderSquares(buffer);
      const predictions = await Promise.all(
        borderSquares.map(async borderSquare => {
          const prediction = await this.soleilModel(borderSquare.data);
          return {...prediction, ...borderSquare.coordinates};
        })
      );
      predictions.sort((p1, p2) => p1.score - p2.score);
      sendEvent({
        type: 'soleil',
        data: predictions,
      });
    })().catch(handleError);
    // COORDINATE
    (async () => {
      const prediction = await this.mapModel(buffer);
      sendEvent({
        type: 'coordinate',
        data: prediction,
      });
    })().catch(handleError);
  }
}
