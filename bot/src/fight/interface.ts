import {click, sleep} from '../actions';
import {BLUE, checkForColor, GREEN, RED} from '../colors';
import {getSpellsBarStatus, isPlayerTurn} from '../detectors';
import {ScenarioContext} from '../scenario_runner';

export async function waitForPlayerTurn(ctx: ScenarioContext): Promise<void> {
  const {canContinue, updateStatus} = ctx;

  updateStatus('Attente du tour du joueur');
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (isPlayerTurn()) {
      return;
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(canContinue, 500);
  }
}

export async function ensureCleanFightZone(ctx: ScenarioContext): Promise<void> {
  const {canContinue, updateStatus} = ctx;

  // Check for the timeline visibility
  const timelineCoordinates = [{x: 1088, y: 640}];
  if (checkForColor(timelineCoordinates, BLUE, 15) || checkForColor(timelineCoordinates, RED, 15)) {
    updateStatus('Cache timeline');
    await click(canContinue, {x: 1119, y: 628, radius: 3, fast: true});
  }

  // Check for the tactical mode
  const tacticalCoordinates = [{x: 1020, y: 568}];
  if (!checkForColor(tacticalCoordinates, GREEN, 15)) {
    updateStatus('Activation du mode tactique');
    await click(canContinue, {...tacticalCoordinates[0]!, radius: 2});
  }

  // Check for the circle mode
  const circleCoordinates = [
    {x: 1043, y: 579},
    {x: 1046, y: 582},
    {x: 1051, y: 578},
  ];
  if (!checkForColor(circleCoordinates, GREEN, 15)) {
    updateStatus('Activation du mode cercle');
    await click(canContinue, {...circleCoordinates[1]!, radius: 2});
  }

  // Check for challenge visibility
  const challengeCoordinates1 = [
    {x: 16, y: 123},
    {x: 71, y: 123},
  ];
  const challengeCoordinates2 = [
    {x: 42, y: 97},
    {x: 42, y: 152},
  ];
  if (
    checkForColor(challengeCoordinates1, '#ccc4be', 5) &&
    checkForColor(challengeCoordinates2, '#ffffff', 5)
  ) {
    updateStatus('Cache challenge');
    await click(canContinue, {x: 23, y: 82, radius: 2});
  }

  // Check for the spells bar to be opened
  if (getSpellsBarStatus() === 'closed') {
    await click(canContinue, {x: 1105, y: 762, radius: 3});
  }
}
