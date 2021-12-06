import {ScenarioStatus, ScenarioStatusWithTime, ScenarioType} from '../../common/src/model';
import {isDisconnected, isFull, isInFight} from './detectors';
import {fightScenario} from './fight/fight_scenario';
import {Intelligence} from './intelligence';
import {restart, stopBotEntirely} from './process';
import {mapLoopScenario} from './scenario';
import {connectionScenario} from './scenario/connection_scenario';
import {emptyBankScenario} from './scenario/empty_bank_scenario';
import {postFightScenario} from './scenario/post_fight_scenario';
import {sendEvent} from './server';

const MAX_TIME_IN_FIGHT_MS = 10 * 60 * 1000; // 5 minutes

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
  public constructor(public readonly type: ScenarioType) {
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
    this.currentScenario = ScenarioType.Fishing;
  }

  public start(): void {
    this.updateStatus(`START SCENARIO ${this.currentScenario}`);
    // CONNECTION
    if (this.currentScenario === ScenarioType.Connection) {
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
          throw new StartScenarioError(ScenarioType.Connection);
        }
        if (!this.isRunning) {
          throw new PauseScenarioError();
        }
        if (isDisconnected()) {
          throw new StartScenarioError(ScenarioType.Connection);
        }
        const fightStatus = isInFight();
        if (fightStatus === 'not-in-fight') {
          throw new StartScenarioError(ScenarioType.PostFight);
        }
        await Promise.resolve();
      });
    }
    // FISHING
    else if (this.currentScenario === ScenarioType.Fishing) {
      this.runScenario(mapLoopScenario, async () => {
        if (!this.isRunning) {
          throw new PauseScenarioError();
        }
        if (isDisconnected()) {
          throw new StartScenarioError(ScenarioType.Connection);
        }
        const fightStatus = isInFight();
        if (fightStatus === 'in-fight') {
          throw new StartScenarioError(ScenarioType.Fight);
        }
        if (isFull()) {
          throw new StartScenarioError(ScenarioType.EmptyBank);
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
          throw new StartScenarioError(ScenarioType.Connection);
        }
        const fightStatus = isInFight();
        if (fightStatus === 'in-fight') {
          throw new StartScenarioError(ScenarioType.Fight);
        } else if (fightStatus === 'unknown') {
          throw new StartScenarioError(ScenarioType.Connection);
        }
        await Promise.resolve();
      });
    }
    // EMPTY BANK
    else if (this.currentScenario === ScenarioType.EmptyBank) {
      this.runScenario(emptyBankScenario, async () => {
        if (!this.isRunning) {
          throw new PauseScenarioError();
        }
        if (isDisconnected()) {
          throw new StartScenarioError(ScenarioType.Connection);
        }
        const fightStatus = isInFight();
        if (fightStatus === 'in-fight') {
          throw new StartScenarioError(ScenarioType.Fight);
        }
        await Promise.resolve();
      });
    } else {
      console.error(`Invalid ScenarioType ${this.currentScenario}`);
      stopBotEntirely();
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
          this.updateStatus(`INTERRUPTION SCENARIO ${this.currentScenario}`);
          this.currentScenario = err.type;
          this.start();
        } else {
          console.error(err);
          this.updateStatus(
            `ERREUR durant l'execution du scenario ${this.currentScenario}:\n${String(err)}`
          );
          this.stop();
          restart();
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
    console.log(newStatus);
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
