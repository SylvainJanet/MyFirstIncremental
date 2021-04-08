import {DimensionEffect} from "../../classes/Dimension";

const PRICE_MULT = 2,
  QTYGENERATEDPERTICK_MULT = 2;


export class DimensionFormulas {

  static nextPrice (price: number) {

    return price * PRICE_MULT;

  }

  static nextEffect (effect: DimensionEffect, dimensionNbr: number) {

    // eslint-disable-next-line no-magic-numbers
    if (dimensionNbr > 1) {

      return effect;

    }

    return DimensionEffect.PreviousDimension;

  }

  static nextQtyPGeneratedPerTick (qtyGeneratedPerTick: number): number {

    return qtyGeneratedPerTick * QTYGENERATEDPERTICK_MULT;

  }

}
