import {Coordinate} from '../../common/src/coordinates';
import {getColorAverage} from './colors';

const topCoordinates: Coordinate[] = [
  {x: 1095, y: 740},
  {x: 1095, y: 755},
  {x: 1095, y: 770},
];
const bottomCoordinates: Coordinate[] = [
  {x: 1095, y: 795},
  {x: 1095, y: 810},
  {x: 1095, y: 825},
];

export function isInFight(): boolean {
  const topColor = getColorAverage(topCoordinates);
  const bottomColor = getColorAverage(bottomCoordinates);
  const topIsLighter =
    topColor.r + topColor.g + topColor.b > bottomColor.r + bottomColor.g + bottomColor.b;
  return topIsLighter;
}
