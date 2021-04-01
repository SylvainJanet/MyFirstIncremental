const EFFECT_MULT = 300,
  PRICE_MULT = 2;

export class DimensionFormulas {

  static nextPrice (price: number) {

    return price * PRICE_MULT;

  }

  static nextEffect (effect: number) {

    return effect * EFFECT_MULT;

  }

}
