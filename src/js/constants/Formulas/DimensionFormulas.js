import { DimensionEffect } from "../../classes/Dimension";
export var DimensionFormulas = {
    PRICE_MULT: 2,
    QTYGENERATEDPERTICK_MULT: 2,
    nextEffect: function (effect, dimensionNbr) {
        if (dimensionNbr > 1) {
            return effect;
        }
        return DimensionEffect.PreviousDimension;
    },
    nextPrice: function (price) {
        return price * DimensionFormulas.PRICE_MULT;
    },
    nextQtyPGeneratedPerTick: function (qtyGeneratedPerTick) {
        return qtyGeneratedPerTick * DimensionFormulas.QTYGENERATEDPERTICK_MULT;
    },
};
