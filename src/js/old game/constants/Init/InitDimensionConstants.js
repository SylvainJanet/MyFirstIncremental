var INCREMENT_DIMENSION_NBR_ON_CREATION = 1, INIT_DIMENSION_NBR = 0;
var InitDimensionConstants = (function () {
    function InitDimensionConstants() {
    }
    Object.defineProperty(InitDimensionConstants, "INIT_DIMENSION_NBR", {
        get: function () {
            return INIT_DIMENSION_NBR;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InitDimensionConstants, "INCREMENT_DIMENSION_NBR_ON_CREATION", {
        get: function () {
            return INCREMENT_DIMENSION_NBR_ON_CREATION;
        },
        enumerable: false,
        configurable: true
    });
    return InitDimensionConstants;
}());
export { InitDimensionConstants };
