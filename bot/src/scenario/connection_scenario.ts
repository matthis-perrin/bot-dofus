import {promises} from 'fs';
import {keyTap, typeStringDelayed} from 'robotjs';

import {click, randSleep, waitFor} from '../actions';
import {
  hasReconnectModal,
  isCharacterSelectionScreen,
  isDisconnected,
  isInFight,
  isServerSelectionScreen,
} from '../detectors';
import {stopBotEntirely} from '../process';
import {Scenario} from '../scenario_runner';

const {readFile} = promises;

export async function getCredentials(): Promise<{username: string; password: string}> {
  const credentialsFile = await readFile('credentials.txt');
  const [username, password] = credentialsFile.toString().split('\n');
  if (username === undefined || username.length === 0) {
    throw new Error(`No username in crendetials.txt`);
  }
  if (password === undefined || password.length === 0) {
    throw new Error(`No password in crendetials.txt`);
  }
  return {username, password};
}

export const connectionScenario: Scenario = async ctx => {
  const {canContinue} = ctx;
  // Check if we are on the login screen
  if (!isDisconnected() && !isServerSelectionScreen() && !isCharacterSelectionScreen()) {
    // If not, restart the game
    keyTap('r', 'command');
    await randSleep(canContinue, 3000, 3500);
    if (!(await waitFor(ctx, isDisconnected))) {
      stopBotEntirely();
    }
  }

  if (isDisconnected()) {
    // Remove some of the modals
    await randSleep(canContinue, 500, 700);
    keyTap('enter');
    await randSleep(canContinue, 500, 700);

    // Detect if the reconnection modal is opened
    if (hasReconnectModal()) {
      // Dismiss it (click on the right button "Non")
      await click(canContinue, {x: 682, y: 480, radius: 5});
    }

    const {username, password} = await getCredentials();

    // Enter credentials
    await click(canContinue, {x: 182, y: 290, radius: 8});
    typeStringDelayed(username, 500);
    await randSleep(canContinue, 200, 300);
    keyTap('tab');
    await randSleep(canContinue, 200, 300);
    typeStringDelayed(password, 500);
    await randSleep(canContinue, 200, 300);
    keyTap('enter');

    // Wait for next screen
    if (!(await waitFor(ctx, isServerSelectionScreen))) {
      stopBotEntirely();
    }
  }

  if (isServerSelectionScreen()) {
    // Select second server
    await click(canContinue, {x: 380, y: 463, radius: 20, double: true});

    // Wait for next screen
    if (!(await waitFor(ctx, isCharacterSelectionScreen))) {
      stopBotEntirely();
    }
  }

  if (isCharacterSelectionScreen()) {
    // Select the first character
    await click(canContinue, {x: 177, y: 468, radius: 5, double: true});

    // Wait for next screen
    if (!(await waitFor(ctx, () => isInFight() !== 'unknown'))) {
      stopBotEntirely();
    }
    return;
  }

  throw new Error('Should never happen');
};
