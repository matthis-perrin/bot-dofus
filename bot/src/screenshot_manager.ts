import {handleError} from './error';
import {takeGameScreenshot} from './screenshot';

type Listener = (res: Buffer) => void;

class ScreenshotManager {
  private lastScreenshot: Buffer = Buffer.from([]);
  private readonly listeners: Set<Listener> = new Set();

  public constructor(private readonly periodMs: number) {}

  public start(): void {
    this.screenshotLoop();
  }

  public addListener(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private screenshotLoop(): void {
    takeGameScreenshot(false)
      .then(res => {
        this.lastScreenshot = res;
        this.emit();
      })
      .catch(handleError)
      .finally(() => setTimeout(() => this.screenshotLoop(), this.periodMs));
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.lastScreenshot);
    }
  }
}

export const screenhotManager = new ScreenshotManager(1000);
