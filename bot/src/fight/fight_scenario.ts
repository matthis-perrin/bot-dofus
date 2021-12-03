/* eslint-disable no-await-in-loop */
import {keyTap} from 'robotjs';

import {mapCoordinateToImageCoordinate, squareCenter} from '../../../common/src/coordinates';
import {MapScan} from '../../../common/src/model';
import {click, moveToSafeZone, sleep} from '../actions';
import {checkForColor} from '../colors';
import {
  firstShortestPaths,
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
import {easiestEnnemyForSpell, Spell, Spells} from './spell';

interface FightContext {
  coffre?: GridCoordinate;
  chanceDone: boolean;
}

function identifyParticipants(
  mapScan: MapScan,
  fightContext: FightContext
): {ennemies: GridCoordinate[]; player: GridCoordinate} | {error: string} {
  const ennemies = getEnnemiesCoordinates(mapScan).map(mapToGrid);
  if (ennemies.length === 0) {
    return {error: `Aucun ennemies détectés`};
  }

  const players = getPlayersCoordinates(mapScan).map(mapToGrid);
  if (players.length === 0) {
    return {error: `Aucun joueurs détectés`};
  }

  if (fightContext.coffre === undefined) {
    if (players.length > 1) {
      fightContext.coffre = {x: -1, y: -1} as GridCoordinate;
    } else {
      const player = players[0]!;
      return {ennemies, player};
    }
  }

  const playersWithoutCoffre = players.filter(
    p => !(p.x === fightContext.coffre?.x && p.y === fightContext.coffre.y)
  );
  let player = playersWithoutCoffre[0];
  if (player === undefined) {
    return {ennemies, player: players[0]!};
  }

  if (playersWithoutCoffre.length > 1) {
    player = playersWithoutCoffre[Math.floor(Math.random() * playersWithoutCoffre.length)]!;
  }
  return {ennemies, player};
}

export async function playerTurn(ctx: ScenarioContext, fightContext: FightContext): Promise<void> {
  const mapScan = scanMap();
  const result = identifyParticipants(mapScan, fightContext);
  if ('error' in result) {
    ctx.updateStatus(`${result.error}, aucune action possible`);
    return;
  }
  const {player, ennemies} = result;

  ctx.updateStatus(
    `Début du tour. Player: ${hashCoordinate(player)}. Coffre: ${
      fightContext.coffre ? hashCoordinate(fightContext.coffre) : 'non posé'
    }. Ennemies: ${ennemies.map(hashCoordinate).join('/')}`
  );

  // POSITIONNING OF THE COFFRE
  if (fightContext.coffre === undefined) {
    const coffrePosition = bestCoffrePosition(mapScan, player, ennemies);
    if (coffrePosition === undefined) {
      ctx.updateStatus(`Aucune position pour le coffre disponible, pas d'action possible`);
      return;
    }
    ctx.updateStatus(`Placement du coffre en ${hashCoordinate(coffrePosition)}`);
    keyTap('1');
    await click(ctx.canContinue, {
      ...squareCenter(mapCoordinateToImageCoordinate(gridToMap(coffrePosition))),
      radius: 10,
    });
    // eslint-disable-next-line require-atomic-updates
    fightContext.coffre = coffrePosition;
    return;
  }

  let pmLeft = 4;
  let paLeft = 8;

  // CHANCE
  if (!fightContext.chanceDone) {
    paLeft -= 2;
    fightContext.chanceDone = true;
    ctx.updateStatus(`Chance pas encore faite, lancement du sort.`);
    keyTap('2');
    await click(ctx.canContinue, {
      ...squareCenter(mapCoordinateToImageCoordinate(gridToMap(player))),
      radius: 10,
    });
    await moveToSafeZone(ctx.canContinue);
  }

  // SPELLS
  async function maybeSpell(
    freshScan: MapScan,
    player: GridCoordinate,
    ennemies: GridCoordinate[],
    spell: Spell
  ): Promise<boolean> {
    const easiestEnnemy = easiestEnnemyForSpell(freshScan, player, ennemies, spell);
    if (easiestEnnemy && paLeft >= Spells[spell].pa) {
      const firstPath = easiestEnnemy.paths[0]; // TODO - Optimise choice
      if (firstPath && firstPath.length <= pmLeft) {
        // Go to the requested position
        const lastSquare = firstPath.at(-1);
        if (lastSquare) {
          pmLeft -= firstPath.length;
          await click(ctx.canContinue, {
            ...squareCenter(mapCoordinateToImageCoordinate(gridToMap(lastSquare))),
            radius: 10,
          });
        }
        paLeft -= Spells[spell].pa;
        ctx.updateStatus(
          `${spell} possible sur ennemie ${hashCoordinate(easiestEnnemy.ennemy)} Chemin: ${firstPath
            .map(hashCoordinate)
            .join(' / ')}`
        );
        // Select the LancerDePieces spell
        await click(ctx.canContinue, {
          ...Spells[spell].coordinate,
          radius: 10,
        });
        // Click the ennemy
        await click(ctx.canContinue, {
          ...squareCenter(mapCoordinateToImageCoordinate(gridToMap(easiestEnnemy.ennemy))),
          radius: 10,
        });
        // Move to safe zone
        await moveToSafeZone(ctx.canContinue);
        // Wait for animations
        await sleep(ctx.canContinue, 1500);
        return true;
      }
    }
    return false;
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const freshScan = scanMap();
    const freshResult = identifyParticipants(freshScan, fightContext);
    if ('error' in freshResult) {
      ctx.updateStatus(`${freshResult.error}, aucune action possible`);
      return;
    }
    if (
      await maybeSpell(freshScan, freshResult.player, freshResult.ennemies, Spell.LancerDePieces)
    ) {
      continue;
    }
    if (
      await maybeSpell(freshScan, freshResult.player, freshResult.ennemies, Spell.RoulageDePelle)
    ) {
      continue;
    }
    const ennemiesDistance = freshResult.ennemies.map(ennemy => ({
      ennemy,
      path: firstShortestPaths(freshScan, freshResult.player, ennemy),
    }));
    const closestEnnemy = ennemiesDistance.sort((e1, e2) => e1.path.length - e2.path.length)[0];
    if (closestEnnemy) {
      const targetSquare = closestEnnemy.path.slice(0, -1).slice(0, pmLeft).at(-1);
      if (targetSquare) {
        // Move toward ennemy
        await click(ctx.canContinue, {
          ...squareCenter(mapCoordinateToImageCoordinate(gridToMap(targetSquare))),
          radius: 10,
        });
      }
    }
    break;
  }
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

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Wait for the player turn
    await waitForPlayerTurn(ctx);

    // Make sure the fight zone has everything hidden
    await ensureCleanFightZone(ctx);

    // Perform actions
    await playerTurn(ctx, fightContext);

    // Pass turn
    await click(canContinue, {x: 745, y: 812, radius: 5});

    // Wait a bit
    await sleep(canContinue, 2000);
  }
};
/* eslint-enable no-await-in-loop */
