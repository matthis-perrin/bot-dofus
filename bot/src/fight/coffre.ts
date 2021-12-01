import {MapScan} from '../../../common/src/model';
import {
  getAvailableTargets,
  GridCoordinate,
  shortestPathLength,
  shortestPathsToLineOfSight,
} from '../fight';

const COFFRE_RANGE = 6;

export function bestCoffrePosition(
  mapScan: MapScan,
  player: GridCoordinate,
  ennemies: GridCoordinate[]
): GridCoordinate | undefined {
  // Get the positions where putting the coffre is possible
  const availablePositionForCoffre = getAvailableTargets(mapScan, player, COFFRE_RANGE);

  // Compute for each available position
  // - how many PM for the ennemies to get to a line of sight
  // - how many PM for the ennemies to get next to the coffre
  const coffrePositionToClosestEnnemy = availablePositionForCoffre.map(p => {
    const ennemyDistances = ennemies.map(e => {
      const lineOfSightsPaths = shortestPathsToLineOfSight(mapScan, e, p, {
        excludePlayersForLineOfSight: true,
      });
      const cacPathsLength = shortestPathLength(mapScan, e, p);
      const [firstLineOfSightPath] = lineOfSightsPaths;
      const lineOfSightDistance =
        firstLineOfSightPath === undefined ? 1000 : firstLineOfSightPath.length;
      const cacDistance = cacPathsLength ?? 1000;
      return {lineOfSightDistance, firstLineOfSightPath, cacDistance};
    });
    const closestLineOfSight = Math.min(...ennemyDistances.map(d => d.lineOfSightDistance));
    return {
      coffrePosition: p,
      closestLineOfSight,
      pathsToClosestLineOfSight: ennemyDistances
        .map(d => d.firstLineOfSightPath)
        .filter(p => p?.length === closestLineOfSight),
      closestCac: Math.min(...ennemyDistances.map(d => d.cacDistance)),
    };
  });

  // Keep the positions that are the furthest from any ennemy line of sight, then the furthest from any cac
  const [bestCoffrePosition] = coffrePositionToClosestEnnemy
    .map(p => ({
      ...p,
      score: p.closestLineOfSight * 1e6 + p.closestCac,
    }))
    .sort((p1, p2) => p2.score - p1.score);

  return bestCoffrePosition?.coffrePosition;
}
