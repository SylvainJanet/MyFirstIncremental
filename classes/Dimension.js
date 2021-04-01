import {InitDimensionConstants}
  from "../constants/Init/InitDimensionConstants.js";
import {UserUpdate} from "../listener/UserUpdate.js";

export class Dimension {

  constructor (game, price, effect) {

    this.game = game;
    this.nbr = Dimension.nbrDimensions +
      InitDimensionConstants.INCREMENT_DIMENSION_NBR_ON_CREATION;
    this.price = price;
    this.effect = effect;
    Dimension.nbrDimensions += 1;

  }

  static nbrDimensions = InitDimensionConstants.INIT_DIMENSION_NBR;

  getDisplayNode () {

    const pResult = document.createElement("button");
    pResult.innerText = `Dimension ${this.nbr.toString()}`;
    pResult.addEventListener(
      "click",
      () => {

        this.game.number += this.effect;
        UserUpdate.update();

      }
    );
    return pResult;

  }

}
