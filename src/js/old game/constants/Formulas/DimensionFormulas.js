var EFFECT_MULT = 2, PRICE_MULT = 2;
var DimensionFormulas = (function () {
    function DimensionFormulas() {
    }
    DimensionFormulas.nextPrice = function (price) {
        return price * PRICE_MULT;
    };
    DimensionFormulas.nextEffect = function (effect) {
        return effect * EFFECT_MULT;
    };
    return DimensionFormulas;
}());
export { DimensionFormulas };
