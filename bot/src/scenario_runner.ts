import {ScenarioStatus, ScenarioStatusWithTime, ScenarioType} from '../../common/src/model';
import {isDisconnected, isFull, isInFight, isInFightPreparation} from './detectors';
import {Intelligence} from './intelligence';
import {logError, setRecentLogs} from './logger';
import {restart, stopBotEntirely} from './process';
import {connectionScenario} from './scenario/connection_scenario';
import {emptyBankAmaknaScenario} from './scenario/empty_bank_amakna_scenario';
import {emptyBankHouseScenario} from './scenario/empty_bank_house_scenario';
import {fightScenario} from './scenario/fight_scenario';
import {fishingScenario} from './scenario/fishing_scenario';
import {initialScenario} from './scenario/initial_scenario';
import {postFightScenario} from './scenario/post_fight_scenario';
import {sendEvent} from './server';

const MAX_TIME_IN_FIGHT_MS = 5 * 60 * 1000; // 5 minutes

export type CanContinue = () => Promise<void>;
export type UpdateStatus = (status: ScenarioStatus) => void;

export interface ScenarioContext {
  ia: Intelligence;
  canContinue: CanContinue;
  updateStatus: UpdateStatus;
}

export type Scenario = (ctx: ScenarioContext) => Promise<void>;

class PauseScenarioError extends Error {
  public constructor() {
    super();
    this.name = 'PauseScenarioError';
  }
}
export class StartScenarioError extends Error {
  public constructor(public readonly type: ScenarioType, public readonly reason: string) {
    super();
    this.name = 'StartScenarioError';
  }
}

export class ScenarioRunner {
  private isRunning = false;
  private currentScenario: ScenarioType;
  private readonly statusHistory: ScenarioStatusWithTime[] = [];
  private readonly listeners = new Set<() => void>();

  public constructor(private readonly ia: Intelligence) {
    this.currentScenario = ScenarioType.InitialScenario;
  }

