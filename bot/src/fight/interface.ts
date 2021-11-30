import {click, sleep} from '../actions';
import {checkForColor} from '../colors';
import {ScenarioContext} from '../scenario_runner';

export async function waitForPlayerTurn(ctx: ScenarioContext): Promise<void> {
  const {canContinue, updateStatus} = ctx;

  updateStatus('Attente du tour du joueur');
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const playerTurnCoordinates = [
      {x: 667, y: 692},
      {x: 671, y: 690},
    ];
    if (checkForColor(playerTurnCoordinates, 'ED702D')) {
      return;
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(canContinue, 500);
  }
}

export async function ensureCleanFightZone(ctx: ScenarioContext): Promise<void> {
  const {canContinue, updateStatus} = ctx;

  // Check for the timeline visibility
  const timelineCoordinates = [
    {x: 1088, y: 607},
    {x: 1088, y: 630},
  ];
  if (
    checkForColor(timelineCoordinates, '0000EB') ||
    checkForColor(timelineCoordinates, 'ea3323')
  ) {
    updateStatus('Cache timeline');
    await click(canContinue, {x: 1119, y: 628, radius: 3, fast: true});
  }

  // Check for the tactical mode
  const tacticalCoordinates = [{x: 1020, y: 568}];
  if (!checkForColor(tacticalCoordinates, '44972B')) {
    updateStatus('Activation du mode tactique');
    await click(canContinue, {...tacticalCoordinates[0]!, radius: 2});
  }

  // Check for the circle mode
  const circleCoordinates = [
    {x: 1043, y: 579},
    {x: 1046, y: 582},
    {x: 1051, y: 578},
  ];
  if (!checkForColor(circleCoordinates, '44972B')) {
    updateStatus('Activation du mode cercle');
    await click(canContinue, {...circleCoordinates[1]!, radius: 2});
  }

  // Check for challenge visibility
  const challengeCoordinates1 = [
    {x: 16, y: 123},
    {x: 71, y: 123},
  ];
  const challengeCoordinates2 = [
    {x: 42, y: 98},
    {x: 42, y: 152},
  ];
  if (
    checkForColor(challengeCoordinates1, 'CDC4BE') &&
    checkForColor(challengeCoordinates2, 'FFFFFF')
  ) {
    updateStatus('Cache challenge');
    await click(canContinue, {x: 23, y: 82, radius: 2});
  }
}
