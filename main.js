import {GameData} from "./classes/GameData.js";

const game = new GameData();

function displayDimensions () {

  const divDims = document.getElementById("dimensions");

  divDims.innerHTML = "";

  game.lstDimension.forEach((dim) => {

    divDims.appendChild(dim.getDisplayNode());

  });

  divDims.appendChild(game.getNextDimensionNode());

}

function displayNumber () {

  const pNumber = document.getElementById("number");
  pNumber.innerText = game.number;

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
