import {DimensionFormulas} from "./../constants/Formulas/DimensionFormulas";
import {GameData} from "./GameData";
import {InitDimensionConstants} from "./../constants/init/InitDimensionConstants";

export enum DimensionEffect {
  Number,
  PreviousDimension
}

export class Dimension {

  game: GameData;

  dimensionNbr: number;

  qty: number;

  price: number;

  effect: DimensionEffect;

  qtyGeneratedPerTick: number;

  // eslint-disable-next-line max-params
  constructor (game: GameData, dimensionNbr: number, qty:number, price:number, effect:DimensionEffect, qtyGeneratedPerTick: number) {

    this.game = game;
    this.dimensionNbr = dimensionNbr;
    this.qty = qty;
    this.price = price;
    this.effect = effect;
    this.qtyGeneratedPerTick = qtyGeneratedPerTick;

  }

  static nextDimension (dimension: Dimension): Dimension {

    return new Dimension(
      dimension.game,
      // eslint-disable-next-line no-magic-numbers
      dimension.dimensionNbr + 1,
      InitDimensionConstants.INIT_QTY_ON_CREATION,
      DimensionFormulas.nextPrice(dimension.price),
      DimensionFormulas.nextEffect(
        dimension.effect,
        dimension.dimensionNbr
      ),
      DimensionFormulas.nextQtyPGeneratedPerTick(dimension.qtyGeneratedPerTick)

    );

  }

}
