var _a, _b;
import { ErrorCode } from "./exceptions/errorCode";
import { ErrorCustom } from "./exceptions/errorCustom.js";
import { ErrorMessages } from "./exceptions/errorMessages";
import { ErrorType } from "./exceptions/errorType.js";
import { GameData } from "./classes/GameData.js";
import { Generator } from "./classes/Generator";
import { InitGeneratorConstants } from "./constants/Init/InitGeneratorConstants";
import { Log } from "./log/config.js";
import { TypeHelper } from "./helpers/TypeHelper.js";
import { UserUpdate } from "./listener/UserUpdate";
var game = new GameData();
function displayDimensions() {
    var divDims = document.getElementById("dimensions");
    if (divDims !== null) {
        divDims.innerHTML = "";
        game.lstDimension.forEach(function (dim) {
            divDims.appendChild(dim.getDisplayNode());
        });
        divDims.appendChild(game.getNextDimensionNode());
    }
}
function displayNumber() {
    var pNumber = document.getElementById("number");
    if (pNumber !== null) {
        pNumber.innerText = Math.floor(game.number).toString();
    }
}
function displayNbrDimension() {
    var sNbrDim = document.getElementById("nbrGenerators");
    if (sNbrDim !== null) {
        sNbrDim.innerText = game.lstGenerator.length.toString();
    }
}
window.onload = function () {
    displayDimensions();
    displayNumber();
    displayNbrDimension();
};
document.addEventListener("updateEvent", function () {
    displayDimensions();
    displayNumber();
    displayNbrDimension();
});
(_a = document.getElementById("buttontest")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", function () {
    throw new ErrorCustom(ErrorType.CustomType, ErrorCode.CUSTOM_CODE, ErrorMessages.CUSTOM_MESSAGE);
});
(_b = document.getElementById("testgenerators")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", function () {
    game.lstGenerator.push(new Generator(game, InitGeneratorConstants.NBR_PER_SEC));
    UserUpdate.update();
});
setInterval(function () {
    game.lstGenerator.forEach(function (generator) {
        game.number += generator.nbrPerTick;
    });
    UserUpdate.update();
}, game.tickLength);
window.onerror = function (_message, _source, _lineno, _colno, error) {
    if (TypeHelper.isErrorCustom(error)) {
        var errorCustom = error;
        Log.error(ErrorCustom.getLogErrorMessage(errorCustom), errorCustom);
        return true;
    }
    console.log("erreur non capturée");
    return false;
};
