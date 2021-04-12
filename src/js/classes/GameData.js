import { Dimension } from "./Dimension";
import { InitGameConstants } from "./../constants/init/InitGameConstants";
var GameData = (function () {
    function GameData() {
        this.number = InitGameConstants.INIT_NUMBER;
        this.tickLength = InitGameConstants.TICK_LENGTH;
        this.lstDimension = [
            new Dimension(this, InitGameConstants.FIRST_DIMENSION_NUMBER, InitGameConstants.FIRST_DIMENSION_QTY, InitGameConstants.FIRST_DIMENSION_PRICE, InitGameConstants.FIRST_DIMENSION_EFFECT, InitGameConstants.FIRST_DIMENSION_QTYGENERATEDPERTICK),
        ];
    }
    GameData.prototype.addDimension = function () {
        var lastDimension = this.lstDimension[this.lstDimension.length - 1];
        this.lstDimension.push(Dimension.nextDimension(lastDimension));
    };
    return GameData;
}());
export { GameData };
