


function onLoad() {
  listGames();

  var myCardsModal = setupPopupWindow("myCardsModal", "myCardsButton", "closeMyCardsModal");
  var gameCardsModal = setupPopupWindow("gameCardsModal", "gameCardsButton", "closeGameCardsModal");
  var boatAndSupplyModal = setupPopupWindow("boatAndSupplyModal", "boatAndSupplyButton", "closeBoatAndSupplyModal");

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == myCardsModal || event.target == gameCardsModal || event.target == boatAndSupplyModal) {
      myCardsModal.style.display = "none";
      gameCardsModal.style.display = "none";
      boatAndSupplyModal.style.display = "none";
    }
  }
}




function refreshGameStatus() {
  var gameId = getInnerHtmlValue("gameId");
  if (gameId != undefined && gameId.length > 0) {
    var clientColorParam = "";
    var color = getInnerHtmlValue("myColor");
    if (color != undefined && color != null && color.length > 0) {
      clientColorParam = "?clientColor=" + color;
    }
    callApi("/gameStatus/" + gameId + clientColorParam, "get", "", refreshGameStatusResponseHandler);
    refreshMap();
    refreshPlayer();
    refreshStrategyBoard();
    refreshCards();
  }
}
function refreshGameStatusResponseHandler(response) {
    console.log("refreshGameStatusResponseHandler(): " + JSON.stringify(response.data));
    var gameStatus = response.data;
    var currentPlayer = gameStatus.currentPlayer;
    var myColor = getInnerHtmlValue("myColor");
    if (currentPlayer != myColor) {
      setTimeout(refreshGameStatus, 10000);
    }

    var currentState = gameStatus.currentState;
    var status = currentState;
    var gameId = getInnerHtmlValue("gameId");
    var gameName = gameStatus.gameName;
    var gameRound = gameStatus.round;
    var clientLeader = gameStatus.clientLeader;
    var clientPosition = null;
    var currentPlayerPosition = null;
    var playersByPosition = gameStatus.playersByPosition;
    for (var p=0; p < Object.keys(playersByPosition).length; p++) {
      var position = Object.keys(playersByPosition)[p];
      var positionElement = document.getElementById(position + "_position");
      var player = playersByPosition[position];
      if (myColor == player.color) {
        clientPosition = position;
      }
      if (currentPlayer == player.color) {
        currentPlayerPosition = position;
      }
      if (currentPlayer != undefined && currentPlayer != null && currentPlayer == player.color) {
        positionElement.className = player.color + " numberCircle";
        positionElement.style.opacity = 1;
        positionElement.innerHTML = position;
      } else {
        positionElement.className = player.color + " numberBox";
        positionElement.style.opacity = .5;
        positionElement.innerHTML = "";
      }
      show(position + "_position");
    }
    var myColorIconElement = document.getElementById("myColorIcon");
    if (currentPlayer != undefined && currentPlayer != null && currentPlayer == myColor) {
      myColorIconElement.innerHTML = clientPosition;
      myColorIconElement.className = myColor + " numberBox";
    } else {
      myColorIconElement.innerHTML = clientPosition;
      myColorIconElement.className = myColor + " numberBox";
    }
    var currentPlayerColorElement = document.getElementById("currentPlayerColor");
    if (currentPlayer != undefined && currentPlayer != null) {
      currentPlayerColorElement.innerHTML = currentPlayerPosition;
      currentPlayerColorElement.className = currentPlayer + " numberCircle";
    } else {
      currentPlayerColorElement.innerHTML = "";
      //currentPlayerColorElement.style.display = "none";
    }    

    if (gameRound != undefined) {
      setInnerHtml("gameRound", gameRound);
      //show("gameCardsButton");
    }
    if (clientLeader != undefined && clientLeader != null && 
        clientLeader.name != undefined && clientLeader.name != null && clientLeader.name.length > 0) {
      setInnerHtml("leader", clientLeader.name);
    } else {
      setInnerHtml("leader", ". . . ?");
    }

    setInnerHtml("gameStatusName", gameName);
    setInnerHtml("gameStatus", status);
    console.log("refreshGameStatusResponseHandler: currentState=" + currentState + ", currentPlayer=" + currentPlayer + ", myColor=" + myColor);

    if (currentState == "waitingForPlayers") {
      show("startGameDiv");
      hide("boatDiv");
      hide("personalCardsDiv");
      hide("supplyDiv");
    } else {
      document.getElementById("tavernImage").src = "/assets/tavern-" + myColor + ".png";
      document.getElementById("marketImage").src = "/assets/market-" + myColor + ".png";
      document.getElementById("churchImage").src = "/assets/church-" + myColor + ".png";
      document.getElementById("strongholdImage").src = "/assets/stronghold-" + myColor + ".png";
      document.getElementById("stableImage").src = "/assets/stable-" + myColor + ".png";
      document.getElementById("troopImage").src = "/assets/troop-" + myColor + ".png";
      hide("startGameDiv");
      show("boatDiv");
      show("personalCardsDiv");
      show("supplyDiv");
    }
    if (currentState == "waitingForFirstPlayerSelection") {
      show("pickFirstPlayerDiv");
    } else {
      hide("pickFirstPlayerDiv");
    }
    if (currentState == "waitingForLeaderSelection" && currentPlayer == myColor) {
      callApi("/game/" + gameId + "/leaders", "get", "", leaderResponseHandler);
    } else {
      hide("leaderSelectionDiv");
    }
    if (currentState == "waitingForSecretAgendaSelection" && currentPlayer == myColor) {
      callApi("/game/" + gameId + "/player/" + myColor + "/secretAgenda", "get", "", getSecretAgendaHandler);
    } else {
      hide("chooseSecretAgendaDiv");
    }
    if (currentState == "waitingForTroopPlacement" && currentPlayer == myColor) {
      show("placeInitialTroopsDiv");
    } else if (currentState == "waitingForLeaderPlacement" && currentPlayer == myColor) {
      document.getElementById("placeTroopButton").value = "Place Leader";
      show("placeInitialTroopsDiv");
    } else {
      hide("placeInitialTroopsDiv");
    }
    if (currentState == "strategyPhase") {
      if (gameStatus.numberOfPlayers <= 2) {
        show("strategyBoard-1-2");
        hide("strategyBoard-3-4");
      } else {
        show("strategyBoard-3-4");
        hide("strategyBoard-1-2");
      }
      show("advisors");
      if (currentPlayer == myColor) {
        show("placeAdvisorDiv");
        hide("strategyBoard-3-4");
      } else {
        hide("placeAdvisorDiv");
      }
    } else if (currentState.startsWith("actionPhase") || currentState == "retrieveAdvisor" || 
      currentState == "selectSchemeCard" || currentState == "selectSchemeCard" || currentState.startsWith("actionPhase") ||
      currentState == "schemeFirstPlayer" || currentState == "drawSchemeCards"
    ) {
      if (gameStatus.numberOfPlayers <= 2) {
        show("strategyBoard-1-2");
      } else {
        show("strategyBoard-3-4");
        hide("strategyBoard-1-2");
      }
      hide("advisors");
      hide("placeAdvisorDiv");
    } else {
      hide("strategyBoard-1-2");
      hide("strategyBoard-3-4");
      hide("advisors");
      hide("placeAdvisorDiv");
    }
    if (currentState == "retrieveAdvisor" && currentPlayer == myColor) {
      getNextAdvisor();
    } else {
      hide("retrieveAdvisorDiv");
    }
    if (currentState == "actionPhase" && currentPlayer == myColor) {
      showActionPhaseDiv();
    } else {
      hide("actionPhaseDiv");
    }
    if (currentState == "actionPhaseMuster" && currentPlayer == myColor) {
      showMusterTroopsDiv();
    } else {
      hide("musterTroopsDiv");
    }
    if (currentState == "actionPhaseMove" && currentPlayer == myColor) {
      showMoveTroopsDiv();
    } else {
      hide("moveTroopsDiv");
    }
    if (currentState == "actionPhaseAttack" && currentPlayer == myColor) {
      showAttackDiv();
    } else {
      hide("attackDiv");
    }
    if (currentState == "actionPhaseTax" && currentPlayer == myColor) {
      showTaxDiv();
    } else {
      hide("taxDiv");
    }
    if (currentState == "actionPhaseBuild" && currentPlayer == myColor) {
      showBuildDiv();
    } else {
      hide("buildDiv");
    }
    if (currentState == "actionPhaseTransfer" && currentPlayer == myColor) {
      showTransferGoodsDiv();
    } else {
      hide("transferGoodsDiv");
    }
    if (currentState == "schemeFirstPlayer" && currentPlayer == myColor) {
      show("schemeFirstPlayerDiv");
      show("pickSchemeDeckDiv");
      setInnerHtml("pickFirstPlayer", "1");
    } else {
      hide("schemeFirstPlayerDiv");
      hide("pickSchemeDeckDiv");
    }
    if (currentState == "selectSchemeCard" && currentPlayer == myColor) {
      showReturnSchemeCard(response.data.clientPlayer);
    } else {
      hide("returnSchemeCardDiv");
    }

    if (response.data.clientPlayer != undefined && response.data.clientPlayer != null) {
      populateSchemeCards(response.data.clientPlayer);
    }

    if (currentState == "actionPhasePlaySchemeCard" && currentPlayer == myColor) {
      show("playSchemeCardDiv");
    } else {
      hide("playSchemeCardDiv");
    }
    
    if (currentState == "takeDeedCardForActionPhase" && currentPlayer == myColor) {
      show("takeDeedCardDiv");
    } else {
      hide("takeDeedCardDiv");
    }
    
}

