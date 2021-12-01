import {Coordinate} from '../../../common/src/coordinates';
import {MapScan} from '../../../common/src/model';
import {
  GridCoordinate,
  shortestPathsToLineOfSight,
  shortestPathsWithoutLineOfSight,
} from '../fight';

interface SpellInfo {
  minRange: number;
  maxRange: number;
  lineOfSight: boolean;
  pa: number;
  coordinate: Coordinate;
}

export enum Spell {
  LancerDePieces = 'LancerDePieces',
  RoulageDePelle = 'RoulageDePelle',
}

const PO = 3;

export const Spells: Record<Spell, SpellInfo> = {
  [Spell.LancerDePieces]: {
    minRange: 0,
    maxRange: 12 + PO,
    lineOfSight: true,
    pa: 2,
    coordinate: {x: 850, y: 760},
  },
  [Spell.RoulageDePelle]: {
    minRange: 1,
    maxRange: 8 + PO,
    lineOfSight: false,
    pa: 3,
    coordinate: {x: 1020, y: 760},
  },
};

export function easiestEnnemyForSpell(
  mapScan: MapScan,
  player: GridCoordinate,
  ennemies: GridCoordinate[],
  spell: Spell
): {ennemy: GridCoordinate; paths: GridCoordinate[][]} | undefined {
  const {minRange, maxRange, lineOfSight} = Spells[spell];

  const ennemiesReach = ennemies.map(ennemy => {
    if (lineOfSight) {
      return {
        ennemy,
        paths: shortestPathsToLineOfSight(mapScan, player, ennemy, {minRange, maxRange}),
      };
    }
    return {
      ennemy,
      paths: shortestPathsWithoutLineOfSight(mapScan, player, ennemy, minRange, maxRange),
    };
  });

  const easiestEnnemies = ennemiesReach
    .filter(e => e.paths.length > 0)
    .sort((e1, e2) => e1.paths[0]!.length - e2.paths[0]!.length);
  return easiestEnnemies[0];
}
