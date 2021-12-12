import * as tf from '@tensorflow/tfjs-node';
import {promises} from 'fs';
import Jimp from 'jimp';
import {join, resolve} from 'path';

const {readdir, writeFile} = promises;

interface ImageInfo {
  img: {
    data: Buffer;
    width: number;
    height: number;
  };
  label: string;
}

async function loadImages(dir: string, targetSize: number): Promise<ImageInfo[]> {
  const dirList = (await readdir(dir, {withFileTypes: true})).filter(f => f.name !== '.DS_Store');
  const loneFiles = dirList.filter(f => !f.isDirectory());
  if (loneFiles.length > 0) {
    console.warn(`Found files that are not in folders:\n${loneFiles.map(f => f.name).join('\n')}`);
  }
  const dirs = dirList.filter(f => f.isDirectory());

  const imagesAndLabels: ImageInfo[] = [];

  const filesByDir = await Promise.all(
    dirs.map(async d => {
      const dirPath = join(dir, d.name);
      const dirFiles = (await readdir(dirPath, {withFileTypes: true})).filter(
        f => f.name !== '.DS_Store'
      );
      return {dirPath, dirFiles, dirName: d.name};
    })
  );
  const maxFilesPerDir = filesByDir.reduce((prev, curr) => Math.max(prev, curr.dirFiles.length), 0);

  await Promise.all(
    filesByDir.map(async ({dirFiles, dirPath, dirName}) => {
      const loneDir = dirFiles.filter(f => !f.isFile());
      if (loneFiles.length > 0) {
        console.warn(
          `Found non-file in folders ${dirName}:\n${loneDir.map(f => f.name).join('\n')}`
        );
      }
      const files = dirFiles.filter(f => f.isFile());
      const images = await Promise.all(
        files.map(async f => {
          const filePath = join(dirPath, f.name);
          const bitmap = (await Jimp.read(filePath)).bitmap;

          const rgbBuffer = Buffer.allocUnsafe(3 * targetSize * targetSize);
          for (let dstX = 0; dstX < targetSize; dstX++) {
            for (let dstY = 0; dstY < targetSize; dstY++) {
              const srcX = Math.round((dstX * bitmap.width) / targetSize);
              const srcY = Math.round((dstY * bitmap.height) / targetSize);

              const srcOffset = (srcY * bitmap.width + srcX) * 4;
              const dstOffset = (dstY * targetSize + dstX) * 3;

              rgbBuffer[dstOffset] = bitmap.data[srcOffset]!;
              rgbBuffer[dstOffset + 1] = bitmap.data[srcOffset + 1]!;
              rgbBuffer[dstOffset + 2] = bitmap.data[srcOffset + 2]!;
            }
          }

          return {
            img: {
              data: rgbBuffer,
              width: targetSize,
              height: targetSize,
            },
            label: dirName,
          };
        })
      );
      const imageAndDuplicates = [...images];
      while (imageAndDuplicates.length < maxFilesPerDir) {
        imageAndDuplicates.push(images[Math.floor(Math.random() * images.length)]!);
      }
      imagesAndLabels.push(...imageAndDuplicates.sort(() => (Math.random() > 0.5 ? -1 : 1)));
    })
  );

  return imagesAndLabels.sort(() => (Math.random() > 0.5 ? -1 : 1));
}

function processImageInfo(imageInfo: ImageInfo[]): {
  images: tf.Tensor<tf.Rank>;
  labels: tf.Tensor<tf.Rank>;
  labelIndex: Map<string, number>;
} {
  let counter = 0;
  const labelIndex = new Map<string, number>();
  for (const {label} of imageInfo) {
    if (labelIndex.has(label)) {
      continue;
    }
    labelIndex.set(label, counter);
    counter++;
  }

  // eslint-disable-next-line unicorn/prefer-spread
  const images = tf.concat(
    imageInfo.map(d => tf.browser.fromPixels(d.img, 3).toFloat().div(tf.scalar(255)).expandDims())
  );
  const labels = tf
    .oneHot(
      tf.tensor1d(
        imageInfo.map(d => labelIndex.get(d.label)!),
        'int32'
      ),
      counter
    )
    .toFloat();

  return {images, labels, labelIndex};
}

