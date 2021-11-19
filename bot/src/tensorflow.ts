import * as tf from '@tensorflow/tfjs-node';
import {promises} from 'fs';
import {join} from 'path';

const {readFile} = promises;

export type Predictor = (buffer: Buffer) => Promise<{
  score: number;
  label: string;
}>;

export async function loadMapModel(): Promise<Predictor> {
  const modelDir = './models/map-coordinates';
  const imageTargetSize = 128;

  const model = (await tf.loadLayersModel(
    `file://${modelDir}/model.json`
  )) as unknown as tf.Sequential;
  const labelByNumber = new Map<number, string>(
    JSON.parse((await readFile(join(modelDir, 'labels.json'))).toString()) as [number, string][]
  );

  return async (buffer: Buffer) => {
    const res = model.predict(
      tf.node
        .decodeImage(buffer)
        .resizeNearestNeighbor([imageTargetSize, imageTargetSize])
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

    return prediction;
  };
}

export async function loadSoleilModel(): Promise<Predictor> {
  const modelDir = './models/soleil';
  const imageTargetSize = 40;

  const model = (await tf.loadLayersModel(
    `file://${modelDir}/model.json`
  )) as unknown as tf.Sequential;
  const labelByNumber = new Map<number, string>(
    JSON.parse((await readFile(join(modelDir, 'labels.json'))).toString()) as [number, string][]
  );

  return async (buffer: Buffer) => {
    const res = model.predict(
      tf.node
        .decodeImage(buffer)
        .resizeNearestNeighbor([imageTargetSize, imageTargetSize])
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

    if (prediction.score < 0.92) {
      prediction.label = 'OK';
    }

    return prediction;
  };
}