function populateSchemeCards(player) {
  var schemeCards = player.schemeCards;
  var selectSchemeCard = document.getElementById("selectPlaySchemeCard");
  clearOptions(selectSchemeCard);
  for (var i=0; i<10; i++) {
    setInnerHtml("personalSchemeCardDiv"+i, "");
    setInnerHtml("playSchemeCardDiv"+i, "");
  }
  for (var i=0; i<schemeCards.length; i++) {
    var schemeCard = schemeCards[i];
    var option = document.createElement("option");
    option.value = schemeCard.id;
    var parts = schemeCard.id.split("-");
    var deaths = parts.pop();
    var cost = parts.pop();
    var schemeDescription = parts.join("+");
    option.innerText = i+1 + ") " + schemeDescription;
    selectSchemeCard.append(option);
    outputSchemeCard("personalSchemeCardDiv" + i, schemeCard.id);
    outputSchemeCard("playSchemeCardDiv" + i, schemeCard.id);
  }  
}

function refreshCards() {
  var gameId = getInnerHtmlValue("gameId");
  callApi("/game/" + gameId + "/cards", "get", "", refreshCardsResponseHandler);      
}
function refreshCardsResponseHandler(response) {
  console.log("refreshCardsResponseHandler(): " + JSON.stringify(response.data));
  var cardsResponse = response.data;
  setInnerHtml("schemeDeck1Count", cardsResponse['schemeDeck1'].length);
  setInnerHtml("schemeDeck2Count", cardsResponse['schemeDeck2'].length);
  if (cardsResponse['discardedSchemeCards'].length > 0) {
    var schemeCard = cardsResponse['discardedSchemeCards'][cardsResponse.discardedSchemeCards.length -1];
    outputSchemeCard("schemeDiscardDiv", schemeCard.id);
  } else {
    setInnerHtml("schemeDiscardDiv", "");
  }

  var deedCardsDiv = document.getElementById("deedCardsDiv");
  deedCardsDiv.innerHTML = "";
  var rows = [];
  for (var i=0; i < cardsResponse['deedCards'].length; i++) {
    var deedCard = cardsResponse['deedCards'][i];
    var row = [];
    row.push(deedCard.name);
    row.push(deedCard.victoryPoints);
    row.push(deedCard.requirementText);
    rows.push(row);
    var radioButton = document.getElementById("deedCard" + i);
    radioButton.value = deedCard.name;
    var label = document.getElementById("deedCardLabel" + i);
    label.innerHTML = "(" + deedCard.victoryPoints + ") " + deedCard.name + ": " + deedCard.requirementText;
  }
  var table = createTable(rows, ["Name", "VPs", "Description"]);
  deedCardsDiv.appendChild(table);
}


