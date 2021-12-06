import {COORDINATE_MIN_SCORE} from '../../../common/src/model';
import {click, moveToSafeZone, sleep, waitForMapChange} from '../actions';
import {logError} from '../logger';
import {restart} from '../process';
import {Scenario} from '../scenario_runner';

export const goOutOfHouseScenario: Scenario = async ctx => {
  const {canContinue, ia, updateStatus} = ctx;

  const lastData = await ia.refresh();
  if (lastData.coordinate.score < COORDINATE_MIN_SCORE) {
    await logError(
      'go out of house',
      `unknown map ${lastData.coordinate.label} ${lastData.coordinate.score}`
    );
    updateStatus('Infos écran non disponible. En attente...');
    await restart();
  }

  const {coordinate} = lastData.coordinate;
  if (coordinate.x === -1000 && coordinate.y === -1000) {
    await click(canContinue, {x: 364, y: 514, radius: 10});
    if (await waitForMapChange(ctx, {x: -26, y: -56})) {
      return goOutOfHouseScenario(ctx);
    }
    await logError('go out of house', `map change to outside of the house failed`);
    updateStatus('Changement de map non réussi. Restart dans 5 sec');
    await sleep(canContinue, 5000);
    return goOutOfHouseScenario(ctx);
  } else if (coordinate.x === -1001 && coordinate.y === -1001) {
    await click(canContinue, {x: 607, y: 267, radius: 10});
    await moveToSafeZone(canContinue);
    if (await waitForMapChange(ctx, {x: -1000, y: -1000})) {
      return goOutOfHouseScenario(ctx);
    }
    await logError('go out of house', `map change to -1000/-1000 failed`);
    updateStatus('Changement de map non réussi. Restart dans 5 sec');
    await sleep(canContinue, 5000);
    return goOutOfHouseScenario(ctx);
  } else if (coordinate.x === -1002 && coordinate.y === -1002) {
    await click(canContinue, {x: 242, y: 412, radius: 10});
    await moveToSafeZone(canContinue);
    if (await waitForMapChange(ctx, {x: -1001, y: -1001})) {
      return goOutOfHouseScenario(ctx);
    }
    await logError('go out of house', `map change to -1001/-1001 failed`);
    updateStatus('Changement de map non réussi. Restart dans 5 sec');
    await sleep(canContinue, 5000);
    return goOutOfHouseScenario(ctx);
  }
};
