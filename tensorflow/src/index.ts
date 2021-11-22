import {runClassifier} from './classifier';

const mode = 'fish_popup' as string;

if (mode === 'map') {
  runClassifier('map', {imageTargetSize: 128, epochs: 20, batchSize: 4}).catch(console.error);
} else if (mode === 'soleil') {
  runClassifier('soleil', {imageTargetSize: 40, epochs: 10, batchSize: 4}).catch(console.error);
} else if (mode === 'fish_popup') {
  runClassifier('fish_popup', {imageTargetSize: 40, epochs: 15, batchSize: 1}).catch(console.error);
} else {
  console.error(`Unknown mode "${mode}"`);
}
