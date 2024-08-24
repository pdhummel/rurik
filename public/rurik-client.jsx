
function onLoad() {
  listGames();

  var myCardsModal = setupPopupWindow("myCardsModal", "myCardsButton", "closeMyCardsModal");
  var gameCardsModal = setupPopupWindow("gameCardsModal", "gameCardsButton", "closeGameCardsModal");
  var boatAndSupplyModal = setupPopupWindow("boatAndSupplyModal", "boatAndSupplyButton", "closeBoatAndSupplyModal");
  var claimBoardModal = setupPopupWindow("claimBoardModal", "claimBoardButton", "closeClaimBoardModal");
  var gameLogModal = setupPopupWindow("gameLogModal", "gameLogButton", "closeGameLogModal");

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == myCardsModal || event.target == gameCardsModal || event.target == boatAndSupplyModal || 
        event.target == claimBoardModal || event.target == gameLogModal) {
      myCardsModal.style.display = "none";
      gameCardsModal.style.display = "none";
      boatAndSupplyModal.style.display = "none";
      gameLogModal.style.display = "none";
      claimBoardModal.style.display = "none";
    }
  }
}

function refreshGameStatus() {
  console.log("refreshGameStatus()");
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
    refreshCards();
    refreshClaimBoard();
    refreshLogs();
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
    console.log("refreshGameStatusResponseHandler(): currentState=" + currentState);
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
    }    

    if (gameRound != undefined) {
      setInnerHtml("gameRound", gameRound);
      hide("crown-round-1");
      hide("crown-round-2");
      hide("crown-round-3");
      hide("crown-round-4");
      show("crown-round-" + gameRound);
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
      if (gameStatus.ownerColor == myColor) {
        show("startGameDiv");
      }
      
      hide("actionButtonsDiv");
      hide("boatDiv");
      hide("personalCardsDiv");
      hide("supplyDiv");
    } else {
      hide("startGameDiv");
      show("actionButtonsDiv");
      show("boatDiv");
      show("personalCardsDiv");
      show("supplyDiv");
    }

    if (currentState == "waitingForFirstPlayerSelection") {
      if (myColor == gameStatus.ownerColor) {
        show("pickFirstPlayerDiv");
      } else {
        hide("pickFirstPlayerDiv");  
      }
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
        //hide("strategyBoard-3-4");
      } else {
        hide("placeAdvisorDiv");
      }
    } else if (currentState.startsWith("actionPhase") || currentState == "retrieveAdvisor" || 
      currentState == "selectSchemeCard" || currentState == "selectSchemeCard" ||
      currentState == "schemeFirstPlayer" || currentState == "drawSchemeCards"
    ) {
      if (gameStatus.numberOfPlayers <= 2) {
        show("strategyBoard-1-2");
        hide("strategyBoard-3-4");
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

    if (currentState == "schemeFirstPlayer" && currentPlayer == myColor) {
      show("schemeFirstPlayerDiv");
      show("pickSchemeDeckDiv");
      setInnerHtml("pickFirstPlayer", "1");
    } else if (currentState == "drawSchemeCards" && currentPlayer == myColor) {
      hide("schemeFirstPlayerDiv");
      show("pickSchemeDeckDiv");
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

    if (currentState == "claimPhase" || currentState == "takeDeedCardForClaimPhase") {
      showClaimBoard();
    } else {
      document.getElementById("nopop_claimboard").checked = false;
      hide("claimBoardTable");
      hide("warfareDiv");
    }

    if (currentState == "endGame") {
      showSecretAgendas();
      showEndGameStats();
      hide("strategyBoard-1-2");
      hide("strategyBoard-3-4");
    } else {
      refreshStrategyBoard();
      hide("endGameDiv");
    }

    showOrHideActionPhases(currentState, currentPlayer);
}

function refreshClaimBoard() {
  var gameId = getInnerHtmlValue("gameId");
  callApi("/game/" + gameId + "/claimBoard", "get", "", refreshClaimBoardHandler);  
}

function refreshClaimBoardHandler(response) {
  console.log("refreshClaimBoardHandler(): " + JSON.stringify(response.data));
  var claimsByTrack = response.data.claimsByTrack
  var columns = ["rule", "build", "trade"];
  var all_colors = ["blue", "white", "yellow", "red"];
  for (var i=0; i<columns.length; i++) {
    var column = columns[i];
    var track = claimsByTrack[column];
    var keys = Object.keys(track);
    for (var j=0; j < keys.length; j++) {
      var pointValue = keys[j];
      // first clear things out
      for (var k=0; k<all_colors.length; k++) {
        var color = all_colors[k];
        // red-regions-5, red-build-5, red-boat-9
        var claim = color  + "-" + column + "-" + pointValue;
        hide(claim);
      }
      // set what needs to be set
      var colors = track[pointValue];      
      for (var k=0; k<colors.length; k++) {
        var color = colors[k];
        // red-regions-5, red-build-5, red-boat-9
        var claim = color  + "-" + column + "-" + pointValue;
        show(claim, "inline");
      }
    }
  }
  var claimsByPlayer = response.data.claimsByPlayer;
  console.log(claimsByPlayer);
  // red-war-0
  var colors = ["red", "blue", "yellow", "white"];
  for (c=0; c<colors.length; c++) {
    for (var i=0; i<=10; i++) {
      hide(colors[c] + "-war-" + i);
    }
    var warfare = claimsByPlayer[colors[c]]["warfare"];
    show(colors[c] + "-war-" + warfare);
  }
  var warfareRewards = response.data.warfareRewards;
  for (var i=0; i<=10; i++) {
    var reward = warfareRewards[i];
    if (reward != undefined && reward != null) {
      setInnerHtml("warfare-reward-" + i, reward);
    }
  }
  show("claimBoardTable");
  show("warfareDiv");
}

function showClaimBoard() {
  var gameId = getInnerHtmlValue("gameId");
  callApi("/game/" + gameId + "/claimBoard", "get", "", showClaimBoardResponseHandler);  
}

function showClaimBoardResponseHandler(response) {
  console.log("showClaimBoardResponseHandler(): " + JSON.stringify(response.data));
  refreshClaimBoardHandler(response);
  var keepClosed = document.getElementById("nopop_claimboard");
  if (! keepClosed.checked) {
    show("claimBoardModal");
    keepClosed.checked = true;
  }  
}



function populateSchemeCards(player) {
  console.log("populateSchemeCards(): " + JSON.stringify(player));
  var schemeCards = player.schemeCards;
  var selectSchemeCard = document.getElementById("selectPlaySchemeCard");
  clearOptions(selectSchemeCard);
  var claimPaySchemeCardChoice0 = document.getElementById("claimPaySchemeCardChoice0");
  var claimPaySchemeCardChoice1 = document.getElementById("claimPaySchemeCardChoice1");
  var claimPaySchemeCardChoice2 = document.getElementById("claimPaySchemeCardChoice2");
  var claimPaySchemeCardChoice3 = document.getElementById("claimPaySchemeCardChoice3");
  var claimPaySchemeCardChoice4 = document.getElementById("claimPaySchemeCardChoice4");
  clearOptions(claimPaySchemeCardChoice0);
  clearOptions(claimPaySchemeCardChoice1);
  clearOptions(claimPaySchemeCardChoice2);
  clearOptions(claimPaySchemeCardChoice3);
  clearOptions(claimPaySchemeCardChoice4);
  for (var i=0; i<10; i++) {
    setInnerHtml("personalSchemeCardDiv"+i, "");
    setInnerHtml("playSchemeCardDiv"+i, "");
  }
  console.log("populateSchemeCards(): schemeCards=" + schemeCards.length);
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
    assignOptionToClaimPaySchemeCardChoice(schemeCard);
  }
  if (schemeCards.length > 0) {
    selectPlaySchemeCardChanged();
  }
}

function assignOptionToClaimPaySchemeCardChoice(schemeCard) {
  console.log("assignOptionToClaimPaySchemeCardChoice(): schemeCardId=" + schemeCard.id);
  for (var i=0; i<5; i++) {
    var option = document.createElement("option");
    option.value = schemeCard.id;
    option.innerText = schemeCard.id;
    var claimPaySchemeCardChoice = document.getElementById("claimPaySchemeCardChoice" + i);
    claimPaySchemeCardChoice.append(option);
  }
}

function getRewardsForDeedCard(deedCard) {
  var rewardString = "";
  for (var j=0; j<deedCard.rewards.length; j++) {
    if (rewardString != "") {
      rewardString = rewardString + "-";
    }
    var reward = deedCard.rewards[j];
    // scheme2cards, attackMinusScheme, moveAnywhere
    if (reward == "scheme2cards" || reward == "scheme2Cards") {
      reward = "scheme";
    } else if (reward == "attackMinusScheme") {
      reward = "attack";
    } else if (reward == "moveAnywhere") {
      reward = "move";
    }
    rewardString = rewardString + reward;
  }
  return rewardString;
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
    var rewardString = getRewardsForDeedCard(deedCard);
    var row = [];
    row.push(deedCard.name);
    row.push(deedCard.victoryPoints);
    row.push(deedCard.requirementText);
    row.push(rewardString);
    rows.push(row);
    var radioButton = document.getElementById("deedCardChoice" + i);
    radioButton.value = deedCard.name;
    var label = document.getElementById("deedCardLabel" + i);
    label.innerHTML = "(" + deedCard.victoryPoints + ") " + deedCard.name + ": " + deedCard.requirementText;
  }
  var table = createTable(rows, ["Name", "VPs", "Description", "Reward"], "white");
  deedCardsDiv.appendChild(table);
}


