import {runClassifier} from './classifier';

const mode = 'rune' as string;

if (mode === 'map') {
  runClassifier(mode, {imageTargetSize: 128, epochs: 20, batchSize: 4}).catch(console.error);
} else if (mode === 'soleil') {
  runClassifier(mode, {imageTargetSize: 40, epochs: 10, batchSize: 4}).catch(console.error);
} else if (mode === 'fish_popup') {
  runClassifier(mode, {imageTargetSize: 40, epochs: 15, batchSize: 1}).catch(console.error);
} else if (mode === 'character') {
  runClassifier(mode, {imageTargetSize: 40, epochs: 3, batchSize: 1}).catch(console.error);
} else if (mode === 'character_fishing') {
  runClassifier(mode, {imageTargetSize: 40, epochs: 3, batchSize: 1}).catch(console.error);
} else if (mode === 'rune') {
  runClassifier(mode, {imageTargetSize: 42, epochs: 120, batchSize: 1}).catch(console.error);
} else if (mode === 'rune_cropped') {
  runClassifier(mode, {imageTargetSize: 44, epochs: 360, batchSize: 1}).catch(console.error);
} else {
  console.error(`Unknown mode "${mode}"`);
}
