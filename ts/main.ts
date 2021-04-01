import {Dimension} from "./classes/Dimension.js";
import {GameData} from "./classes/GameData.js";


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
