import {Dimension} from "./Dimension.js";
import {DimensionFormulas} from "../constants/Formulas/DimensionFormulas.js";
import {Generator} from "./Generator";
import {InitGameConstants} from "../constants/Init/InitGameConstants.js";
import {UserUpdate} from "../../events/emitters/UserUpdate.js";


export class GameData {

  number: number;

  lstDimension: Dimension[];

  nextDimension: Dimension;

  lstGenerator: Generator[];

  tickLength: number;

  constructor () {

    this.number = 0;
    this.lstDimension = [
      new Dimension(
        this,
        InitGameConstants.FIRST_DIMENSION_PRICE,
        InitGameConstants.FIRST_DIMENSION_EFFECT
      )
    ];
    this.lstGenerator = [];
    this.tickLength = InitGameConstants.TICK_LENGTH;

    this.nextDimension = new Dimension(
      this,
      GameData.computeNextPrice(InitGameConstants.FIRST_DIMENSION_PRICE),
      GameData.computeNextEffect(InitGameConstants.FIRST_DIMENSION_EFFECT)
    );

  }

  static computeNextPrice (price: number) {

    return DimensionFormulas.nextPrice(price);

  }

  static computeNextEffect (effect: number) {

    return DimensionFormulas.nextEffect(effect);

  }

  getNextDimensionNode () {

    const pResult = document.createElement("button");
    pResult.innerText = `${`Dimension
      ${this.nextDimension.nbr.toString()}` +
      " (cost : "}${this.nextDimension.price.toString()})`;
    if (this.number < this.nextDimension.price) {

      pResult.setAttribute(
        "disabled",
        "true"
      );

    }
    pResult.addEventListener(
      "click",
      () => {

        if (this.number >= this.nextDimension.price) {

          this.number -= this.nextDimension.price;
          this.addDimension();
          UserUpdate.update();

        }

      }
    );
    document.addEventListener(
      "updateEvent",
      () => {

        if (this.number < this.nextDimension.price) {

          pResult.setAttribute(
            "disabled",
            "true"
          );

        }

      }
    );
    return pResult;

  }

  addDimension () {

    this.lstDimension.push(this.nextDimension);
    this.nextDimension = new Dimension(
      this,
      DimensionFormulas.nextPrice(this.nextDimension.price),
      DimensionFormulas.nextEffect(this.nextDimension.effect)
    );

  }

}
