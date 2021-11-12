import * as tf from "@tensorflow/tfjs-node";

import { join, resolve } from "path";
import { promises } from "fs";
import {createHash} from 'crypto'

const { readdir, readFile, writeFile } = promises;

function coordinateToNumber({ x, y }: { x: number; y: number }): number {
  return x * 100000 + y;
}
function coordinateToLabel({ x, y }: { x: number; y: number }): string {
  return `${x},${y}`;
}
function numberToCoordinate(val: number): { x: number; y: number } {
  const y = val % 100000;
  const x = Math.floor((val - y) / 100000);
  return { x, y };
}
function parseCoordinateFromDirName(dirName: string): { x: number; y: number } {
  const err = `Invalid dir name ${dirName}`;
  const vals = dirName.split("h");
  if (vals.length !== 2) {
    throw new Error(err);
  }
  const [xStr, yStr] = vals;
  const x = parseFloat(xStr);
  const y = parseFloat(yStr);
  if (!isFinite(x) || !isFinite(y)) {
    throw new Error(err);
  }
  return { x, y };
}

interface ImageInfo {
  fileName: string;
  data: Buffer;
  label: string;
  class: number;
}

async function loadImages(dir: string): Promise<ImageInfo[]> {
  const dirList = (await readdir(dir, { withFileTypes: true })).filter(
    (f) => f.name !== ".DS_Store"
  );
  const loneFiles = dirList.filter((f) => !f.isDirectory());
  if (loneFiles.length > 0) {
    console.warn(
      `Found files that are not in folders:\n${loneFiles
        .map((f) => f.name)
        .join("\n")}`
    );
  }
  const dirs = dirList.filter((f) => f.isDirectory());

  const imagesAndLabels: ImageInfo[] = [];
  await Promise.all(
    dirs.map(async (d) => {
      const coordinate = parseCoordinateFromDirName(d.name);
      const dirPath = join(dir, d.name);
      const dirFiles = (await readdir(dirPath, { withFileTypes: true })).filter(
        (f) => f.name !== ".DS_Store"
      );
      const loneDir = dirFiles.filter((f) => !f.isFile());
      if (loneFiles.length > 0) {
        console.warn(
          `Found non-file in folders ${d.name}:\n${loneDir
            .map((f) => f.name)
            .join("\n")}`
        );
      }
      const files = dirFiles.filter((f) => f.isFile());
      await Promise.all(
        files.map(async (f) => {
          const filePath = join(dirPath, f.name);
          imagesAndLabels.push({
            fileName: f.name,
            data: await readFile(filePath),
            class: coordinateToNumber(coordinate),
            label: coordinateToLabel(coordinate),
          });
        })
      );
    })
  );

  return imagesAndLabels.sort((i1, i2) => i1.fileName.localeCompare(i2.fileName));
}

function processImageInfo(imageInfo: ImageInfo[], targetSize: number): {
  images: tf.Tensor<tf.Rank>;
  labels: tf.Tensor<tf.Rank>;
  labelIndex: Map<string, number>;
} {
  let counter = 0;
  const labelIndex = new Map<string, number>();
  for (const { label } of imageInfo) {
    if (labelIndex.has(label)) {
      continue;
    }
    labelIndex.set(label, counter);
    counter++;
  }

  const images = tf.concat(
    imageInfo.map((d) =>
      tf.node
        .decodeImage(d.data)
        .resizeNearestNeighbor([targetSize, targetSize])
        .toFloat()
        .div(tf.scalar(255.0))
        .expandDims()
    )
  );
  const labels = tf
    .oneHot(
      tf.tensor1d(
        imageInfo.map((d) => labelIndex.get(d.label)!),
        "int32"
      ),
      counter
    )
    .toFloat();

  return { images, labels, labelIndex };
}

function prepareModel(labels: number, targetSize: number): tf.Sequential {
  const kernel_size = [3, 3];
  const pool_size: [number, number] = [2, 2];
  const first_filters = 32;
  const second_filters = 64;
  const third_filters = 128;
  const dropout_conv = 0.3;
  const dropout_dense = 0.3;

  const model = tf.sequential();
  model.add(
    tf.layers.conv2d({
      inputShape: [targetSize, targetSize, 3],
      filters: first_filters,
      kernelSize: kernel_size,
      activation: "relu",
    })
  );
  model.add(
    tf.layers.conv2d({
      filters: first_filters,
      kernelSize: kernel_size,
      activation: "relu",
    })
  );
  model.add(tf.layers.maxPooling2d({ poolSize: pool_size }));
  model.add(tf.layers.dropout({ rate: dropout_conv }));

  model.add(tf.layers.flatten());

  model.add(tf.layers.dense({ units: 256, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: dropout_dense }));
  model.add(tf.layers.dense({ units: labels, activation: "softmax" }));

  const optimizer = tf.train.adam(0.0001);
  model.compile({
    optimizer: optimizer,
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
}

async function run(): Promise<void> {

  const imageDir = "../images/map"
  const imageTargetSize = 256;

  console.log('Start')
  console.log('Loading image')
  const imageInfo = await loadImages(imageDir);
  
  console.log('Processing images')
  const { images, labels, labelIndex } = processImageInfo(imageInfo, imageTargetSize);
  const labelByNumber = new Map(
    [...labelIndex.entries()].map(([label, index]) => [index, label])
  );

  // console.log('Preparing model')
  // const model = prepareModel(labelIndex.size, imageTargetSize);
  // console.log('Model summary')
  // model.summary();
  // const epochs = 3;
  // const batchSize = 1;
  // const validationSplit = 0.15;
  // console.log('Start learning')
  // await model.fit(images, labels, {
  //   epochs,
  //   batchSize,
  //   validationSplit,
  // });
  // console.log('Saving model')
  // await model.save('file://./models/map-coordinates');

  const model = await tf.loadLayersModel('file://../models/map-coordinates/model.json') as unknown as tf.Sequential

    let finalHash: string = '';

  for (const { data, label } of imageInfo) {
    const res = model.predict(
      tf.node
        .decodeImage(data)
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
      const prediction = predictions[0]

      const isCorrect = prediction.label === label;
    finalHash += '_' + [...scores].map(s => String(s)).join(',');
    console.log(
      `${isCorrect ? '✅' : '❌'} Input ${label} - Output ${prediction.label} (Confidence ${
        Math.round(prediction.score * 1000) / 10
      }%)`
    );
    if (prediction.score < 0.5) {
      console.log(predictions.slice(0, 3))
    }
  }

  console.log(createHash('md5').update(finalHash).digest('hex'))
}

run().catch(console.error);
