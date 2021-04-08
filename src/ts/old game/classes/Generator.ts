import {GameData} from "./GameData";

const msPerSec = 1000;

export class Generator {

  game: GameData;

  nbrPerSec: number;

  nbrPerTick: number;

  constructor (game: GameData, nbrPerSec: number) {

    this.game = game;
    this.nbrPerSec = nbrPerSec;
    this.nbrPerTick = nbrPerSec * game.tickLength / msPerSec;

  }

}
