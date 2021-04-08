import { InitDimensionConstants } from "../constants/Init/InitDimensionConstants.js";
import { UserUpdate } from "../../events/emitters/UserUpdate.js";
var Dimension = (function () {
    function Dimension(game, price, effect) {
        this.game = game;
        this.nbr = Dimension.nbrDimensions +
            InitDimensionConstants.INCREMENT_DIMENSION_NBR_ON_CREATION;
        this.price = price;
        this.effect = effect;
        Dimension.nbrDimensions += 1;
    }
    Dimension.prototype.getDisplayNode = function () {
        var _this = this;
        var pResult = document.createElement("button");
        pResult.innerText = "Dimension " + this.nbr.toString();
        pResult.addEventListener("click", function () {
            _this.game.number += _this.effect;
            UserUpdate.update();
        });
        return pResult;
    };
    Dimension.nbrDimensions = InitDimensionConstants.INIT_DIMENSION_NBR;
    return Dimension;
}());
export { Dimension };