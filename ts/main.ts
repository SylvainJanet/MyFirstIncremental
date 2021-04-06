import {Dimension} from "./classes/Dimension.js";
import {ErrorCustom} from "./exceptions/errorCustom.js";
import {ErrorType} from "./exceptions/errorType.js";
import {GameData} from "./classes/GameData.js";
import {TypeHelper} from "./helpers/TypeHelper.js";


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

    pNumber.innerText = game.number.toString();

  }

}

window.onload = () => {

  displayDimensions();
  displayNumber();

};

document.addEventListener(
  "updateEvent",
  () => {

    displayDimensions();
    displayNumber();

  }
);


document.getElementById("buttontest")?.addEventListener(
  "click",
  () => {

    throw new ErrorCustom(
      ErrorType.CustomType,
      // eslint-disable-next-line no-magic-numbers
      5,
      "testErrorMessage"
    );

  }
);


// eslint-disable-next-line max-params
window.onerror = (_message, _source, _lineno, _colno, error) => {

  console.log("test erreur");

  if (TypeHelper.isErrorCustom(error)) {

    console.log("Erreur capturée");

    const errorCustom = (error as unknown) as ErrorCustom;
    console.log(`message : ${errorCustom.message}`);
    console.log(`code : ${errorCustom.code}`);
    console.log(`type : ${errorCustom.type}`);
    return true;

  }

  console.log("erreur non capturée");
  return false;

};
