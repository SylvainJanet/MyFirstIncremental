import { DimensionFormulas } from "./../constants/Formulas/DimensionFormulas";
import { GameData } from "./GameData";
import { InitDimensionConstants } from "./../constants/init/InitDimensionConstants";

export enum DimensionEffect {
  Number = "Number",
  PreviousDimension = "PreviousDimension",
}

export class Dimension {
  public game: GameData;

  public dimensionNbr: number;

  public qty: number;

  public price: number;

  public effect: DimensionEffect;

  public qtyGeneratedPerTick: number;

  // // eslint-disable-next-line max-params
  public constructor(game: GameData, dimensionNbr: number, qty: number, price: number, effect: DimensionEffect, qtyGeneratedPerTick: number) {
    this.game = game;
    this.dimensionNbr = dimensionNbr;
    this.qty = qty;
    this.price = price;
    this.effect = effect;
    this.qtyGeneratedPerTick = qtyGeneratedPerTick;
  }

  public static nextDimension(dimension: Dimension): Dimension {
    return new Dimension(
      dimension.game,
      // // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      dimension.dimensionNbr + 1,
      InitDimensionConstants.INIT_QTY_ON_CREATION,
      DimensionFormulas.nextPrice(dimension.price),
      DimensionFormulas.nextEffect(dimension.effect, dimension.dimensionNbr),
      DimensionFormulas.nextQtyPGeneratedPerTick(dimension.qtyGeneratedPerTick)
    );
  }

  public static getdefaultDimension(): Dimension {
    // // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    return new Dimension(GameData.getDefaultGameData(), -1, -1, -1, DimensionEffect.Number, -1);
  }
}
