import {Coordinate} from '../../common/src/coordinates';
import {CoordinateData, FishData, SoleilData} from '../../common/src/model';
import {fishDb} from './fish_db';
import {fishingPopupScreenshot, RgbImage, screenshot} from './screenshot';
import {Predictor} from './tensorflow';

export interface Data {
  screenshot: RgbImage;
  soleil: SoleilData;
  coordinate: CoordinateData;
  fish: FishData;
}

export class Intelligence {
  private readonly lastData: Data | undefined;

  public constructor(
    private readonly soleilModel: Predictor,
    private readonly mapModel: Predictor,
    private readonly fishPopupModel: Predictor
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
    const {game, border} = screenshot();
    const [mapPrediction, soleil] = await Promise.all([
      this.mapModel(game),
      await Promise.all(
        border.map(async square => {
          const soleilPrediction = await this.soleilModel(square.image);
          return {...square.coordinate, ...soleilPrediction};
        })
      ),
    ]);
    const [x = '', y = ''] = mapPrediction.label.split('h')!;
    const coordinate = {...mapPrediction, coordinate: {x: parseFloat(x), y: parseFloat(y)}};
    const fish = fishDb.get(coordinate.coordinate);

    return {
      screenshot: game,
      coordinate,
      fish,
      soleil,
    };
  }
}