function prepareModel(labels: number, targetSize: number): tf.Sequential {
  const kernelSize = [3, 3];
  const poolSize: [number, number] = [2, 2];
  const filters = 32;
  const dropoutConv = 0.3;
  const dropoutDense = 0.3;

  const model = tf.sequential();
  model.add(
    tf.layers.conv2d({
      inputShape: [targetSize, targetSize, 3],
      filters,
      kernelSize,
      activation: 'relu',
    })
  );
  model.add(
    tf.layers.conv2d({
      filters,
      kernelSize,
      activation: 'relu',
    })
  );
  model.add(tf.layers.maxPooling2d({poolSize}));
  model.add(tf.layers.dropout({rate: dropoutConv}));

  model.add(tf.layers.flatten());

  model.add(tf.layers.dense({units: targetSize, activation: 'relu'}));
  model.add(tf.layers.dropout({rate: dropoutDense}));
  model.add(tf.layers.dense({units: labels, activation: 'softmax'}));

  const optimizer = tf.train.adam(0.0001);
  model.compile({
    optimizer,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

export async function runClassifier(
  name: string,
  opts: {imageTargetSize: number; epochs: number; batchSize: number}
): Promise<void> {
  const {imageTargetSize, epochs, batchSize} = opts;
  const modelDir = resolve(`../models/${name}`);
  const imageDir = resolve(`../images/${name}`);

  console.log('Start');
  console.log('Loading image');
  const imageInfo = await loadImages(imageDir, imageTargetSize);

  //

  console.log('Processing images');
  const {images, labels, labelIndex} = processImageInfo(imageInfo);
  const labelByNumber = new Map([...labelIndex.entries()].map(([label, index]) => [index, label]));

  console.log('Preparing model');
  const model = prepareModel(labelIndex.size, imageTargetSize);
  console.log('Model summary');
  model.summary();
  const validationSplit = 0.15;
  console.log('Start learning');
  await model.fit(images, labels, {
    epochs,
    batchSize,
    validationSplit,
  });
  console.log('Saving model');
  await Promise.all([
    model.save(`file://${modelDir}`),
    writeFile(join(modelDir, 'labels.json'), JSON.stringify([...labelByNumber.entries()])),
  ]);

  //

  // const model = (await tf.loadLayersModel(
  //   `file://${modelDir}/model.json`
  // )) as unknown as tf.Sequential;
  // const labelByNumber = new Map<number, string>(
  //   JSON.parse(await (await readFile(join(modelDir, 'labels.json'))).toString())
  // );

  //

  let worstPrediction = {label: '', score: 1, expected: ''};

  function printPrediction(prediction: {label: string; score: number}, expected: string): void {
    const isCorrect = prediction.label === expected;
    console.log(
      `${isCorrect ? '✅' : '❌'} Input ${expected} - Output ${prediction.label} (Confidence ${
        Math.round(prediction.score * 1000) / 10
      }%)`
    );
  }

  for (const {img, label} of imageInfo) {
    const res = model.predict(
      tf.browser
        .fromPixels(img, 3)
        .resizeNearestNeighbor([imageTargetSize, imageTargetSize])
        .toFloat()
        .div(tf.scalar(255))
        .expandDims()
    );
    if (Array.isArray(res)) {
      throw new Error(`Invalid prediction result`);
    }
    // eslint-disable-next-line no-await-in-loop
    const scores = (await res.data()) as Int32Array;
    const predictions = [...scores.map(v => Number(v))]
      .map((s, i) => ({
        score: s,
        label: labelByNumber.get(i)!,
      }))
      .sort((v1, v2) => v2.score - v1.score);
    const prediction = predictions[0]!;
    if (prediction.score < worstPrediction.score) {
      worstPrediction = {...prediction, expected: label};
    }
    printPrediction(prediction, label);
  }

  console.log('=== WORST PREDICTION ===');
  printPrediction(worstPrediction, worstPrediction.expected);
  console.log('========================');
}