  public start(): void {
    this.updateStatus(`START SCENARIO ${this.currentScenario}`);
    // INITIAL
    if (this.currentScenario === ScenarioType.InitialScenario) {
      this.runScenario(initialScenario, async () => {});
    }
    // CONNECTION
    else if (this.currentScenario === ScenarioType.Connection) {
      this.runScenario(connectionScenario, async () => {
        if (!this.isRunning) {
          throw new PauseScenarioError();
        }
        await Promise.resolve();
      });
    }
    // FIGHT
    else if (this.currentScenario === ScenarioType.Fight) {
      const startTime = Date.now();
      this.runScenario(fightScenario, async () => {
        if (Date.now() - startTime > MAX_TIME_IN_FIGHT_MS) {
          logError('runner', 'too much time in fight, restart').catch(console.error);
          throw new StartScenarioError(ScenarioType.Connection, 'too much time in fight');
        }
        if (!this.isRunning) {
          throw new PauseScenarioError();
        }
        if (isDisconnected()) {
          throw new StartScenarioError(ScenarioType.Connection, 'isDisconnected');
        }
        if (!(isInFight() || isInFightPreparation())) {
          throw new StartScenarioError(ScenarioType.PostFight, 'fight ended');
        }
        await Promise.resolve();
      });
    }
    // FISHING
    else if (this.currentScenario === ScenarioType.Fishing) {
      this.runScenario(fishingScenario, async () => {
        if (!this.isRunning) {
          throw new PauseScenarioError();
        }
        if (isDisconnected()) {
          logError('runner', 'disconnected during fishing, restart').catch(console.error);
          throw new StartScenarioError(ScenarioType.Connection, 'isDisconnected');
        }
        if (isInFightPreparation()) {
          throw new StartScenarioError(ScenarioType.Fight, 'isInFightPreparation');
        }
        if (isInFight()) {
          throw new StartScenarioError(ScenarioType.Fight, 'isInFight');
        }
        if (isFull()) {
          throw new StartScenarioError(ScenarioType.EmptyBankAmakna, 'isFull');
        }
        await Promise.resolve();
      });
    }
    // POST FIGHT
    else if (this.currentScenario === ScenarioType.PostFight) {
      this.runScenario(postFightScenario, async () => {
        if (!this.isRunning) {
          throw new PauseScenarioError();
        }
        if (isDisconnected()) {
          logError('runner', 'disconnected after fight, restart').catch(console.error);
          throw new StartScenarioError(ScenarioType.Connection, 'isDisconnected');
        }
        if (isInFightPreparation()) {
          throw new StartScenarioError(ScenarioType.Fight, 'isInFightPreparation');
        }
        if (isInFight()) {
          throw new StartScenarioError(ScenarioType.Fight, 'isInFight');
        }
        await Promise.resolve();
      });
    }
    // EMPTY BANK HOUSE
    else if (this.currentScenario === ScenarioType.EmptyBankHouse) {
      this.runScenario(emptyBankHouseScenario, async () => {
        if (!this.isRunning) {
          throw new PauseScenarioError();
        }
        if (isDisconnected()) {
          logError('runner', 'disconnected while emptying to bank house, restart').catch(
            console.error
          );
          throw new StartScenarioError(ScenarioType.Connection, 'isDisconnected');
        }
        if (isInFightPreparation()) {
          throw new StartScenarioError(ScenarioType.Fight, 'isInFightPreparation');
        }
        if (isInFight()) {
          throw new StartScenarioError(ScenarioType.Fight, 'isInFight');
        }
        await Promise.resolve();
      });
    }
    // EMPTY BANK AMAKNA
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    else if (this.currentScenario === ScenarioType.EmptyBankAmakna) {
      this.runScenario(emptyBankAmaknaScenario, async () => {
        if (!this.isRunning) {
          throw new PauseScenarioError();
        }
        if (isDisconnected()) {
          logError('runner', 'disconnected while emptying to bank amakna, restart').catch(
            console.error
          );
          throw new StartScenarioError(ScenarioType.Connection, 'isDisconnected');
        }
        if (isInFightPreparation()) {
          throw new StartScenarioError(ScenarioType.Fight, 'isInFightPreparation');
        }
        if (isInFight()) {
          throw new StartScenarioError(ScenarioType.Fight, 'isInFight');
        }
        await Promise.resolve();
      });
    } else {
      logError('runner', `Invalid ScenarioType ${this.currentScenario}`).finally(stopBotEntirely);
    }
  }

  public stop(): void {
    this.isRunning = false;
  }

  public getCurrentScenario(): ScenarioType {
    return this.currentScenario;
  }

  private runScenario(scenario: Scenario, canContinue: CanContinue): void {
    this.isRunning = true;
    scenario({
      ia: this.ia,
      updateStatus: newStatus => this.updateStatus(newStatus),
      canContinue,
    })
      .then(() => {
        this.currentScenario = ScenarioType.Fishing;
        this.start();
      })
      .catch(err => {
        if (err instanceof PauseScenarioError) {
          this.updateStatus(`PAUSE SCENARIO ${this.currentScenario}`);
        } else if (err instanceof StartScenarioError) {
          this.updateStatus(`INTERRUPTION SCENARIO ${this.currentScenario} (${err.reason})`);
          this.currentScenario = err.type;
          this.start();
        } else {
          logError('runner', `Error with scenario ${this.currentScenario}:\n${String(err)}`).catch(
            () => {}
          );
          this.updateStatus(
            `ERREUR durant l'execution du scenario ${this.currentScenario}:\n${String(err)}`
          );
          this.stop();
          restart().catch(() => {});
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
        currentScenario: this.currentScenario,
        statusHistory: this.getRecentHistory(),
      },
    });
  }

  private getRecentHistory(): ScenarioStatusWithTime[] {
    return this.statusHistory.slice(0, 100);
  }

  private updateStatus(newStatus: ScenarioStatus): void {
    this.statusHistory.unshift({
      value: newStatus,
      time: Date.now(),
      id: Math.random().toString(36).slice(2),
    });
    setRecentLogs(this.getRecentHistory());
    this.emit();
  }

  private emit(): void {
    sendEvent({
      type: 'scenario-new-status',
      data: {
        isRunning: this.isRunning,
        currentScenario: this.currentScenario,
        newStatus: this.statusHistory[0]!,
      },
    });
  }
}
