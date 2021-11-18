import {handleError} from './error';
import {takeGameScreenshot} from './screenshot';

type Listener = (res: Buffer) => void;

class ScreenshotManager {
  private lastScreenshot: Buffer | undefined;
  private readonly listeners: Set<Listener> = new Set();
  private loopTimeout: NodeJS.Timeout | undefined;
  private running = false;

  public constructor(private readonly periodMs: number) {}

  public start(): void {
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = undefined;
    }
    this.running = true;
    this.screenshotLoop();
    this.emit();
  }

  public stop(): void {
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = undefined;
    }
    this.running = false;
    this.emit();
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getLastScreenshot(): Buffer | undefined {
    return this.lastScreenshot;
  }

  public addListener(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public async waitForFirstScreenshot(): Promise<Buffer> {
    if (this.lastScreenshot) {
      return this.lastScreenshot;
    }
    return new Promise(resolve => {
      const removeListener = this.addListener(buffer => {
        resolve(buffer);
        removeListener();
      });
    });
  }

  private screenshotLoop(): void {
    if (!this.running) {
      return;
    }
    takeGameScreenshot(false)
      .then(res => {
        if (this.running) {
          this.lastScreenshot = res;
          this.emit();
        }
      })
      .catch(handleError)
      .finally(() => {
        if (this.running) {
          this.loopTimeout = setTimeout(() => this.screenshotLoop(), this.periodMs);
        }
      });
  }

  private emit(): void {
    if (!this.lastScreenshot) {
      return;
    }
    for (const listener of this.listeners) {
      listener(this.lastScreenshot);
    }
  }
}

export const screenhotManager = new ScreenshotManager(1000);
