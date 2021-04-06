var _a;
import { ErrorCustom } from "./exceptions/errorCustom.js";
import { ErrorType } from "./exceptions/errorType.js";
import { GameData } from "./classes/GameData.js";
import { TypeHelper } from "./helpers/TypeHelper.js";
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
        pNumber.innerText = game.number.toString();
    }
}
window.onload = function () {
    displayDimensions();
    displayNumber();
};
document.addEventListener("updateEvent", function () {
    displayDimensions();
    displayNumber();
});
(_a = document.getElementById("buttontest")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", function () {
    throw new ErrorCustom(ErrorType.CustomType, 5, "testErrorMessage");
});
window.onerror = function (_message, _source, _lineno, _colno, error) {
    console.log("test erreur");
    if (TypeHelper.isErrorCustom(error)) {
        console.log("Erreur capturée");
        var errorCustom = error;
        console.log("message : " + errorCustom.message);
        console.log("code : " + errorCustom.code);
        console.log("type : " + errorCustom.type);
        return true;
    }
    console.log("erreur non capturée");
    return false;
};
