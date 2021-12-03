import {Coordinate} from '../../common/src/coordinates';
import {checkForColor, fetchColorAverage} from './colors';

export function isInFight(): boolean {
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

  const topColor = fetchColorAverage(topCoordinates);
  const bottomColor = fetchColorAverage(bottomCoordinates);
  const topIsLighter =
    topColor.r + topColor.g + topColor.b > bottomColor.r + bottomColor.g + bottomColor.b;
  return topIsLighter;
}

export function isPlayerTurn(): boolean {
  return checkForColor(
    [
      {x: 667, y: 692},
      {x: 671, y: 690},
    ],
    'ED702D',
    25
  );
}

export function hasLevelUpModal(): boolean {
  return checkForColor(
    [
      {x: 342, y: 307},
      {x: 360, y: 370},
      {x: 450, y: 370},
      {x: 685, y: 370},
      {x: 775, y: 330},
    ],
    'd5cfaa',
    10
  );
}

export function isInventoryFull(): boolean {
  return checkForColor(
    [
      {x: 600, y: 688},
      {x: 610, y: 698},
    ],
    '60be34',
    10
  );
}
