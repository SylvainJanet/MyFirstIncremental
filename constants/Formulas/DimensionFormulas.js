const EFFECT_MULT = 300,
  PRICE_MULT = 2;

export class DimensionFormulas {

  static nextPrice (price) {

    return price * PRICE_MULT;

  }

  static nextEffect (effect) {

    return effect * EFFECT_MULT;

  }

}
