import {Coordinate} from '../../common/src/coordinates';
import {CoordinateData, FishData, SoleilData} from '../../common/src/model';
import {fishDb} from './fish_db';
import {fishingPopupScreenshot, RgbImage, screenshot} from './screenshot';
import {soleilDb} from './soleil_db';
import {Predictor} from './tensorflow';

export interface Data {
  screenshot: RgbImage;
  coordinate: CoordinateData;
  soleil: SoleilData;
  fish: FishData;
}

export class Intelligence {
  private readonly lastData: Data | undefined;

  public constructor(
    private readonly mapModel: Predictor,
    private readonly fishPopupModel: Predictor,
    private readonly characterModel: Predictor
  ) {}

  public async getData(): Promise<Data> {
    return this.refresh();
  }

  public async hasFishPopup(popupCoordinate: Coordinate): Promise<boolean> {
    const popupImg = fishingPopupScreenshot(popupCoordinate);
    const prediction = await this.fishPopupModel(popupImg);
    return prediction.score >= 0.98 && prediction.label === 'OK';
  }

  public async refresh(): Promise<Data> {
    const {game, characterSquares} = screenshot();
    const mapPrediction = await this.mapModel(game);
    const characterPredictions = await Promise.all(
      characterSquares.map(async square => ({
        coordinate: square.coordinate,
        prediction: await this.characterModel(square.image),
      }))
    );
    console.log(
      characterPredictions.filter(
        ({prediction}) => prediction.label === 'yes' || prediction.score < 0.9
      )
    );
    const [x = '', y = ''] = mapPrediction.label.split('h')!;
    const coordinate = {...mapPrediction, coordinate: {x: parseFloat(x), y: parseFloat(y)}};
    const soleil = soleilDb.get(coordinate.coordinate);
    const fish = fishDb.get(coordinate.coordinate);

    return {
      screenshot: game,
      coordinate,
      fish,
      soleil,
    };
  }
}
