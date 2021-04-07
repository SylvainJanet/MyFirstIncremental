import { Dimension } from "./Dimension.js";
import { DimensionFormulas } from "../constants/Formulas/DimensionFormulas.js";
import { InitGameConstants } from "../constants/Init/InitGameConstants.js";
import { UserUpdate } from "../listener/UserUpdate.js";
var GameData = (function () {
    function GameData() {
        this.number = 0;
        this.lstDimension = [
            new Dimension(this, InitGameConstants.FIRST_DIMENSION_PRICE, InitGameConstants.FIRST_DIMENSION_EFFECT)
        ];
        this.lstGenerator = [];
        this.tickLength = InitGameConstants.TICK_LENGTH;
        this.nextDimension = new Dimension(this, GameData.computeNextPrice(InitGameConstants.FIRST_DIMENSION_PRICE), GameData.computeNextEffect(InitGameConstants.FIRST_DIMENSION_EFFECT));
    }
    GameData.computeNextPrice = function (price) {
        return DimensionFormulas.nextPrice(price);
    };
    GameData.computeNextEffect = function (effect) {
        return DimensionFormulas.nextEffect(effect);
    };
    GameData.prototype.getNextDimensionNode = function () {
        var _this = this;
        var pResult = document.createElement("button");
        pResult.innerText = "" + ("Dimension\n      " + this.nextDimension.nbr.toString() +
            " (cost : ") + this.nextDimension.price.toString() + ")";
        if (this.number < this.nextDimension.price) {
            pResult.setAttribute("disabled", "true");
        }
        pResult.addEventListener("click", function () {
            if (_this.number >= _this.nextDimension.price) {
                _this.number -= _this.nextDimension.price;
                _this.addDimension();
                UserUpdate.update();
            }
        });
        document.addEventListener("updateEvent", function () {
            if (_this.number < _this.nextDimension.price) {
                pResult.setAttribute("disabled", "true");
            }
        });
        return pResult;
    };
    GameData.prototype.addDimension = function () {
        this.lstDimension.push(this.nextDimension);
        this.nextDimension = new Dimension(this, DimensionFormulas.nextPrice(this.nextDimension.price), DimensionFormulas.nextEffect(this.nextDimension.effect));
    };
    return GameData;
}());
export { GameData };
