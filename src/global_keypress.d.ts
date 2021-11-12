declare module 'global-keypress' {
    class GK {
        constructor();
        start(): void;
        on(evt: 'press', cb: (data: {data: string}) => void);
        on(evt: 'error', cb: (err: Error) => void);
        on(evt: 'close', cb: () => void);
    }

    export = GK;
}