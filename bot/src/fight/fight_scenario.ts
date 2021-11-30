import {keyTap} from 'robotjs';

import {mapCoordinateToImageCoordinate, squareCenter} from '../../../common/src/coordinates';
import {MapScan} from '../../../common/src/model';
import {click} from '../actions';
import {checkForColor} from '../colors';
import {
  getEnnemiesCoordinates,
  getPlayersCoordinates,
  GridCoordinate,
  gridToMap,
  hashCoordinate,
  mapToGrid,
} from '../fight';
import {Scenario, ScenarioContext} from '../scenario_runner';
import {scanMap} from '../screenshot';
import {bestCoffrePosition} from './coffre';
import {ensureCleanFightZone, waitForPlayerTurn} from './interface';

export async function playerTurn(
  ctx: ScenarioContext,
  fightContext: FightContext,
  mapScan: MapScan
): Promise<void> {
  const players = getPlayersCoordinates(mapScan);

  const ennemies = getEnnemiesCoordinates(mapScan).map(mapToGrid);
  if (ennemies.length === 0) {
    ctx.updateStatus(`Aucun ennemi détecté, pas d'action possible`);
  }

  if (fightContext.coffre === undefined) {
    if (players.length > 1) {
      ctx.updateStatus(
        'Coffre non posé par le bot, mais plusieurs ronds rouges détectés. La position du joueur sera choisi au hasard pour la suite du combat.'
      );
      fightContext.coffre = {x: -1, y: -1} as GridCoordinate;
      return playerTurn(ctx, fightContext, mapScan);
    }
    const player = mapToGrid(players[0]!);

    const coffrePosition = bestCoffrePosition(mapScan, player, ennemies);
    if (coffrePosition === undefined) {
      ctx.updateStatus(`Aucune position pour le coffre disponible, pas d'action possible`);
    } else {
      ctx.updateStatus(
        `Joueur: ${hashCoordinate(player)}, Ennemies: ${ennemies
          .map(hashCoordinate)
          .join(', ')}, Coffre: ${hashCoordinate(coffrePosition)}`
      );
      keyTap('1');
      await click(ctx.canContinue, {
        ...squareCenter(mapCoordinateToImageCoordinate(gridToMap(coffrePosition))),
        radius: 10,
      });
      // eslint-disable-next-line require-atomic-updates
      fightContext.coffre = coffrePosition;
    }
  }
}

interface FightContext {
  coffre?: GridCoordinate;
  chanceDone: boolean;
}

export const fightScenario: Scenario = async ctx => {
  const {canContinue, updateStatus} = ctx;

  // Check if the 'Ready" button is there. If that's the case, click it.
  updateStatus('Detection du bouton "Ready"');
  const readyButtonCoordinates = [
    {x: 1015, y: 620},
    {x: 1085, y: 620},
  ];
  if (checkForColor(readyButtonCoordinates, 'ED702D')) {
    updateStatus('Click sur bouton "Ready"');
    const readyCenterX = 1050;
    const readyCenterY = 620;
    await click(canContinue, {x: readyCenterX, y: readyCenterY, radius: 10, fast: true});
  }

  const fightContext: FightContext = {
    chanceDone: false,
  };

  /* eslint-disable no-await-in-loop */
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Wait for the player turn
    await waitForPlayerTurn(ctx);

    // Make sure the fight zone has everything hidden
    await ensureCleanFightZone(ctx);

    // Perform actions
    await playerTurn(ctx, fightContext, scanMap());

    // Pass turn
    await click(canContinue, {x: 745, y: 812, radius: 5});
  }
  /* eslint-enable no-await-in-loop */
};
