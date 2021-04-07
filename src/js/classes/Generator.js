var msPerSec = 1000;
var Generator = (function () {
    function Generator(game, nbrPerSec) {
        this.game = game;
        this.nbrPerSec = nbrPerSec;
        this.nbrPerTick = nbrPerSec * game.tickLength / msPerSec;
    }
    return Generator;
}());
export { Generator };
