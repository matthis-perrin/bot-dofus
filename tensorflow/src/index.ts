import {runMap} from './map';
import {runSoleil} from './soleil';

const mode = 'map' as string;

if (mode === 'map') {
  runMap().catch(console.error);
} else if (mode === 'soleil') {
  runSoleil().catch(console.error);
} else {
  console.error(`Unknown mode "${mode}"`);
}
