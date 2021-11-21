import {runFishPopup} from './fish_popup';
import {runMap} from './map';
import {runSoleil} from './soleil';

const mode = 'fish_popup' as string;

if (mode === 'map') {
  runMap().catch(console.error);
} else if (mode === 'soleil') {
  runSoleil().catch(console.error);
} else if (mode === 'fish_popup') {
  runFishPopup().catch(console.error);
} else {
  console.error(`Unknown mode "${mode}"`);
}
