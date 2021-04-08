import {Dimension} from "./Dimension";
import {InitGameConstants} from "./../constants/init/InitGameConstants";

export class GameData {

  number: number;

  tickLength: number;

  lstDimension: Dimension[];

  constructor () {

    this.number = InitGameConstants.INIT_NUMBER;
    this.tickLength = InitGameConstants.TICK_LENGTH;
    this.lstDimension = [
      new Dimension(
        this,
        InitGameConstants.FIRST_DIMENSION_NUMBER,
        InitGameConstants.FIRST_DIMENSION_QTY,
        InitGameConstants.FIRST_DIMENSION_PRICE,
        InitGameConstants.FIRST_DIMENSION_EFFECT,
        InitGameConstants.FIRST_DIMENSION_QTYGENERATEDPERTICK
      )
    ];

  }

  addDimension () {

    // eslint-disable-next-line no-magic-numbers
    const lastDimension: Dimension = this.lstDimension[this.lstDimension.length - 1] as Dimension;
    this.lstDimension.push(Dimension.nextDimension(lastDimension));

  }

  /*
   *
   *Static computeNextPrice (price: number) {
   *
   *  return DimensionFormulas.nextPrice(price);
   *
   *}
   *
   *static computeNextEffect (effect: number) {
   *
   *  return DimensionFormulas.nextEffect(effect);
   *
   *}
   *
   *getNextDimensionNode () {
   *
   *  const pResult = document.createElement("button");
   *  pResult.innerText = `${`Dimension
   *    ${this.nextDimension.nbr.toString()}` +
   *    " (cost : "}${this.nextDimension.price.toString()})`;
   *  if (this.number < this.nextDimension.price) {
   *
   *    pResult.setAttribute(
   *      "disabled",
   *      "true"
   *    );
   *
   *  }
   *  pResult.addEventListener(
   *    "click",
   *    () => {
   *
   *      if (this.number >= this.nextDimension.price) {
   *
   *        this.number -= this.nextDimension.price;
   *        this.addDimension();
   *        UserUpdate.update();
   *
   *      }
   *
   *    }
   *  );
   *  document.addEventListener(
   *    "updateEvent",
   *    () => {
   *
   *      if (this.number < this.nextDimension.price) {
   *
   *        pResult.setAttribute(
   *          "disabled",
   *          "true"
   *        );
   *
   *      }
   *
   *    }
   *  );
   *  return pResult;
   *
   *}
   */


}
