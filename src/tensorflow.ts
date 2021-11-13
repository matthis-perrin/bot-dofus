import * as tf from "@tensorflow/tfjs-node";
import { channel } from "diagnostics_channel";
import { readFile } from "fs/promises";
import { join } from "path";

export type Predictor = (buffer: Buffer) => Promise<{
  score: number;
  label: string;
}>

export async function loadModel(): Promise<Predictor> {
  const modelDir = "./models/map-coordinates";
  const imageTargetSize = 128;

  const model = await tf.loadLayersModel(`file://${modelDir}/model.json`) as unknown as tf.Sequential
  const labelByNumber = new Map<number, string>(JSON.parse((await (await readFile(join(modelDir, 'labels.json'))).toString())))

  return async (buffer: Buffer) => {
    const res = model.predict(
        tf.node
          .decodeImage(buffer, 3)
          .resizeNearestNeighbor([imageTargetSize, imageTargetSize])
          .toFloat()
          .div(tf.scalar(255.0))
          .expandDims()
      );
      if (Array.isArray(res)) {
        throw new Error(`Invalid prediction result`);
      }
      const scores = (await res.data()) as Int32Array;
      const predictions = [...scores.map((v) => Number(v))]
        .map((s, i) => ({
          score: s,
          label: labelByNumber.get(i)!,
        }))
        .sort((v1, v2) => v2.score - v1.score);
      const prediction = predictions[0];

      return prediction;
  }
}