function refreshGameHandler(response) {
  console.log("refreshGameHandler(): " + JSON.stringify(response.data));
  refreshGameStatus();  
}




function outputSchemeCard(cardDivName, schemeCardId) {
  console.log("outputSchemeCard():" + schemeCardId);
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
    //console.log("outputSchemeCard(): rewards.length=" + rewards.length);
    if (rewards.length == 1) {
      reward = rewards.shift();
      if (reward.indexOf("Or") == -1) {
        //console.log("outputSchemeCard(): No Or");
        lastRow = '<td></td><td><img width="30px" src="/assets/scheme-' + reward + '.png" /></td><td></td>'
      } else {
        //console.log("outputSchemeCard(): OR");
        var orRewards = reward.split("Or");
        var reward1 = orRewards[0].toLowerCase(); 
        var reward2 = orRewards[1].toLowerCase(); 
        lastRow = '<td><img width="30px" src="/assets/scheme-' + reward1 + '.png" /></td><td>OR</td><td><img width="30px" src="/assets/scheme-' + reward2 + '.png" /></td>';
      }
    } else if (rewards.length == 2) {
      //console.log("outputSchemeCard(): 2");
      var reward1 = rewards.shift();
      var reward2 = rewards.shift();
      lastRow = '<td><img width="30px" src="/assets/scheme-' + reward1 + '.png" /></td><td></td><td><img width="30px" src="/assets/scheme-' + reward2 + '.png" /></td>';
    } 
  } else {
    //console.log("outputSchemeCard(): nothing");
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

function showEndGameStats() {
  var gameId = getInnerHtmlValue("gameId");
  callApi("/game/" + gameId + "/endGame", "get", "", showEndGameHandler);  
}

function showEndGameHandler(response) {
  console.log("showEndGamehandler(): " + JSON.stringify(response.data));
  var endGameStats = response.data;
  var endGameTableDiv = document.getElementById("endGameTableDiv");
  var rows = [];
  var ruleRow = [];
  var buildRow = [];
  var tradeRow = [];
  var warfareRow = [];
  var vpRow = [];
  var deedRow = [];
  var secretAgendaRow = [];
  var totalRow = [];
  var colors = Object.keys(endGameStats["rule"]);
  ruleRow.push("Rule");
  buildRow.push("Build");
  tradeRow.push("Trade");
  warfareRow.push("War");
  vpRow.push("Victory Points");
  deedRow.push("Deeds");
  secretAgendaRow.push("Secret Agenda");
  totalRow.push("<b>Total</b>");
  for (var i=0; i<colors.length; i++) {
    var color = colors[i];
    ruleRow.push(endGameStats["rule"][color]);
    buildRow.push(endGameStats["build"][color]);
    tradeRow.push(endGameStats["trade"][color]);
    warfareRow.push(endGameStats["warfare"][color]);
    vpRow.push(endGameStats["vp"][color]);
    deedRow.push(endGameStats["deeds"][color]);
    secretAgendaRow.push(endGameStats["secretAgenda"][color]);
    totalRow.push(endGameStats["total"][color]);
  }
  rows.push(ruleRow);
  rows.push(buildRow);
  rows.push(tradeRow);
  rows.push(warfareRow);
  rows.push(vpRow);
  rows.push(deedRow);
  rows.push(secretAgendaRow);
  rows.push(totalRow);
  var headings = [];
  headings.push("Point Category");
  for (var i=0; i<colors.length; i++) {
    var color = colors[i];
    var player = endGameStats["player"][color];
    var playerSpan = '<span><span class="' + color + ' numberBox">&nbsp;&nbsp;&nbsp;</span> ' + player.name + '&nbsp;&nbsp;</span>';
    headings.push(playerSpan);
  }
  var table = createTable(rows, headings, "white");
  endGameTableDiv.innerHTML = "";
  endGameTableDiv.appendChild(table);
  show("endGameDiv");
}

function refreshLogs() {
  var textArea = document.getElementById("gameLogTextArea").value;
  var lines = textArea.split(/\r|\r\n|\n/);
  var count = lines.length;
  var gameId = getInnerHtmlValue("gameId");
  callApi("/game/" + gameId + "/gameLog" + "?count=" + count, "get", "", refreshLogHandler);  
}

function refreshLogHandler(response) {
  //console.log("refreshLogHandler(): " + JSON.stringify(response.data));
  console.log("refreshLogHandler(): ");
  //refreshLogHandler(): [
  // {"timeStamp":1722190387996,"text":"yellow chose Maria as leader."},
  // {"timeStamp":1722190387999,"text":"blue chose Agatha as leader."}]
  var textArea = document.getElementById("gameLogTextArea");
  var lines = response.data;
  for (var i=0; i < lines.length; i++) {
    textArea.value = lines[i].timeStamp + " " + lines[i].text + "\r\n" + textArea.value;
  }
}

function showSecretAgendas() {
  var gameId = getInnerHtmlValue("gameId");
  callApi("/game/" + gameId + "/secretAgendas", "get", "", showSecretAgendasHandler);  
}

function showSecretAgendasHandler(response) {
  console.log("showSecretAgendasHandler(): " + JSON.stringify(response.data));
  var colors = ["blue", "red", "white", "yellow"];
  var rows = [];
  for (var i=0; i<colors.length; i++) {
    var row = [];
    var secretAgenda = response.data[colors[i]];
    if (secretAgenda != undefined) {
      var color = colors[i];
      var playerSpan = '<span>&nbsp;&nbsp;<span class="' + color + ' numberBox">&nbsp;&nbsp;</span></span>';
      //row.push(color);
      row.push(playerSpan);
      row.push(secretAgenda.name);
      row.push(secretAgenda.text);
      row.push(secretAgenda.points);
      //row.push('<input type="checkbox" value="Y" id="' + color+"SecretAgendaCheckbox" + '"/>');
      if (secretAgenda.accomplished) {
        row.push('yes');
      } else {
        row.push('no');
      }
      rows.push(row);
    }

  }
  var headings = ["Player", "Name", "Description", "Points", "Accomplished?"];
  var table = createTable(rows, headings, "white");
  show("verifySecretAgenda");
  var secretAgendaDiv = document.getElementById("allSecretAgendasDiv");
  secretAgendaDiv.innerHTML = "";
  secretAgendaDiv.appendChild(table);
}

function leaveGame() {
  setInnerHtml("gameId", "");
  setInnerHtml("myColor", "");
  hide("statusDiv");
  hide("gameInProgressDiv");
  // <div id="rightSideDiv" style="display: table-cell; height:700px; vertical-align: top; background-size: cover; background-repeat: no-repeat; background-image: url('/assets/snow-castle.png');" ></div>
  var rightSideDiv = document.getElementById("rightSideDiv");
  // <div id="leftSideDiv" style="display: none; width: 5%; position:relative; top: 0; left: 0; z-index: 1 ">
  var leftSideDiv = document.getElementById("leftSideDiv");
  leftSideDiv.style.display = "none";
  show("gameListDiv");
  show("createGameDiv");
  listGames();
}