import {Coordinate} from '../../common/src/coordinates';
import {CoordinateData, FishData, SoleilData} from '../../common/src/model';
import {MapCoordinate} from './fight';
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
    private readonly characterModel: Predictor,
    private readonly characterFishingModel: Predictor
  ) {}

  public async getData(): Promise<Data> {
    return this.refresh();
  }

  public async hasFishPopup(popupCoordinate: Coordinate): Promise<boolean> {
    const popupImg = fishingPopupScreenshot(popupCoordinate);
    const prediction = await this.fishPopupModel(popupImg);
    return prediction.score >= 0.98 && prediction.label === 'OK';
  }

  public async findPlayer(): Promise<{coordinates: MapCoordinate; isFishing: boolean} | undefined> {
    const {characterSquares} = screenshot();
    const [character] = (
      await Promise.all(
        characterSquares.map(async square => ({
          ...square,
          ...(await this.characterModel(square.image)),
        }))
      )
    )
      .filter(p => p.label === 'yes' && p.score >= 0.95)
      .sort((p1, p2) => p2.score - p1.score);

    if (character === undefined) {
      return undefined;
    }

    const isFishingPrediction = await this.characterFishingModel(character.image);
    const isFishing = isFishingPrediction.label === 'fishing';
    return {coordinates: character.coordinate as MapCoordinate, isFishing};
  }

  public async checkPlayerIsFishing(coordinate: MapCoordinate): Promise<boolean> {
    const {characterSquares} = screenshot();
    const characterImage = characterSquares.find(
      s => s.coordinate.x === coordinate.x && s.coordinate.y === coordinate.y
    );
    if (characterImage === undefined) {
      throw new Error(`Unknown coordinates ${coordinate.x};${coordinate.y}`);
    }
    const isFishingPrediction = await this.characterFishingModel(characterImage.image);
    const isFishing = isFishingPrediction.label === 'fishing';
    return isFishing;
  }

  public async refresh(): Promise<Data> {
    const {game} = screenshot();
    const mapPrediction = await this.mapModel(game);
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
