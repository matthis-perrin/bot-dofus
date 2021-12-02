import {promises} from 'fs';
import {join} from 'path';

import {Coordinate} from '../../common/src/coordinates';
import {Fish} from '../../common/src/model';
import {hashCoordinate} from './fight';

const {readFile, writeFile} = promises;

const fishPath = join('models', 'fish.json');

class FishDb {
  private fishes: Record<string, Fish[]> = {};
  private readonly listeners: Set<() => void> = new Set();

  public async init(): Promise<void> {
    try {
      const content = await readFile(fishPath);
      this.fishes = JSON.parse(content.toString());
    } catch (err: unknown) {
      console.error(err);
      this.fishes = {};
    }
    await this.save();
  }

  public async save(): Promise<void> {
    await writeFile(fishPath, JSON.stringify(this.fishes, undefined, 2));
    this.emit();
  }

  public async set(mapCoordinate: Coordinate, fish: Fish): Promise<void> {
    const key = this.coordinateKey(mapCoordinate);
    let newFishes = this.fishes[key] ?? [];
    newFishes = newFishes.filter(
      f => f.coordinate.x !== fish.coordinate.x || f.coordinate.y !== fish.coordinate.y
    );
    newFishes.push(fish);
    this.fishes[key] = newFishes;
    await this.save();
  }

  public async updateFishPos(
    mapCoordinate: Coordinate,
    fishCoordinate: Coordinate,
    moveUp: boolean
  ): Promise<void> {
    const key = this.coordinateKey(mapCoordinate);
    const newFishes = this.fishes[key] ?? [];
    const fishIndex = newFishes.findIndex(
      f => f.coordinate.x === fishCoordinate.x && f.coordinate.y === fishCoordinate.y
    );
    if (fishIndex === -1) {
      throw new Error(`Unknown fish at position ${hashCoordinate(fishCoordinate)}`);
    }
    if (fishIndex > 0 && moveUp) {
      [newFishes[fishIndex - 1]!, newFishes[fishIndex]!] = [
        newFishes[fishIndex]!,
        newFishes[fishIndex - 1]!,
      ];
    } else {
      [newFishes[fishIndex]!, newFishes[fishIndex + 1]!] = [
        newFishes[fishIndex + 1]!,
        newFishes[fishIndex]!,
      ];
    }
    this.fishes[key] = newFishes;
    await this.save();
  }

  public async delete(mapCoordinate: Coordinate, fishCoordinate: Coordinate): Promise<void> {
    const key = this.coordinateKey(mapCoordinate);
    let newFishes = this.fishes[key] ?? [];
    newFishes = newFishes.filter(
      f => f.coordinate.x !== fishCoordinate.x || f.coordinate.y !== fishCoordinate.y
    );
    this.fishes[key] = newFishes;
    await this.save();
  }

  public get(mapCoordinate: Coordinate): Fish[] {
    return this.fishes[this.coordinateKey(mapCoordinate)] ?? [];
  }

  public addListener(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private coordinateKey(coordinate: Coordinate): string {
    const {x, y} = coordinate;
    return `${x}/${y}`;
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const fishDb = new FishDb();
