const Game = require('./game.js');

var game = new Game(4);



game.joinGame("Paul", "yellow", "N", false);
game.startGame();
game.selectRandomFirstPlayer();
game.chooseLeader("yellow", "Gleb");
game.selectSecretAgenda("yellow", "Esteemed");
game.placeInitialTroop("yellow", "Novgorod");
game.placeInitialTroop("yellow", "Novgorod");
game.placeInitialTroop("yellow", "Kiev");
game.placeLeader("yellow", "Kiev");
game.playAdvisor("yellow", "muster", 1);
game.playAdvisor("yellow", "attack", 2, 2);
game.playAdvisor("yellow", "build", 4);
game.playAdvisor("yellow", "scheme", 5);
var player = game.players.getCurrentPlayer();
var novgorod = game.gameMap.locationByName["Novgorod"];
var kiev = game.gameMap.locationByName["Kiev"];
var auctionBoard = game.auctionBoard;
var muster1 = game.auctionBoard.board["muster"][0];
console.log(JSON.stringify(game, null, 2));
console.log(player);
console.log(novgorod);
console.log(kiev);
console.log(auctionBoard);
console.log(muster1);




/*

// x- player
// x- leaders
// x - player supply
// x - rebels
// x - scheme cards
// x - boats
// claim board

// ai cards
// ai boats
// intrigue cards
// inheritence cards
// epic buildings
// 




// players, name, isAi, color, aiCards, startingStrategy, leader, advisors
var players = [];
addPlayer(players, "Paul", false, "red", [], "", "Boris", advisorsByRound[0]);
addPlayer(players, "", true, "blue", aiCards, ["attack-move", "random", "attack-move", "random"], "Maria", advisorsByRound[0]);
addPlayer(players, "", true, "white", aiCards, ["build","random","build","random"], "Sviatopolk", advisorsByRound[0]);
addPlayer(players, "", true, "yellow", aiCards, ["tax","random","tax","random"], "Yaroslav", advisorsByRound[0]);

strategies = [ "attack-move", "build", "tax"];
actions = [ "Muster", "Move", "Attack", "Tax", "Build", "Scheme" ];

var aiCards = [];
var currentRound = 0;

function load() {    
    console.log("load()");

    var divCheckboxPlayers = document.getElementById("divCheckboxPlayers");
    for (var i=0; i < players.length; i++) {
        if (players[i].isAi) {
            var checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.name = "checkboxPlayer" + i;
            checkbox.value = i;
            checkbox.id = "checkboxPlayer" + i;

            var label = document.createElement('label');
            label.htmlFor = checkbox.id;
            var leader = players[i].leader + " (" + players[i].color + ")";
            label.appendChild(document.createTextNode(leader));
            divCheckboxPlayers.appendChild(checkbox);
            divCheckboxPlayers.appendChild(label);
            divCheckboxPlayers.appendChild(document.createElement('br'));
        }
    }
}


function setupAiPlayers(players) {
    var aiPlayers = [];
    var selectPlayer = document.getElementById("selectPlayer");
    selectPlayer.innerHTML = "";
    var option = document.createElement('option');
    option.setAttribute('value', -1);
    selectPlayer.appendChild(option);
    for (var i=0; i < players.length; i++) {
      var playerIsChecked = false;
      if (i == 0) {
          playerIsChecked = true;
      }
      var checkbox = document.getElementById("checkboxPlayer" + i);
      if (checkbox && checkbox.checked) {
          playerIsChecked = true;
      }
      
      if (playerIsChecked) {
          option = document.createElement('option');
          option.setAttribute('value', i);
          var playerText = players[i].leader + " (" + players[i].color + ")"
          if (players[i].name.length > 0) {
              playerText = players[i].name + " - " + playerText;
          }
          option.appendChild(document.createTextNode(playerText));
          selectPlayer.appendChild(option);
          if (players[i].isAi) {
              aiPlayers.push(players[i]);
          }
      }
    }
    numberOfAiPlayers = aiPlayers.length;
    numberOfPlayers = numberOfAiPlayers + numberOfHumanPlayers;
    
    
    if (numberOfPlayers == 2) {
        advisorsByRound[3] = [1, 2, 4, 5, 2, 3];
        regions = twoPlayerRegions;
    } else if (numberOfPlayers == 3) {
        advisorsByRound[3] = [1, 2, 4, 5, 2, 3];
        regions = threePlayerRegions;
    } else {
        advisorsByRound[3] = [1, 2, 4, 5, 2];
        regions = fourPlayerRegions;
    }

    addAiCard1(aiCards, regions);
    addAiCard2(aiCards, regions);
    addAiCard3(aiCards, regions);
    addAiCard4(aiCards, regions);
    addAiCard5(aiCards, regions);
    addAiCard6(aiCards, regions);
    addAiCard7(aiCards, regions);
    addAiCard8(aiCards, regions);
    addAiCard9(aiCards, regions);
    addAiCard10(aiCards, regions);
    addAiCard11(aiCards, regions);
    addAiCard12(aiCards, regions);
    addAiCard13(aiCards, regions);
    addAiCard14(aiCards, regions);
    addAiCard15(aiCards, regions);
    addAiCard16(aiCards, regions);
    addAiCard17(aiCards, regions);
    addAiCard18(aiCards, regions);   

    addAiCards(aiPlayers, aiCards);
    outputInitialAiTroopPlacement(aiPlayers, regions);
}

*/

    


