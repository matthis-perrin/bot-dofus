import {fishDb} from './fish_db';
import {mapLoop} from './scenario/fishing_scenario';

export function analyzeMaps(): void {
  for (const map of mapLoop) {
    let noDistanceCount = 0;
    let noTypeCount = 0;
    const fishes = fishDb.get(map);
    for (const fish of fishes) {
      if (fish.size === undefined || fish.type === undefined) {
        noTypeCount++;
      }
      if (fish.distance === undefined) {
        noDistanceCount++;
      }
    }
    if (noTypeCount === 0) {
      if (noDistanceCount === 0) {
        console.log(`🏆 [${map.x};${map.y}]`);
      } else {
        console.log(`✅ [${map.x};${map.y}] ${noDistanceCount} sans distances`);
      }
    } else {
      console.log(
        `❌ [${map.x};${map.y}] ${noTypeCount} sans type/taille et ${noDistanceCount} sans distances`
      );
    }
  }
}
