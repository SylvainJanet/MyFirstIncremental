"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dimension = void 0;
var InitDimensionConstants_js_1 = require("../constants/Init/InitDimensionConstants.js");
var UserUpdate_js_1 = require("../listener/UserUpdate.js");
var Dimension = (function () {
    function Dimension(game, price, effect) {
        this.game = game;
        this.nbr = Dimension.nbrDimensions +
            InitDimensionConstants_js_1.InitDimensionConstants.INCREMENT_DIMENSION_NBR_ON_CREATION;
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
            UserUpdate_js_1.UserUpdate.update();
        });
        return pResult;
    };
    Dimension.nbrDimensions = InitDimensionConstants_js_1.InitDimensionConstants.INIT_DIMENSION_NBR;
    return Dimension;
}());
exports.Dimension = Dimension;
