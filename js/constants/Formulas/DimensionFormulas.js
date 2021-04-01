"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DimensionFormulas = void 0;
var EFFECT_MULT = 300, PRICE_MULT = 2;
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
exports.DimensionFormulas = DimensionFormulas;
