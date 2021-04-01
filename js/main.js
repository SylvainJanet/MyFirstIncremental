import { GameData } from "./classes/GameData.js";
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
