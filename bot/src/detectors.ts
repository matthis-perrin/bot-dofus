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
    'ed702d',
    5
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
    'd4cfae',
    5
  );
}

export function isFull(): boolean {
  return checkForColor(
    [
      {x: 600, y: 688},
      {x: 610, y: 698},
    ],
    '78bc4b',
    5
  );
}

export function isInventoryOpen(): boolean {
  return checkForColor(
    [
      {x: 575, y: 50},
      {x: 650, y: 50},
      {x: 725, y: 50},
      {x: 800, y: 50},
      {x: 875, y: 50},
      {x: 950, y: 50},
      {x: 1025, y: 50},
      {x: 470, y: 150},
      {x: 716, y: 256},
    ],
    '504a3e',
    5
  );
}
