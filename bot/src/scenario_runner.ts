import {ScenarioStatus, ScenarioStatusWithTime} from '../../common/src/model';
import {isInFight} from './fight_detector';
import {Intelligence} from './intelligence';
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

export class ScenarioRunner {
  private isRunning = false;
  private readonly statusHistory: ScenarioStatusWithTime[] = [];
  private readonly listeners = new Set<() => void>();

  public constructor(private readonly ia: Intelligence, private readonly scenario: Scenario) {}

  public stop(): void {
    this.isRunning = false;
  }

  public start(): void {
    this.isRunning = true;
    this.updateStatus('START');
    this.scenario({
      ia: this.ia,
      canContinue: async () => {
        if (!this.isRunning) {
          throw new StopScenarioError();
        }
        if (isInFight()) {
          this.updateStatus('Combat détecté');
          throw new StopScenarioError();
        }
        return Promise.resolve();
      },
      updateStatus: newStatus => this.updateStatus(newStatus),
    })
      .then()
      .catch(err => {
        if (err instanceof StopScenarioError) {
          this.updateStatus('STOP');
        } else {
          this.updateStatus(`ERREUR durant l'execution du scenario:\n${String(err)}`);
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
        statusHistory: this.statusHistory.slice(0, 100),
      },
    });
  }

  private updateStatus(newStatus: ScenarioStatus): void {
    this.statusHistory.unshift({value: newStatus, time: Date.now()});
    this.emit();
  }

  private emit(): void {
    sendEvent({
      type: 'scenario-new-status',
      data: {isRunning: this.isRunning, newStatus: this.statusHistory[0]!},
    });
  }
}
