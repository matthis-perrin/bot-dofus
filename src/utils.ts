
import {exec} from 'child_process'

export async function execAsync(cmd: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        exec(cmd, {}, (err => {
            if (err) {
                return reject(err);
            }
            resolve();
        }))
    })
}

export function setIntervalAsync(fn: () => Promise<void>, ms: number): void {
    setInterval(() => {
        fn().catch(console.error);
    }, ms)
}