import {Coordinate} from '../../../common/src/coordinates';
import {COORDINATE_MIN_SCORE, ScenarioType} from '../../../common/src/model';
import {click, moveToSafeZone, waitForMapChange} from '../actions';
import {hashCoordinate} from '../fight';
import {logError} from '../logger';
import {restart} from '../process';
import {Scenario, StartScenarioError} from '../scenario_runner';
import {changeMap} from './change_map';

const insideBankMap = {x: -2000, y: -2000};

const mapFromZaapToBankAmakna: Coordinate[] = [
  {x: 7, y: -4},
  {x: 6, y: -4},
  {x: 6, y: -3},
  {x: 5, y: -3},
  {x: 5, y: -2},
  {x: 4, y: -2},
  {x: 3, y: -2},
  {x: 2, y: -2},
];

export const goToBankAmaknaScenario: Scenario = async ctx => {
  const {ia, canContinue, updateStatus} = ctx;
  await canContinue();

  /* eslint-disable no-await-in-loop */
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await moveToSafeZone(canContinue);

    // Get current data
    const lastData = await ia.refresh();
    if (lastData.coordinate.score < COORDINATE_MIN_SCORE) {
      await logError(
        'map loop',
        `unknown map ${lastData.coordinate.label} ${lastData.coordinate.score}`
      );
      updateStatus('Infos écran non disponible. En attente...');
      await restart();
    }
    const coordinate = lastData.coordinate.coordinate;
    const coordinateStr = hashCoordinate(coordinate);

    // Map identification
    const indexInMapLoop = mapFromZaapToBankAmakna.findIndex(
      m => m.x === coordinate.x && m.y === coordinate.y
    );
    if (indexInMapLoop === -1) {
      updateStatus(`Map courante (${coordinateStr}) n'est pas dans le chemin. Prise de popo.`);
      await click(canContinue, {x: 1024, y: 806, radius: 5, double: true});
      // Wait to be on the madrestam map
      await waitForMapChange(ctx, {x: 7, y: -4});
      continue;
    }
    if (indexInMapLoop === mapFromZaapToBankAmakna.length - 1) {
      updateStatus(`Arrivé sur la map de la bank. On rentre à l'intérieur`);
      const maxTry = 3;
      for (let index = 0; index < maxTry; index++) {
        await click(canContinue, {x: 487, y: 331, radius: 10});
        if (await waitForMapChange(ctx, insideBankMap)) {
          return;
        }
        updateStatus(`Trying again`);
      }
      await logError('enter bank amakna', `failed to go inside bank after many tries`);
      updateStatus(`Personnage n'est toujours pas rentré dans la banque, déco/reco.`);
      throw new StartScenarioError(ScenarioType.Connection, 'going inside bank is too long');
    }

    // Change map
    const nextMap = mapFromZaapToBankAmakna[(indexInMapLoop + 1) % mapFromZaapToBankAmakna.length]!;
    await changeMap(ctx, lastData, coordinate, nextMap, 3);
    updateStatus(`Déplacement terminé`);
  }
  /* eslint-enable no-await-in-loop */
};
