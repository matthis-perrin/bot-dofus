import * as tf from '@tensorflow/tfjs-node';
import {promises} from 'fs';
import {join} from 'path';

const {readdir, readFile, writeFile, mkdir} = promises;

interface ImageInfo {
  fileName: string;
  data: Buffer;
  label: string;
}

async function loadImages(dir: string): Promise<ImageInfo[]> {
  const dirList = (await readdir(dir, {withFileTypes: true})).filter(f => f.name !== '.DS_Store');
  const loneFiles = dirList.filter(f => !f.isDirectory());
  if (loneFiles.length > 0) {
    console.warn(`Found files that are not in folders:\n${loneFiles.map(f => f.name).join('\n')}`);
  }
  const dirs = dirList.filter(f => f.isDirectory());

  let minSize = Number.MAX_VALUE;
  await Promise.all(
    dirs.map(async d => {
      const dirPath = join(dir, d.name);
      const dirFiles = (await readdir(dirPath, {withFileTypes: true})).filter(
        f => f.name !== '.DS_Store'
      );
      const files = dirFiles.filter(f => f.isFile());
      if (files.length < minSize) {
        minSize = files.length;
      }
    })
  );

  const imagesAndLabels: ImageInfo[] = [];
  await Promise.all(
    dirs.map(async d => {
      const dirPath = join(dir, d.name);
      const dirFiles = (await readdir(dirPath, {withFileTypes: true})).filter(
        f => f.name !== '.DS_Store'
      );
      const loneDir = dirFiles.filter(f => !f.isFile());
      if (loneDir.length > 0) {
        console.warn(
          `Found non-file in folders ${d.name}:\n${loneDir.map(f => f.name).join('\n')}`
        );
      }
      const files = dirFiles.filter(f => f.isFile()); //.sort(() => Math.random() > 0.5 ? -1 : 1).slice(0, minSize);
      await Promise.all(
        files.map(async f => {
          const filePath = join(dirPath, f.name);
          imagesAndLabels.push({
            fileName: f.name,
            data: await readFile(filePath),
            label: d.name,
          });
        })
      );
    })
  );

  return imagesAndLabels.sort(() => (Math.random() > 0.5 ? -1 : 1));
}

function processImageInfo(
  imageInfo: ImageInfo[],
  targetSize: number
): {
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
    imageInfo.map(d =>
      tf.node
        .decodeImage(d.data, 3)
        .resizeNearestNeighbor([targetSize, targetSize])
        .toFloat()
        .div(tf.scalar(255))
        .expandDims()
    )
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

export async function runSoleil(): Promise<void> {
  const modelDir = './models/soleil';
  const imageDir = './images/soleil';
  const imageTargetSize = 40;

  console.log('Start');
  console.log('Loading image');
  const imageInfo = await loadImages(imageDir);
  // const split = Math.round((2 * imageInfo.length) / 3);
  const trainingInfo = imageInfo; //imageInfo.slice(0, split);
  const testInfo = imageInfo; //imageInfo.slice(split);

  //

  console.log('Processing images');
  const {images, labels, labelIndex} = processImageInfo(trainingInfo, imageTargetSize);
  const labelByNumber = new Map([...labelIndex.entries()].map(([label, index]) => [index, label]));

  console.log('Preparing model');
  const model = prepareModel(labelIndex.size, imageTargetSize);
  console.log('Model summary');
  model.summary();
  const epochs = 10;
  const batchSize = 4;
  const validationSplit = 0.15;
  console.log('Start learning');
  await model.fit(images, labels, {
    epochs,
    batchSize,
    validationSplit,
  });
  console.log('Saving model');
  try {
    await mkdir(modelDir, {recursive: true});
  } catch {
    // Already there
  }
  await Promise.all([
    model.save(`file://${modelDir}`),
    writeFile(join(modelDir, 'labels.json'), JSON.stringify([...labelByNumber.entries()])),
  ]);

  //

  // const model = (await tf.loadLayersModel(
  //   `file://${modelDir}/model.json`
  // )) as unknown as tf.Sequential;
  // const labelByNumber = new Map<number, string>(
  //   JSON.parse(await (await readFile(join(modelDir, "labels.json"))).toString())
  // );

  //

  //   const indexForNotOk = labelByNumber.get(0) === 'NOTOK' ? 0 : 1;

  for (const {data, label, fileName} of testInfo) {
    const res = model.predict(
      tf.node
        .decodeImage(data, 3)
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

    // if (prediction.score < 0.8) {
    //   prediction.label = "OK";
    // }

    const isCorrect = prediction.label === label;
    const icon = isCorrect ? '✅' : '❌';
    if (!isCorrect) {
      console.log(
        `${icon} Input ${label} - Output ${prediction.label} (Confidence ${
          Math.round(prediction.score * 1000) / 10
        }% - ${fileName})`
      );
    }
    if (prediction.score < 0.5) {
      console.log(predictions.slice(0, 3));
    }
  }
}
