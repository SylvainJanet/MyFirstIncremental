/* eslint-disable multiline-comment-style */
/*
 * Import {Dimension} from "./classes/Dimension.js";
 * import {ErrorCode} from "./../exceptions/errorCode";
 * import {ErrorCustom} from "./../exceptions/errorCustom";
 * import {ErrorMessages} from "./../exceptions/errorMessages";
 * import {ErrorType} from "./../exceptions/errorType";
 * import {GameData} from "./classes/GameData.js";
 * import {Generator} from "./classes/Generator";
 * import {InitGeneratorConstants} from "./constants/Init/InitGeneratorConstants";
 * import {Log} from "./../log/config";
 * import {TypeHelper} from "./../helpers/TypeHelper";
 * import {UserUpdate} from "../events/emitters/UserUpdate.js";
 */

// Const game = new GameData();

// Function displayDimensions () {

//   Const divDims = document.getElementById("dimensions");

//   If (divDims !== null) {

//     DivDims.innerHTML = "";

//     Game.lstDimension.forEach((dim: Dimension) => {

//       DivDims.appendChild(dim.getDisplayNode());

//     });

//     DivDims.appendChild(game.getNextDimensionNode());

//   }

// }

// Function displayNumber () {

/*
 *   Const pNumber = document.getElementById("number");
 *   if (pNumber !== null) {
 */

//     PNumber.innerText = Math.floor(game.number).toString();

//   }

// }

// Function displayNbrDimension () {

/*
 *   Const sNbrDim = document.getElementById("nbrGenerators");
 *   if (sNbrDim !== null) {
 */

//     SNbrDim.innerText = game.lstGenerator.length.toString();

//   }

// }

// Window.onload = () => {

/*
 *   DisplayDimensions();
 *   displayNumber();
 *   displayNbrDimension();
 */

// };

/*
 * Document.addEventListener(
 *   "updateEvent",
 *   () => {
 */

/*
 *     DisplayDimensions();
 *     displayNumber();
 *     displayNbrDimension();
 */

/*
 *   }
 * );
 */


/*
 * Document.getElementById("buttontest")?.addEventListener(
 *   "click",
 *   () => {
 */

/*
 *     Throw new ErrorCustom(
 *       ErrorType.Test,
 *       ErrorCode.TEST,
 *       ErrorMessages.TEST
 *     );
 */

/*
 *   }
 * );
 */

/*
 * Document.getElementById("testgenerators")?.addEventListener(
 *   "click",
 *   () => {
 */

/*
 *     Game.lstGenerator.push(new Generator(
 *       game,
 *       InitGeneratorConstants.NBR_PER_SEC
 *     ));
 *     UserUpdate.update();
 */

/*
 *   }
 * );
 */

// // Const mainGameLoop =
// SetInterval(
//   () => {

//     Game.lstGenerator.forEach((generator: Generator) => {

//       Game.number += generator.nbrPerTick;

//     });

//     UserUpdate.update();

/*
 *   }
 *   , game.tickLength
 * );
 */


// // eslint-disable-next-line max-params
// Window.onerror = (_message, _source, _lineno, _colno, error) => {

//   If (TypeHelper.isErrorCustom(error)) {

//     Const errorCustom = (error as unknown) as ErrorCustom;

/*
 *     Log.error(
 *       ErrorCustom.getLogErrorMessage(errorCustom),
 *       errorCustom
 *     );
 */

//     Return true;

//   }

/*
 *   Console.log("erreur non capturée");
 *   return false;
 */

// };
