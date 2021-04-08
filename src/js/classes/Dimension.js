import { DimensionFormulas } from "./../constants/Formulas/DimensionFormulas";
import { InitDimensionConstants } from "./../constants/init/InitDimensionConstants";
export var DimensionEffect;
(function (DimensionEffect) {
    DimensionEffect[DimensionEffect["Number"] = 0] = "Number";
    DimensionEffect[DimensionEffect["PreviousDimension"] = 1] = "PreviousDimension";
})(DimensionEffect || (DimensionEffect = {}));
var Dimension = (function () {
    function Dimension(game, dimensionNbr, qty, price, effect, qtyGeneratedPerTick) {
        this.game = game;
        this.dimensionNbr = dimensionNbr;
        this.qty = qty;
        this.price = price;
        this.effect = effect;
        this.qtyGeneratedPerTick = qtyGeneratedPerTick;
    }
    Dimension.nextDimension = function (dimension) {
        return new Dimension(dimension.game, dimension.dimensionNbr + 1, InitDimensionConstants.INIT_QTY_ON_CREATION, DimensionFormulas.nextPrice(dimension.price), DimensionFormulas.nextEffect(dimension.effect, dimension.dimensionNbr), DimensionFormulas.nextQtyPGeneratedPerTick(dimension.qtyGeneratedPerTick));
    };
    return Dimension;
}());
export { Dimension };
