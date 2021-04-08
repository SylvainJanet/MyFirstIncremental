import { DimensionEffect } from "../../classes/Dimension";
var PRICE_MULT = 2, QTYGENERATEDPERTICK_MULT = 2;
var DimensionFormulas = (function () {
    function DimensionFormulas() {
    }
    DimensionFormulas.nextPrice = function (price) {
        return price * PRICE_MULT;
    };
    DimensionFormulas.nextEffect = function (effect, dimensionNbr) {
        if (dimensionNbr > 1) {
            return effect;
        }
        return DimensionEffect.PreviousDimension;
    };
    DimensionFormulas.nextQtyPGeneratedPerTick = function (qtyGeneratedPerTick) {
        return qtyGeneratedPerTick * QTYGENERATEDPERTICK_MULT;
    };
    return DimensionFormulas;
}());
export { DimensionFormulas };
