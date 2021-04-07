import {Dimension} from "./classes/Dimension.js";
import {ErrorCode} from "./exceptions/errorCode";
import {ErrorCustom} from "./exceptions/errorCustom.js";
import {ErrorMessages} from "./exceptions/errorMessages";
import {ErrorType} from "./exceptions/errorType.js";
import {GameData} from "./classes/GameData.js";
import {Generator} from "./classes/Generator";
import {InitGeneratorConstants} from "./constants/Init/InitGeneratorConstants";
import {Log} from "./log/config.js";
// Import {LogLevel} from "typescript-logging";
import {TypeHelper} from "./helpers/TypeHelper.js";
import {UserUpdate} from "./listener/UserUpdate";

const game = new GameData();

function displayDimensions () {

  const divDims = document.getElementById("dimensions");

  if (divDims !== null) {

    divDims.innerHTML = "";

    game.lstDimension.forEach((dim: Dimension) => {

      divDims.appendChild(dim.getDisplayNode());

    });

    divDims.appendChild(game.getNextDimensionNode());

  }

}

function displayNumber () {

  const pNumber = document.getElementById("number");
  if (pNumber !== null) {

    pNumber.innerText = Math.floor(game.number).toString();

  }

}

function displayNbrDimension () {

  const sNbrDim = document.getElementById("nbrGenerators");
  if (sNbrDim !== null) {

    sNbrDim.innerText = game.lstGenerator.length.toString();

  }

}

window.onload = () => {

  displayDimensions();
  displayNumber();
  displayNbrDimension();

};

document.addEventListener(
  "updateEvent",
  () => {

    displayDimensions();
    displayNumber();
    displayNbrDimension();

  }
);


document.getElementById("buttontest")?.addEventListener(
  "click",
  () => {

    throw new ErrorCustom(
      ErrorType.CustomType,
      ErrorCode.CUSTOM_CODE,
      ErrorMessages.CUSTOM_MESSAGE
    );

  }
);

document.getElementById("testgenerators")?.addEventListener(
  "click",
  () => {

    game.lstGenerator.push(new Generator(
      game,
      InitGeneratorConstants.NBR_PER_SEC
    ));
    UserUpdate.update();

  }
);

// Const mainGameLoop =
setInterval(
  () => {

    game.lstGenerator.forEach((generator: Generator) => {

      game.number += generator.nbrPerTick;

    });

    UserUpdate.update();

  }
  , game.tickLength
);


// eslint-disable-next-line max-params
window.onerror = (_message, _source, _lineno, _colno, error) => {

  if (TypeHelper.isErrorCustom(error)) {

    const errorCustom = (error as unknown) as ErrorCustom;

    Log.error(
      ErrorCustom.getLogErrorMessage(errorCustom),
      errorCustom
    );

    return true;

  }

  console.log("erreur non capturée");
  return false;

};
