import {promises} from 'fs';
import {join} from 'path';

import {Coordinate} from '../../common/src/coordinates';
import {Soleil} from '../../common/src/model';

const {readFile, writeFile} = promises;

const soleilPath = join('models', 'soleil.json');

class SoleilDb {
  private soleils: Record<string, Soleil[]> = {};
  private readonly listeners: Set<() => void> = new Set();

  public async init(): Promise<void> {
    try {
      const content = await readFile(soleilPath);
      this.soleils = JSON.parse(content.toString());
    } catch (err: unknown) {
      console.error(err);
      this.soleils = {};
    }
    await this.save();
  }

  public async save(): Promise<void> {
    await writeFile(soleilPath, JSON.stringify(this.soleils, undefined, 2));
    this.emit();
  }

  public async set(mapCoordinate: Coordinate, soleil: Soleil): Promise<void> {
    const key = this.coordinateKey(mapCoordinate);
    const newSoleils = this.soleils[key] ?? [];
    const soleilIndex = newSoleils.findIndex(
      f => f.coordinate.x === soleil.coordinate.x && f.coordinate.y === soleil.coordinate.y
    );
    if (soleilIndex === -1) {
      newSoleils.push(soleil);
    } else {
      newSoleils.splice(soleilIndex, 1, soleil);
    }
    this.soleils[key] = newSoleils;
    await this.save();
  }

  public async delete(mapCoordinate: Coordinate, soleilCoordinate: Coordinate): Promise<void> {
    const key = this.coordinateKey(mapCoordinate);
    let newSoleils = this.soleils[key] ?? [];
    newSoleils = newSoleils.filter(
      f => f.coordinate.x !== soleilCoordinate.x || f.coordinate.y !== soleilCoordinate.y
    );
    this.soleils[key] = newSoleils;
    await this.save();
  }

  public get(mapCoordinate: Coordinate): Soleil[] {
    return this.soleils[this.coordinateKey(mapCoordinate)] ?? [];
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

export const soleilDb = new SoleilDb();
