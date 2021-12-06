import {COORDINATE_MIN_SCORE} from '../../../common/src/model';
import {click, moveToSafeZone, sleep, waitForMapChange} from '../actions';
import {Scenario} from '../scenario_runner';

export const goUpOfHouseScenario: Scenario = async ctx => {
  const {canContinue, ia, updateStatus} = ctx;

  const lastData = await ia.refresh();
  if (lastData.coordinate.score < COORDINATE_MIN_SCORE) {
    updateStatus('Infos écran non disponible. En attente...');
    await sleep(canContinue, 500);
    return goUpOfHouseScenario(ctx);
  }

  const {coordinate} = lastData.coordinate;
  if (coordinate.x === -1000 && coordinate.y === -1000) {
    await click(canContinue, {x: 648, y: 288, radius: 10});
    await moveToSafeZone(canContinue);
    if (await waitForMapChange(ctx, {x: -1001, y: -1001})) {
      return goUpOfHouseScenario(ctx);
    }
    updateStatus('Changement de map non réussi. Restart dans 5 sec');
    await sleep(canContinue, 5000);
    return goUpOfHouseScenario(ctx);
  } else if (coordinate.x === -1001 && coordinate.y === -1001) {
    await click(canContinue, {x: 366, y: 474, radius: 10});
    await moveToSafeZone(canContinue);
    if (await waitForMapChange(ctx, {x: -1002, y: -1002})) {
      return goUpOfHouseScenario(ctx);
    }
    updateStatus('Changement de map non réussi. Restart dans 5 sec');
    await sleep(canContinue, 5000);
    return goUpOfHouseScenario(ctx);
  } else if (coordinate.x === -1002 && coordinate.y === -1002) {
    // Nothing to do
  } else {
    // Take a popo
    await click(canContinue, {x: 980, y: 809, radius: 5, double: true});
    await waitForMapChange(ctx, {x: -1000, y: -1000});
    return goUpOfHouseScenario(ctx);
  }
};
