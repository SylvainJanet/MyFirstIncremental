"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameData = void 0;
var Dimension_js_1 = require("./Dimension.js");
var DimensionFormulas_js_1 = require("../constants/Formulas/DimensionFormulas.js");
var InitGameConstants_js_1 = require("../constants/Init/InitGameConstants.js");
var UserUpdate_js_1 = require("../listener/UserUpdate.js");
var GameData = (function () {
    function GameData() {
        this.number = 0;
        this.lstDimension = [
            new Dimension_js_1.Dimension(this, InitGameConstants_js_1.InitGameConstants.FIRST_DIMENSION_PRICE, InitGameConstants_js_1.InitGameConstants.FIRST_DIMENSION_EFFECT)
        ];
        this.nextDimension = new Dimension_js_1.Dimension(this, GameData.computeNextPrice(InitGameConstants_js_1.InitGameConstants.FIRST_DIMENSION_PRICE), GameData.computeNextEffect(InitGameConstants_js_1.InitGameConstants.FIRST_DIMENSION_EFFECT));
    }
    GameData.computeNextPrice = function (price) {
        return DimensionFormulas_js_1.DimensionFormulas.nextPrice(price);
    };
    GameData.computeNextEffect = function (effect) {
        return DimensionFormulas_js_1.DimensionFormulas.nextEffect(effect);
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
                UserUpdate_js_1.UserUpdate.update();
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
        this.nextDimension = new Dimension_js_1.Dimension(this, DimensionFormulas_js_1.DimensionFormulas.nextPrice(this.nextDimension.price), DimensionFormulas_js_1.DimensionFormulas.nextEffect(this.nextDimension.effect));
    };
    return GameData;
}());
exports.GameData = GameData;
