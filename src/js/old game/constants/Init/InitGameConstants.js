var FIRST_DIMENSION_EFFECT = 1, FIRST_DIMENSION_PRICE = 1, TICK_LENGTH = 5;
var InitGameConstants = (function () {
    function InitGameConstants() {
    }
    Object.defineProperty(InitGameConstants, "FIRST_DIMENSION_PRICE", {
        get: function () {
            return FIRST_DIMENSION_PRICE;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InitGameConstants, "FIRST_DIMENSION_EFFECT", {
        get: function () {
            return FIRST_DIMENSION_EFFECT;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InitGameConstants, "TICK_LENGTH", {
        get: function () {
            return TICK_LENGTH;
        },
        enumerable: false,
        configurable: true
    });
    return InitGameConstants;
}());
export { InitGameConstants };
