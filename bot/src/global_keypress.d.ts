declare module 'global-keypress' {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  class GK {
    public constructor();
    public start(): void;
    public on(evt: 'press', cb: (data: {data: string}) => void): void;
    public on(evt: 'error', cb: (err: Error) => void): void;
    public on(evt: 'close', cb: () => void): void;
  }

  export = GK;
}
