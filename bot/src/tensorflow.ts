import * as tf from '@tensorflow/tfjs-node';
import {promises} from 'fs';
import {join} from 'path';

import {RgbImage} from './screenshot';

const {readFile} = promises;

interface Prediction {
  score: number;
  label: string;
}

export type Predictor = (image: RgbImage) => Promise<Prediction>;

async function loadModel(
  modelDir: string,
  imageTargetSize: number,
  postProcess?: (p: Prediction) => Prediction
): Promise<Predictor> {
  const model = (await tf.loadLayersModel(
    `file://${modelDir}/model.json`
  )) as unknown as tf.Sequential;
  const labelsFileContent = await readFile(join(modelDir, 'labels.json'));
  const labelByNumber = new Map<number, string>(
    JSON.parse(labelsFileContent.toString()) as [number, string][]
  );

  const predictor: Predictor = async image => {
    const srcWidth = image.width;
    const srcHeight = image.height;

    const rgbBuffer = Buffer.allocUnsafe(3 * imageTargetSize * imageTargetSize);
    for (let dstX = 0; dstX < imageTargetSize; dstX++) {
      for (let dstY = 0; dstY < imageTargetSize; dstY++) {
        const srcX = Math.round((dstX * srcWidth) / imageTargetSize);
        const srcY = Math.round((dstY * srcHeight) / imageTargetSize);

        const srcOffset = (srcY * srcWidth + srcX) * 3;
        const dstOffset = (dstY * imageTargetSize + dstX) * 3;

        rgbBuffer[dstOffset] = image.data[srcOffset]!;
        rgbBuffer[dstOffset + 1] = image.data[srcOffset + 1]!;
        rgbBuffer[dstOffset + 2] = image.data[srcOffset + 2]!;
      }
    }

    const res = model.predict(
      tf.browser
        .fromPixels(
          {
            data: rgbBuffer,
            width: imageTargetSize,
            height: imageTargetSize,
          },
          3
        )
        .toFloat()
        .div(tf.scalar(255))
        .expandDims()
    );
    if (Array.isArray(res)) {
      throw new Error(`Invalid prediction result`);
    }
    const scores = (await res.data()) as Int32Array;
    const predictions = [...scores.map(v => Number(v))]
      .map((s, i) => ({
        score: s,
        label: labelByNumber.get(i)!,
      }))
      .sort((v1, v2) => v2.score - v1.score);
    const prediction = predictions[0]!;

    return postProcess?.(prediction) ?? prediction;
  };
  return predictor;
}

export const loadMapModel = async (): Promise<Predictor> => loadModel('./models/map', 128);
export const loadFishPopupModel = async (): Promise<Predictor> =>
  loadModel('./models/fish_popup', 40);