function refreshGameHandler(response) {
  console.log("refreshGameHandler(): " + JSON.stringify(response.data));
  refreshGameStatus();  
}




function outputSchemeCard(cardDivName, schemeCardId) {
  var parts = schemeCardId.split("-");
  var deaths = parts.pop();
  var cost = parts.pop();
  var tableHtml = '<table id="' + cardDivName + 'Table" style="height: 160px; width: 95px; border:1px solid black; background-size: contain; background-position: center; background-repeat: no-repeat; background-image: url("/assets/shield.png"); opacity:1;"></table>';
  setInnerHtml(cardDivName, tableHtml);
  var table = document.getElementById(cardDivName + "Table");
  table.style.background = '#235664';
  table.style.backgroundImage = 'url("/assets/shield.png")';
  table.style.backgroundSize = 'contain';
  table.style.backgroundRepeat = 'no-repeat';
  table.style.backgroundPosition = 'center';
  var tr = document.createElement('tr');
  if (cost > 0) {
    tr.innerHTML = '<td width="30px"></td><td><img width="30px" src="/assets/spend-coin.png" /></td><td  width="30px"></td>';
  } else {
    tr.innerHTML = '<td width="30px"></td><td width="30px" height="30px"></td><td width="30px"></td>';
  }
  table.appendChild(tr);

  var reward = parts.shift();
  tr = document.createElement('tr');
  // buildOrAttack, taxOrMuster
  if (reward.indexOf("Or") == -1) {
    tr.innerHTML = '<td></td><td><img width="30px" src="/assets/scheme-' + reward + '.png" /></td><td></td>';
  } else {
    var orRewards = reward.split("Or");
    var reward1 = orRewards[0].toLowerCase(); 
    var reward2 = orRewards[1].toLowerCase(); 
    tr.innerHTML = '<td><img width="30px" src="/assets/scheme-' + reward1 + '.png" /></td><td>OR</td><td><img width="30px" src="/assets/scheme-' + reward2 + '.png" /></td>';
  }
  table.appendChild(tr);

  tr = document.createElement('tr');
  var rewards = parts;
  var lastRow = '';
  if (rewards.length > 0) {
    console.log(" rewards.length=" + rewards.length);
    if (rewards.length == 1) {
      reward = rewards.shift();
      if (reward.indexOf("Or") == -1) {
        console.log("No Or");
        lastRow = '<td></td><td><img width="30px" src="/assets/scheme-' + reward + '.png" /></td><td></td>'
      } else {
        console.log("OR");
        var orRewards = reward.split("Or");
        var reward1 = orRewards[0].toLowerCase(); 
        var reward2 = orRewards[1].toLowerCase(); 
        lastRow = '<td><img width="30px" src="/assets/scheme-' + reward1 + '.png" /></td><td>OR</td><td><img width="30px" src="/assets/scheme-' + reward2 + '.png" /></td>';
      }
    } else if (rewards.length == 2) {
      console.log("2");
      var reward1 = rewards.shift();
      var reward2 = rewards.shift();
      lastRow = '<td><img width="30px" src="/assets/scheme-' + reward1 + '.png" /></td><td></td><td><img width="30px" src="/assets/scheme-' + reward2 + '.png" /></td>';
    } 
  } else {
    console.log("nothing");
      lastRow = lastRow + '<td height="30px"></td>'
  }
  tr.innerHTML = lastRow;
  table.appendChild(tr);

  tr = document.createElement('tr');
  if (deaths == 1) {
    tr.innerHTML = '<td></td><td><img width="30px" src="/assets/scheme-rebel.png" /></td><td></td>'
  } else if (deaths == 2) {
    tr.innerHTML = '<td><img width="30px" src="/assets/scheme-rebel.png" /></td><td></td><td><img width="30px" src="/assets/scheme-rebel.png" /></td>'
  } else {
    tr.innerHTML = '<td height="30px"></td><td></td><td></td>';
  }
  table.appendChild(tr);
}