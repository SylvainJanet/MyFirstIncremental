import { DimensionEffect } from "../../classes/Dimension";

export const DimensionFormulas = {
  PRICE_MULT: 2,
  QTYGENERATEDPERTICK_MULT: 2,

  nextEffect(effect: DimensionEffect, dimensionNbr: number): DimensionEffect {
    if (dimensionNbr > 1) {
      return effect;
    }

    return DimensionEffect.PreviousDimension;
  },

  nextPrice(price: number): number {
    return price * DimensionFormulas.PRICE_MULT;
  },

  nextQtyPGeneratedPerTick(qtyGeneratedPerTick: number): number {
    return qtyGeneratedPerTick * DimensionFormulas.QTYGENERATEDPERTICK_MULT;
  },
};
