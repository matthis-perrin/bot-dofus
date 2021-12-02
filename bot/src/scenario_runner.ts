import {keyTap} from 'robotjs';

import {MapScan, ScenarioStatus, ScenarioStatusWithTime} from '../../common/src/model';
import {deleteBagsScenario} from './delete_scenario';
import {isInFight} from './fight_detector';
import {Intelligence} from './intelligence';
import {scanMap} from './screenshot';
import {sendEvent} from './server';

export type CanContinue = () => Promise<void>;
export type UpdateStatus = (status: ScenarioStatus) => void;

export interface ScenarioContext {
  ia: Intelligence;
  canContinue: CanContinue;
  updateStatus: UpdateStatus;
}

export type Scenario = (ctx: ScenarioContext) => Promise<void>;

class StopScenarioError extends Error {
  public constructor() {
    super();
    this.name = 'StopScenarioError';
  }
}
class FightStartedError extends Error {
  public constructor() {
    super();
    this.name = 'FightStartedError';
  }
}
class FightEndedError extends Error {
  public constructor() {
    super();
    this.name = 'FightEndedError';
  }
}

export class ScenarioRunner {
  private isRunning = false;
  private isInFight = false;
  private mapScan: MapScan | undefined;
  private mapScanInterval: NodeJS.Timeout | undefined;
  private readonly statusHistory: ScenarioStatusWithTime[] = [];
  private readonly listeners = new Set<() => void>();

  public constructor(
    private readonly ia: Intelligence,
    private readonly scenario: Scenario,
    private readonly fightScenario: Scenario
  ) {}

  public stop(): void {
    this.isRunning = false;
  }

  public start(): void {
    this.isRunning = true;
    if (this.isInFight) {
      this.startFightScenario();
    } else {
      this.startScenario();
    }
  }

  private startScenario(): void {
    this.updateStatus('START SCENARIO PÊCHE');
    this.scenario({
      ia: this.ia,
      canContinue: async () => {
        if (!this.isRunning) {
          throw new StopScenarioError();
        }
        if (isInFight()) {
          throw new FightStartedError();
        }
        return Promise.resolve();
      },
      updateStatus: newStatus => this.updateStatus(newStatus),
    })
      .then()
      .catch(err => {
        if (err instanceof StopScenarioError) {
          this.updateStatus('STOP SCENARIO PÊCHE');
        } else if (err instanceof FightStartedError) {
          this.isInFight = true;
          this.start();
        } else {
          console.error(err);
          this.updateStatus(`ERREUR durant l'execution du scenario pêche:\n${String(err)}`);
          this.stop();
        }
      });
  }

  private startFightScenario(): void {
    this.updateStatus('START SCENARIO COMBAT');
    this.mapScan = scanMap();
    this.emit();
    if (this.mapScanInterval === undefined) {
      this.mapScanInterval = setInterval(() => {
        this.mapScan = scanMap();
        this.emit();
      }, 1000);
    }
    this.fightScenario({
      ia: this.ia,
      canContinue: async () => {
        if (!this.isRunning) {
          throw new StopScenarioError();
        }
        if (!isInFight()) {
          throw new FightEndedError();
        }
        return Promise.resolve();
      },
      updateStatus: newStatus => this.updateStatus(newStatus),
    })
      .then()
      .catch(err => {
        if (err instanceof StopScenarioError) {
          this.updateStatus('STOP SCENARIO COMBAT');
        } else if (err instanceof FightEndedError) {
          this.isInFight = false;
          setTimeout(() => {
            keyTap('escape');
            deleteBagsScenario({
              ia: this.ia,
              canContinue: async () => {
                if (isInFight()) {
                  throw new FightStartedError();
                }
                return Promise.resolve();
              },
              updateStatus: newStatus => this.updateStatus(newStatus),
            })
              .then(() => {
                this.start();
              })
              .catch(err => {
                if (err instanceof FightStartedError) {
                  this.isInFight = true;
                  this.start();
                } else {
                  console.error(err);
                  this.updateStatus(
                    `ERREUR durant l'execution du scenario vidage:\n${String(err)}`
                  );
                  this.stop();
                }
              });
          }, 1000);
        } else {
          console.error(err);
          this.updateStatus(`ERREUR durant l'execution du scenario combat:\n${String(err)}`);
          this.stop();
        }
        if (this.mapScanInterval) {
          clearInterval(this.mapScanInterval);
          this.mapScanInterval = undefined;
          this.mapScan = undefined;
          this.emit();
        }
      });
  }

  public addListener(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public sendStatus(): void {
    sendEvent({
      type: 'scenario',
      data: {
        isRunning: this.isRunning,
        fightScenario: {
          isInFight: this.isInFight,
          mapScan: this.mapScan,
        },
        statusHistory: this.statusHistory.slice(0, 100),
      },
    });
  }

  private updateStatus(newStatus: ScenarioStatus): void {
    this.statusHistory.unshift({
      value: newStatus,
      time: Date.now(),
      id: Math.random().toString(36).slice(2),
    });
    this.emit();
  }

  private emit(): void {
    sendEvent({
      type: 'scenario-new-status',
      data: {
        isRunning: this.isRunning,
        fightScenario: {
          isInFight: this.isInFight,
          mapScan: this.mapScan,
        },
        newStatus: this.statusHistory[0]!,
      },
    });
  }
}
