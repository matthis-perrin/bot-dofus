export const TODO = 'remove';
// import {mkdirSync, promises} from 'fs';
// import GK from 'global-keypress';
// import {join} from 'path';
// import {mouseClick, moveMouseSmooth} from 'robotjs';

// import {gameCoordinates, SQUARE_SIZE} from '../../common/src/model';
// import {handleError} from './error';
// import {takeBorderSquaresScreenshots, takeGameScreenshot} from './screenshot';
// import {Predictor} from './tensorflow';

// const {writeFile} = promises;

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// async function saveCoordinateImage(): Promise<void> {
//   const img = await takeGameScreenshot(true);
//   await writeFile(join('./images/map', `${Date.now()}.png`), img);
// }

// async function saveBorderSquareImages(): Promise<void> {
//   const imgs = await takeBorderSquaresScreenshots();
//   await Promise.all(
//     imgs.map(async (img, i) =>
//       writeFile(join('./images/soleil', `${Date.now()}_${i}.png`), img.data)
//     )
//   );
//   console.log('Soleil');
// }

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// async function searchForSoleil(predictor: Predictor): Promise<void> {
//   const borderSquares = await takeBorderSquaresScreenshots();
//   const predictions = await Promise.all(
//     borderSquares.map(async borderSquare => {
//       const prediction = await predictor(borderSquare.data);
//       return {...prediction, ...borderSquare.coordinates};
//     })
//   );
//   const soleils = predictions.filter(p => p.label === 'OK');
//   const notSoleils = predictions.filter(p => p.label !== 'OK');
//   console.log(soleils);
//   console.log(notSoleils.sort((s1, s2) => s1.score - s2.score).slice(0, 10));
// }

// export function startScreenshotTaker(predictor: Predictor): void {
//   try {
//     mkdirSync('./images/map', {recursive: true});
//     mkdirSync('./images/soleil', {recursive: true});
//   } catch {
//     // Already there
//   }

//   const gk = new GK();
//   gk.start();
//   gk.on('press', data => {
//     (async () => {
//       if (data.data === '<Space>') {
//         // saveCoordinateImage().catch(handleError);
//         saveBorderSquareImages().catch(handleError);
//         // searchForSoleil(predictor).catch(handleError);
//       }
//       if (['<Left>', '<Right>', '<Up>', '<Down>'].includes(data.data)) {
//         const borderSquares = await takeBorderSquaresScreenshots();
//         // console.log(borderSquares)
//         const squaresToScan = borderSquares.filter(square => {
//           const {x, y} = square.coordinates;
//           const isLeft = x === 0;
//           const isRight = x === 13;
//           const isTop = y === 0;
//           const isBottom = y === 15;
//           return (
//             (isLeft && data.data === '<Left>') ||
//             (isRight && data.data === '<Right>') ||
//             (isTop && data.data === '<Up>') ||
//             (isBottom && data.data === '<Down>')
//           );
//         });
//         const predictions = await Promise.all(
//           squaresToScan.map(async borderSquare => {
//             const prediction = await predictor(borderSquare.data);
//             return {...prediction, ...borderSquare.coordinates};
//           })
//         );
//         const best = predictions.sort((p1, p2) => p1.score - p2.score)[0]!;
//         // console.log(best, predictions)
//         const soleilCoordinates = {
//           x: gameCoordinates.x + ((best.x + 0.5) * SQUARE_SIZE.width) / 2,
//           y: gameCoordinates.y + ((best.y + 0.5) * SQUARE_SIZE.height) / 2,
//         };
//         console.log(best);
//         console.log(soleilCoordinates);

//         moveMouseSmooth(soleilCoordinates.x, soleilCoordinates.y);
//         mouseClick();

//         const soleils = predictions.filter(p => p.label === 'OK');
//         const notSoleils = predictions.filter(p => p.label !== 'OK');
//         console.log(soleils);
//         console.log(notSoleils.sort((s1, s2) => s1.score - s2.score).slice(0, 10));
//       }
//       if (['<Enter>'].includes(data.data)) {
//         const borderSquares = await takeBorderSquaresScreenshots();
//         const predictions = await Promise.all(
//           borderSquares.map(async borderSquare => {
//             const prediction = await predictor(borderSquare.data);
//             return {...prediction, ...borderSquare.coordinates};
//           })
//         );
//         console.log(predictions.sort((p1, p2) => p1.score - p2.score));
//       }
//       // console.log(data.data);
//     })().catch(console.error);
//   });
//   gk.on('error', error => {
//     console.error(error);
//   });
//   gk.on('close', () => {
//     console.log('closed');
//   });

//   setInterval(() => {}, 1000);
// }
