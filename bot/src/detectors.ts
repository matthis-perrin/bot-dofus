import {Coordinate} from '../../common/src/coordinates';
import {
  checkForColor,
  DISCONNECTED_BUTTON_ORANGE,
  DISCONNECTED_DARK_BROWN,
  DISCONNECTED_LIGHT_BROWN,
  DISCONNECTED_NEWS_HEADER_BROWN,
  FULL_PODS_GREEN,
  HEADER_BROWN,
  MODAL_BACK,
  ORANGE,
  PERCEPTEUR_WHITE,
} from './colors';

export function getSpellsBarStatus(): 'opened' | 'closed' | 'unknown' {
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

  if (
    checkForColor(topCoordinates, '#454035', 5) &&
    checkForColor(bottomCoordinates, '#b3ac90', 5)
  ) {
    return 'closed';
  } else if (
    checkForColor(topCoordinates, '#b3ac90', 5) &&
    checkForColor(bottomCoordinates, '#454035', 5)
  ) {
    return 'opened';
  }
  return 'unknown';
}

export function isPlayerTurn(): boolean {
  return checkForColor(
    [
      {x: 667, y: 692},
      {x: 671, y: 690},
    ],
    ORANGE,
    10
  );
}

export function hasLevelUpModal(): boolean {
  return checkForColor(
    [
      {x: 685, y: 370},
      {x: 775, y: 330},
    ],
    MODAL_BACK,
    5
  );
}

export function isFull(): boolean {
  return checkForColor(
    [
      {x: 600, y: 688},
      {x: 610, y: 698},
    ],
    FULL_PODS_GREEN,
    10
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
    HEADER_BROWN,
    5
  );
}

export function isCoffreOpen(): boolean {
  return (
    checkForColor(
      [
        {x: 110, y: 147},
        {x: 187, y: 147},
        {x: 275, y: 147},
        {x: 1067, y: 147},
      ],
      HEADER_BROWN,
      5
    ) &&
    checkForColor(
      [
        {x: 47, y: 613},
        {x: 221, y: 613},
        {x: 964, y: 600},
      ],
      MODAL_BACK,
      5
    )
  );
}

export function isEmptyItem(center: Coordinate): boolean {
  const noItemColor = '#beb89a';
  return [
    center,
    {x: center.x + 10, y: center.y + 10},
    {x: center.x + 10, y: center.y + 0},
    {x: center.x + 10, y: center.y - 10},
    {x: center.x + 0, y: center.y + 10},
    {x: center.x + 0, y: center.y + 0},
    {x: center.x + 0, y: center.y - 10},
    {x: center.x - 10, y: center.y + 10},
    {x: center.x - 10, y: center.y + 0},
    {x: center.x - 10, y: center.y - 10},
  ].every(c => checkForColor([c], noItemColor, 5));
}

export function isDisconnected(): boolean {
  return (
    checkForColor(
      [
        {x: 40, y: 40},
        {x: 40, y: 383},
        {x: 40, y: 660},
        {x: 255, y: 825},
        {x: 255, y: 825},
        {x: 973, y: 825},
        {x: 1100, y: 445},
        {x: 1100, y: 120},
        {x: 800, y: 20},
        {x: 400, y: 20},
      ],
      '#000000',
      5
    ) &&
    checkForColor(
      [
        {x: 236, y: 730},
        {x: 400, y: 730},
        {x: 575, y: 730},
        {x: 740, y: 730},
        {x: 913, y: 730},
      ],
      DISCONNECTED_DARK_BROWN,
      10
    ) &&
    checkForColor(
      [
        {x: 236, y: 647},
        {x: 400, y: 647},
        {x: 575, y: 647},
        {x: 740, y: 647},
        {x: 913, y: 647},
      ],
      DISCONNECTED_LIGHT_BROWN,
      10
    ) &&
    checkForColor(
      [
        {x: 850, y: 242},
        {x: 970, y: 242},
      ],
      DISCONNECTED_NEWS_HEADER_BROWN,
      5
    )
  );
}

export function hasReconnectModal(): boolean {
  return checkForColor(
    [
      {x: 642, y: 480},
      {x: 720, y: 480},
    ],
    '#ed6c2d',
    5
  );
}

export function isServerSelectionScreen(): boolean {
  return (
    checkForColor(
      [
        {x: 30, y: 30},
        {x: 30, y: 350},
        {x: 30, y: 600},
        {x: 30, y: 815},
        {x: 250, y: 760},
        {x: 560, y: 760},
        {x: 1100, y: 760},
        {x: 1100, y: 600},
        {x: 1100, y: 350},
        {x: 1100, y: 50},
        {x: 250, y: 30},
        {x: 560, y: 30},
      ],
      '#282620',
      5
    ) &&
    checkForColor(
      [
        {x: 380, y: 260},
        {x: 428, y: 260},
      ],
      '#282620',
      5
    )
  );
}

export function isCharacterSelectionScreen(): boolean {
  return (
    checkForColor(
      [
        {x: 30, y: 30},
        {x: 30, y: 350},
        {x: 30, y: 600},
        {x: 30, y: 815},
        {x: 250, y: 760},
        {x: 560, y: 760},
        {x: 1100, y: 760},
        {x: 1100, y: 600},
        {x: 1100, y: 350},
        {x: 1100, y: 50},
        {x: 250, y: 30},
        {x: 560, y: 30},
      ],
      '#282620',
      5
    ) &&
    checkForColor(
      [
        {x: 375, y: 323},
        {x: 428, y: 323},
      ],
      '#2f2825',
      5
    ) &&
    checkForColor(
      [
        {x: 520, y: 676},
        {x: 609, y: 676},
      ],
      DISCONNECTED_BUTTON_ORANGE,
      10
    )
  );
}

export function isInFightPreparation(): boolean {
  const readyButtonCoordinates = [
    {x: 1015, y: 628},
    {x: 1085, y: 628},
  ];
  const aroundReadyButtonCoordinates = [{x: 1118, y: 628}];
  return (
    checkForColor(readyButtonCoordinates, ORANGE, 10) &&
    checkForColor(aroundReadyButtonCoordinates, MODAL_BACK, 5)
  );
}

export function isInFight(): boolean {
  return checkForColor(
    [
      {x: 730, y: 819},
      {x: 761, y: 801},
    ],
    ORANGE,
    10
  );
}

export function isTalkingToPnj(): boolean {
  return checkForColor(
    [
      {x: 180, y: 230},
      {x: 300, y: 230},
      {x: 450, y: 230},
    ],
    PERCEPTEUR_WHITE,
    5
  );
}

export function isMainMenuOpened(): boolean {
  return (
    checkForColor(
      [
        {x: 555, y: 215},
        {x: 636, y: 215},
        {x: 717, y: 215},
      ],
      HEADER_BROWN,
      5
    ) &&
    checkForColor(
      [
        {x: 411, y: 241},
        {x: 411, y: 454},
        {x: 719, y: 241},
        {x: 719, y: 454},
      ],
      MODAL_BACK,
      5
    )
  );
}
