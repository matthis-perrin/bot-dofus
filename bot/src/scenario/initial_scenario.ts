import {ScenarioType} from '../../../common/src/model';
import {isDisconnected, isFull, isInFight, isInFightPreparation} from '../detectors';
import {logEvent} from '../logger';
import {Scenario, StartScenarioError} from '../scenario_runner';

export const initialScenario: Scenario = async ctx => {
  const {updateStatus} = ctx;
  await logEvent('start');
  updateStatus('start');
  if (isDisconnected()) {
    throw new StartScenarioError(ScenarioType.Connection, 'bot started disconnected');
  }
  if (isInFight() || isInFightPreparation()) {
    throw new StartScenarioError(ScenarioType.Fight, 'bot started in fight');
  }
  if (isFull()) {
    throw new StartScenarioError(ScenarioType.EmptyBank, 'bot started full');
  }
  throw new StartScenarioError(ScenarioType.Fishing, 'initial fishing');
};
