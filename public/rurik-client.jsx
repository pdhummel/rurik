
function callApi(path, httpMethod, jsonData="", responseHandler) {
  console.log("callApi: " + httpMethod + " " + path);  
  if (jsonData.length > 0) {
    console.log(jsonData);
    console.log("callApi:" + JSON.parse(jsonData));
  }

  axios({
    method: httpMethod,
    url: path,
    headers: {'Content-Type': 'application/json'},
    data: jsonData.length > 0 ? JSON.parse(jsonData) : {}
  })
  .then(function(response) { 
    console.log(response.data)
    console.log(response.status)
    if (responseHandler != undefined) {
      responseHandler(response);
    }
  })
  .then(function(error) { 
    if (error != undefined) {
      console.log(error)
    }
  });
}

function onLoad() {
  listGames();
}

function hide(divId) {
  var e = document.getElementById(divId);
  if (e === undefined || e == null) {
    console.log("hide(): could not find " + e);
    return;
  }
  e.style.display = "none";
}
function show(divId) {
  var e = document.getElementById(divId);
  if (e === undefined || e == null) {
    console.log("show(): could not find " + e);
    return;
  }
  e.style.display = "block";
}
function getSelectedValue(selectElementId) {
  var selectElement = document.getElementById(selectElementId);
  var value = selectElement.options[selectElement.selectedIndex].value;
  return value;
}
function getValue(elementId) {
  var e = document.getElementById(elementId);
  var value = e.value;
  return value;
}
function clearOptions(selectElement) {
  var i, L = selectElement.options.length - 1;
  for(i = L; i >= 0; i--) {
    selectElement.remove(i);
  }      
}
function setInnerHtml(elementId, value) {
  var e = document.getElementById(elementId);
  if (e === undefined || e == null) {
    console.log("setInnerHtml(): could not find " + elementId);
    return;
  }
  e.innerHTML = value;
}
function getInnerHtmlValue(elementId) {
  var e = document.getElementById(elementId);
  if (e === undefined || e == null) {
    console.log("setInnerHtml(): could not find " + elementId);
    return null;
  }      
  return e.innerHTML;
}

function getSelectedRadioButton(elementName) {
  var choices = document.getElementsByName(elementName);
  var value = null;
  for (var i = 0; i < choices.length; i++){
      if (choices[i].checked) {
        value = choices[i].value;
      }
  }
  return value;
}

function populateTable(rows, headings) {
  document.getElementById("gameListData").innerHTML = "";
  var table = document.createElement('table');
  table.style.borderCollapse = "collapse";
  var tr = document.createElement('tr');
  for (var cell=0; cell < headings.length; cell++) {
    var th = document.createElement('th');
    th.style.align = "left";
    th.style.border = "1px solid black";
    var textNode = document.createTextNode(headings[cell]);
    th.appendChild(textNode);
    tr.appendChild(th);
  }
  table.appendChild(tr);   
  for (var r = 0; r < rows.length; r++) {
    tr = document.createElement('tr');
    tr.style.borderBottom = "1px solid black";
    var row = rows[r];
    for (var cell=0; cell < row.length; cell++) {
      var td = document.createElement('td');
      td.style.align = "left";
      td.style.border = "1px solid black";
      td.innerHTML = row[cell];
      //var textNode = document.createTextNode(row[cell]);
      //td.appendChild(textNode);
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  document.getElementById("gameListData").appendChild(table);
}

function listGames() {
  callApi("/game", "get", "", listGamesResponseHandler);
}
function listGamesResponseHandler(response) {
  console.log("listGamesResponseHandler(): " + JSON.stringify(response.data));
  var gameId = getInnerHtmlValue("gameId");
  if (gameId != undefined && gameId != null && gameId.length > 0) {
    return;
  }  
  selectGameId = document.getElementById("selectGameId");
  clearOptions(selectGameId);
  var games = response.data;
  var rows = [];
  for (var i=0; i < Object.keys(games).length; i++) {
    var key = Object.keys(games)[i];
    var element = document.createElement("option");
    element.innerText = games[key].gameId + " " + games[key].gameName;
    element.value = games[key].gameId;
    selectGameId.append(element);
    element = document.createElement("option");
    element.innerText = games[key].gameId + " " + games[key].gameName;
    element.value = games[key].gameId;        
    var row = [];
    row.push(games[key].gameId);
    row.push(games[key].gameName);
    row.push(games[key].currentState);
    var playerSummary = "";
    if (games[key].numberOfPlayers > 0) {
      var playersByPosition = games[key].playersByPosition;
      for (var p=0; p < Object.keys(playersByPosition).length; p++) {
        var position = Object.keys(playersByPosition)[p];
        var player = playersByPosition[position];
        playerSummary = playerSummary + '<input type="button" style="background-color: 	#696969; color:' + player.color + '" value="' + player.name + ' (' + position + ')" onclick=\'javascript:rejoinGame("' + games[key].gameId + '", "' + player.color + '");\' />';
      }
      
    }
    row.push(playerSummary);
    rows.push(row);
  }

  populateTable(rows, ["Game Id", "Game Name", "Status", "Players"]);
  if (Object.keys(games).length > 0) {
    show("joinGameDiv");
  }
  gameId = getInnerHtmlValue("gameId");
  if (gameId == undefined || gameId == null || gameId.length <= 0) {
    setTimeout(listGames, 15000);
  }
}

function createGame() {
  var data = '{ "gameName": "' + document.getElementById("gameName").value + '" }';
  callApi("/game", "post", data, createGameResponseHandler);
}
function createGameResponseHandler(response) {
  console.log("createGameResponseHandler(): " + response.data);
  listGames();
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
    } else if (currentState == "actionPhase" || currentState == "retrieveAdvisor") {
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
}
function leaderResponseHandler(response) {
  console.log("leaderResponseHandler(): " + JSON.stringify(response.data));
  selectLeader = document.getElementById("selectLeader");
  clearOptions(selectLeader);
  var leaders = response.data;
  for (var i=0; i < Object.keys(leaders).length; i++) {
    var key = Object.keys(leaders)[i];
    var element = document.createElement("option");
    element.innerText = key;
    element.value = key;
    selectLeader.append(element);
  }
  show("leaderSelectionDiv");
}
function getSecretAgendaHandler(response) {
  console.log("getSecretAgendaHandler(): " + JSON.stringify(response.data));
  // [{"name":"Esteemed","text":"Occupy the most regions with your troops.","points":2},{"name":"Conquering","text":"Finish in first place on the warfare track.","points":2}]
  setInnerHtml("secretAgenda1Label", response.data[0].name + ": (" + response.data[0].points + ") " + response.data[0].text);
  setInnerHtml("secretAgenda2Label", response.data[1].name + ": (" + response.data[1].points + ") " + response.data[1].text);
  document.getElementById("secretAgenda1").value = response.data[0].name;
  document.getElementById("secretAgenda2").value = response.data[1].name;
  show("chooseSecretAgendaDiv");
}

function refreshMap() {
  var gameId = getInnerHtmlValue("gameId");
  callApi("/game/" + gameId + "/map", "get", "", refreshMapResponseHandler);      
}
function refreshMapResponseHandler(response) {
  console.log("refreshMapResponseHandler(): " + JSON.stringify(response.data));
  var locations = response.data;
  var selectLocation = document.getElementById("selectLocation");
  clearOptions(selectLocation);
  for (var i=0; i<locations.length; i++) {
    var locationName = locations[i].name;
    var locationData = locations[i];
    
    for (var b=0; b<3; b++) {
      // Ex: AzovBuilding1
      var buildingElementId = locationName + "Building" + (b+1);
      var buildingElementImgId = locationName + "BuildingImg" + (b+1);
      //var buildingElement = document.getElementById(buildingElementId);
      var buildingElementImg = document.getElementById(buildingElementImgId);
      if (b < locationData.buildings.length) {
        var buildingName = locationData.buildings[b].name;
        var buildingColor = locationData.buildings[b].color;
        var buildingImage = "/assets/" + buildingName + "-" + buildingColor + ".png";
        buildingElementImg.alt = buildingImage;
        buildingElementImg.src = buildingImage;
        show(buildingElementId);
      } else {
        hide(buildingElementId);
      }
    }

    var option = document.createElement("option");
    option.innerText = locationName;
    option.value = locationName;
    selectLocation.append(option);

    var resourceCount = locationData.resourceCount;
    var defaultResource = locationData.defaultResource;
    var resourceElementName = "resource" + locationName;
    if (defaultResource != undefined && defaultResource != null && 
        resourceCount != undefined && resourceCount != null && resourceCount > 0) {
      show(resourceElementName);
    } else {
      hide(resourceElementName);
    }

    var colors = ["red", "blue", "white", "yellow"];
    for (var j=0; j<colors.length; j++) {
      var color = colors[j];
      var troops = locationData["troopsByColor"][color];
      var span = locationName + "_" + color + "_troops";
      setInnerHtml(span, troops);
      if (troops > 0) {
        show(span);
      } else {
        hide(span);
      }

      var leader = locationData["leaderByColor"][color];
      var span = locationName + "_" + color + "_leader";
      setInnerHtml(span, leader);
      if (leader > 0) {
        show(span);
      } else {
        hide(span);
      }
    }

    var rebels = locationData["rebels"].length;
    span = locationName + "_rebels";
    setInnerHtml(span, rebels);
    if (rebels > 0) {
      show(span);
    } else {
      hide(span);
    }
  }
}

function joinGame() {
  var gameId = getSelectedValue("selectGameId");
  var color = getSelectedValue("selectColor");
  var position = getSelectedValue("selectPosition");
  var name = getValue("playerName");
  if (gameId != undefined && gameId != null && gameId.length > 0) {
    var data = '{ "color": "' + color + '", "position": "' + position + '", "name":"' + name + '" }'
    callApi("/game/" + gameId + "/player", "post", data, joinGameResponseHandler);
    setInnerHtml("gameId", gameId);
    setInnerHtml("myName", name);
    setInnerHtml("myColor", color);
  }
}
function joinGameResponseHandler(response) {
    console.log("joinGameResponseHandler(): " + JSON.stringify(response.data));

    var leftSideDiv = document.getElementById("leftSideDiv");
    var rightSideDiv = document.getElementById("rightSideDiv");
    rightSideDiv.style.width = "45%";
    leftSideDiv.style.width = "55%";
    leftSideDiv.style.display = "block";
    refreshGameStatus();
    show("statusDiv");
    hide("gameListDiv");
    hide("createGameDiv");
    hide("joinGameDiv");
    hide("rejoinGameDiv");
}

function rejoinGame(gameId, color) {
  if (gameId != undefined) {
    setInnerHtml("gameId", gameId);
    setInnerHtml("myColor", color);
    var data = '{ "color": "' + color + '" }'
    callApi("/game/" + gameId + "/player", "put", data, rejoinGameResponseHandler);
  }
}
function rejoinGameResponseHandler(response) {
  console.log("rejoinGameResponseHandler(): " + JSON.stringify(response.data));
  var name = response.data.name;
  var position = response.data.tablePosition;
  if (name != undefined && position != undefined) {
    rightSideDiv.style.width = "45%";
    leftSideDiv.style.width = "55%";
    leftSideDiv.style.display = "block";
    refreshGameStatus();
    setInnerHtml("myName", name);
    setInnerHtml("myPosition", position);
    show("statusDiv");
    hide("gameListDiv");
    hide("createGameDiv");
    hide("joinGameDiv");
    hide("rejoinGameDiv");
  }
}

function startGame() {
  var gameId = getInnerHtmlValue("gameId");
  callApi("/game/" + gameId, "put", "", startGameResponseHandler);
}
function startGameResponseHandler(response) {
  console.log("startGameResponseHandler(): " + JSON.stringify(response.data));
  hide("startGameDiv");
  show("pickFirstPlayerDiv");
  refreshGameStatus();
}

function pickFirstPlayer() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getSelectedValue("selectFirstPlayerColor");
  callApi("/game/" + gameId + "/firstPlayer/" + color, "put", "", pickFirstPlayerResponseHandler);
}
function pickRandomFirstPlayer() {
  var gameId = getInnerHtmlValue("gameId");
  callApi("/game/" + gameId + "/firstPlayer", "post", "", pickFirstPlayerResponseHandler);
}
function pickFirstPlayerResponseHandler(response) {
  console.log("pickFirstPlayerResponseHandler(): " + JSON.stringify(response.data));
  hide("pickFirstPlayerDiv");
  refreshGameStatus();
}

function chooseLeader() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var leader = getSelectedValue("selectLeader");
  var data = '{ "leaderName": "' + leader + '" }'
  callApi("/game/" + gameId + "/player/" + color + "/leaders", "post", data, chooseLeaderResponseHandler);
}
function chooseLeaderResponseHandler(response) {
  console.log("chooseLeaderResponseHandler(): " + JSON.stringify(response.data));
  setInnerHtml("leader", response.data.leader.name);
  hide("leaderSelectionDiv");
  refreshGameStatus();
}

function chooseSecretAgenda() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var secretAgendas = document.getElementsByName('secretAgenda');
  var secretAgendaValue = null;
  for (var i = 0; i < secretAgendas.length; i++){
      if (secretAgendas[i].checked) {
        secretAgendaValue = secretAgendas[i].value;
      }
  }
  data = '{ "cardName": "' + secretAgendaValue + '" }'
  callApi("/game/" + gameId + "/player/" + color + "/secretAgenda", "post", data, chooseSecretAgendaResponseHandler);
}
function chooseSecretAgendaResponseHandler(response) {
  console.log("chooseSecretAgendaResponseHandler(): " + JSON.stringify(response.data));
  hide("chooseSecretAgendaDiv");
  refreshGameStatus();
}

function placeTroop() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var location = getSelectedValue("selectLocation");
  var data = '{ "color": "' + color + '"}';
  var status = getInnerHtmlValue("gameStatus");
  if (status.startsWith("waitingForTroopPlacement")) {
    callApi("/game/" + gameId + "/location/" + location + "/troops", "put", data, placeTroopResponseHandler);
  } else if (status.startsWith("waitingForLeaderPlacement")) {
    callApi("/game/" + gameId + "/location/" + location + "/leader", "put", data, placeTroopResponseHandler);
  }
}
function placeTroopResponseHandler(response) {
  console.log("placeTroopResponseHandler(): " + JSON.stringify(response.data));
  hide("placeInitialTroopsDiv");
  refreshGameStatus();  
}

function refreshPlayer() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  if (gameId != undefined && gameId != null && color != undefined && color != null) {
    callApi('/game/' + gameId + '/player/' + color, "get", "", refreshPlayerResponseHandler);
  } 
}
function refreshPlayerResponseHandler(response) {
  console.log("refreshPlayerResponseHandler(): " + JSON.stringify(response.data));
  var color = response.data.color;
  var advisors = response.data.advisors;
  var advisorRow = document.getElementById("advisorRow");
  var innerHtml = "";
  advisorRow.innerHTML = innerHtml;
  var advisorNumToText ={};
  advisorNumToText[1] = "one";
  advisorNumToText[2] = "two";
  advisorNumToText[3] = "three";
  advisorNumToText[4] = "four";
  advisorNumToText[5] = "five";
  console.log("refreshPlayerResponseHandler(): advisors=" + advisors);
  var selectAdvisor = document.getElementById("selectAdvisor");
  clearOptions(selectAdvisor);
  for (var i=0; i<advisors.length; i++) {
    var option = document.createElement("option");
    option.innerText = advisors[i];
    option.value = advisors[i];
    selectAdvisor.append(option);
    var imageFile = "/assets/" + advisorNumToText[advisors[i]] + "-" + color + ".png";
    innerHtml = innerHtml + '<img height="40px" src="' + imageFile + '" />';
  }
  advisorRow.innerHTML = innerHtml;
  var goodsOnDock = response.data["boat"]["goodsOnDock"];
  setInnerHtml("dockStone", goodsOnDock["stone"]);
  setInnerHtml("dockWood", goodsOnDock["wood"]);
  setInnerHtml("dockFish", goodsOnDock["fish"]);
  setInnerHtml("dockHoney", goodsOnDock["honey"]);
  setInnerHtml("dockFur", goodsOnDock["fur"]);
  var goodsOnBoat = response.data["boat"]["goodsOnBoat"];
  setInnerHtml("boatStone", goodsOnBoat["stone"]);
  setInnerHtml("boatWood", goodsOnBoat["wood"]);
  setInnerHtml("boatFish", goodsOnBoat["fish"]);
  setInnerHtml("boatHoney", goodsOnBoat["honey"]);
  setInnerHtml("boatFur", goodsOnBoat["fur"]);
  var money = response.data["boat"]["money"];
  setInnerHtml("playerCoins", money);
  var supplyTroops = response.data["supplyTroops"];
  setInnerHtml("troopCount", supplyTroops);
  var buildings = response.data["buildings"];
  setInnerHtml("tavernCount", buildings["tavern"]);
  setInnerHtml("stableCount", buildings["stable"]);
  setInnerHtml("marketCount", buildings["market"]);
  setInnerHtml("strongholdCount", buildings["stronghold"]);
  setInnerHtml("churchCount", buildings["church"]);
}

function placeAdvisor() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var selectedAction = getSelectedValue("selectAction");
  var advisor = getSelectedValue("selectAdvisor");
  var bidCoins = getValue("bidCoins");
  var coins = 0;
  if (bidCoins > 0) {
    coins = bidCoins;
  }
  var data = '{ "color":"'+ color +'", "bidCoins":"' + coins + '", "advisor":"'+ advisor + '" }';
  callApi("/game/" + gameId + "/advisorBid/" + selectedAction, "put", data, placeAdvisorResponseHandler);
}
function placeAdvisorResponseHandler(response) {
  console.log("placeAdvisorResponseHandler(): " + JSON.stringify(response.data));
  refreshGameStatus();
}

function refreshStrategyBoard() {
  var gameId = getInnerHtmlValue("gameId");  
  callApi("/game/" + gameId + "/auction", "get", "", refreshStrategyBoardResponseHandler);
}
function refreshStrategyBoardResponseHandler(response) {
  console.log("refreshStrategyBoardResponseHandler(): " + JSON.stringify(response.data));
  if (response.data == null || response.data.board == null) {
    return;
  }
  var numberOfPlayers = response.data["numberOfPlayers"];
  var board = response.data["board"];
  var advisorNumToText ={};
  advisorNumToText[1] = "one";
  advisorNumToText[2] = "two";
  advisorNumToText[3] = "three";
  advisorNumToText[4] = "four";
  advisorNumToText[5] = "five";  
  var sb = "sb-3-4-";
  if (numberOfPlayers <= 2) {
    sb = "sb-1-2-";
  }
  console.log("board", board);
  for (var k=0; k < Object.keys(board).length; k ++) {
    var key = Object.keys(board)[k];
    var column = board[key];
    for (var i=0; i < column.length; i++) {
      var advisor = column[i]["advisor"];
      var bidCoins = column[i]["bidCoins"];
      // sb-1-2-muster-r3-advisor
      var elementId = sb + key + "-r" + (i + 1) + "-advisor";
      if (advisor > 0) {
        var color = column[i]["color"];
        var image = document.getElementById(elementId);
        // "/assets/one-blue.png"
        var imageSrc = "/assets/" + advisorNumToText[advisor] + "-" + color + ".png";
        image.src = imageSrc;
        show(elementId);
      } else {
        hide(elementId);
      }
      var coinElementId = sb + key + "-r" + (i + 1) + "-coin";
      if (bidCoins > 0) {        
        setInnerHtml(coinElementId, bidCoins);
      } else {
        setInnerHtml(coinElementId, "");
      }
    }
  }
}

function getNextAdvisor() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  callApi('/game/' + gameId + '/player/' + color + '/nextAdvisor', "get", "", getNextAdvisorResponseHandler);
}
function getNextAdvisorResponseHandler(response) {
  console.log("getNextAdvisorResponseHandler(): " + JSON.stringify(response.data));
  // populate radio buttons
  // [{"actionName":"muster","quantity":3,"extraCoin":0,"color":"blue","advisor":"1","bidCoins":0}]
  var advisors = response.data;
  var advisor1Label = document.getElementById("advisor1Label");
  advisor1Label.innerHTML = "Advisor " + advisors[0].advisor + ", row " + (advisors[0].row+1) + ": " + 
      advisors[0].actionName + " " + advisors[0].quantity;
  var advisor1 = document.getElementById("advisor1");
  advisor1.value = advisors[0].actionName + "-" + advisors[0].advisor + "-" + advisors[0].row
  if (advisors.length > 1) {
    show("showAdvisor2");
    var advisor2Label = document.getElementById("advisor2Label");
    advisor2Label.innerHTML = advisors[1].advisor + ": " + advisors[1].actionName + " " + advisors[1].quantity;
    var advisor2 = document.getElementById("advisor2");
    advisor2.value = advisors[1].actionName + "-" + advisors[1].advisor + "-" + advisors[1].row  
  } else {
    hide("showAdvisor2");
  }
  show("retrieveAdvisorDiv");
}

function retrieveAdvisor() {
  console.log("retrieveAdvisor");
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var advisors = document.getElementsByName('advisor');
  var advisorValue = null;
  for (var i = 0; i < advisors.length; i++) {
      if (advisors[i].checked) {
        advisorValue = advisors[i].value;
      }
  }

  // action-advisorNumber-row - Example: muster-1-1 
  var advisorValues = advisorValue.split("-");
  var action = advisorValues[0];
  var advisor = advisorValues[1];
  var row = advisorValues[2];
  var forfeitAction = "N";
  var forfeitActionYN = document.getElementById("forfeitActionYN");
  if (forfeitActionYN != undefined && forfeitActionYN != null && forfeitActionYN.checked) {
    forfeitAction = forfeitActionYN.value;
  }
  var data = '{ "color": "' + color + '", "advisor": "' + advisor + '", "row": "' + row + 
    '", "forfeitAction": "' + forfeitAction + '"}';
    console.log("retrieveAdvisor: data=" + data);
  callApi('/game/' + gameId + '/advisorRetrieve/' + action, "put", data, retrieveAdvisorHandler);
}
function retrieveAdvisorHandler(response) {
  console.log("retrieveAdvisorHandler(): " + JSON.stringify(response.data));
  refreshGameStatus();
}

function showActionPhaseDiv() {
  // TODO: get player details
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  if (gameId != undefined && gameId != null && color != undefined && color != null) {
    callApi('/game/' + gameId + '/player/' + color, "get", "", showActionPhaseHandler);
  } 
}
function showActionPhaseHandler(response) {
  console.log("showActionPhaseHandler(): " + JSON.stringify(response.data));
  /*
        this.accomplishedDeedForTurn = false;
  
  */
  var playerData = response.data;
  if (playerData.convertedGoodsForTurn == false && 
    (playerData.boat.canPlayAttackConversionTile || playerData.boat.canPlayBuildConversionTile || playerData.boat.canPlayMusterConversionTile)) {
      show("convertGoodsOption");
  } else {
    hide("convertGoodsOption");
  }
  var moveActions = playerData.moveActions;
  if (moveActions > 0) {
    setInnerHtml("moveActions", moveActions);
    show("moveOption");
  } else {
    for (var i=0; i<Object.keys(playerData.moveActionsFromLocation).length; i++) {
      var key = Object.keys(playerData.moveActionsFromLocation)[i];
      var moves = playerData.moveActionsFromLocation[key];
      moveActions = moveActions + moves;
    }
    if (moveActions > 0) {
      setInnerHtml("moveActions", moveActions);
      show("moveOption");
    } else {
      hide("moveOption");
    }
  }
  if (playerData.attackActions > 0) {
    setInnerHtml("attackActions", playerData.attackActions);
    show("attackOption");
  } else {
    hide("attackOption");
  }
  if (playerData.taxActions > 0) {
    setInnerHtml("taxActions", playerData.taxActions);
    show("taxOption");
  } else {
    hide("taxOption");
  }
  if (playerData.buildActions > 0) {
    setInnerHtml("buildActions", playerData.buildActions);
    show("buildOption");
  } else {
    hide("buildOption");
  }
  // TODO: check if leader can be deployed
  if (playerData.troopsToDeploy > 0) {
    setInnerHtml("musterActions", playerData.troopsToDeploy);    
    show("musterOption");
  } else {
    hide("musterOption");
  }
  if (playerData.schemeCards.length > 0 && playerData.schemeCardsCanPlay > 0) {
    show("schemeOption");
  } else {
    hide("schemeOption");
  }
  // TODO: check that the player has unfulfilled deed cards
  if (playerData.accomplishedDeedForTurn == false) {
    show("accomplishDeedOption");
  } else {
    hide("accomplishDeedOption");
  }
  show("actionPhaseDiv");
}

function performActionPhaseAction() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var actionPhaseActions = document.getElementsByName('actionPhaseAction');
  var actionPhaseActionValue = null;
  for (var i = 0; i < actionPhaseActions.length; i++){
      if (actionPhaseActions[i].checked){
        actionPhaseActionValue = actionPhaseActions[i].value;
      }
  }
  if (actionPhaseActionValue == "musterAction" || actionPhaseActionValue == "moveAction" || 
      actionPhaseActionValue == "attackAction" || actionPhaseActionValue =="taxAction" ||
      actionPhaseActionValue == "buildAction") {
    beginAction(gameId, color, actionPhaseActionValue);
  }
  if (actionPhaseActionValue == "endTurnAction") {
    endTurn(gameId, color);
  }
}
function endTurn(gameId, color) {
  callApi('/game/' + gameId + '/player/' + color + '/turn', "delete", "", endTurnResponseHandler);
}
function endTurnResponseHandler(response) {
  console.log("endTurnResponseHandler(): " + JSON.stringify(response.data));
  refreshGameStatus();
}

function beginAction(gameId, color, action) {
  console.log("beginAction(): " + gameId + " " + color + " " + action);
  var data = '{ "action": "' + action + '" }';
  callApi('/game/' + gameId + '/player/' + color + '/turn', "put", data, beginActionResponseHandler);
}
function beginActionResponseHandler(response) {
  console.log("beginActionResponseHandler(): " + JSON.stringify(response.data));
  refreshGameStatus();
}

function showMusterTroopsDiv() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  callApi('/game/' + gameId + '/player/' + color, "get", "", showMusterTroopsHandler1);
  
}
function showMusterTroopsHandler1(response) {
  console.log("showMusterTroopsHandler1(): " + JSON.stringify(response.data));
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var playerData = response.data;
  var selectMusterTroopCount = document.getElementById("selectMusterTroopCount");
  clearOptions(selectMusterTroopCount);
  for (var i=0; i<= playerData.troopsToDeploy; i++) {
    var option = document.createElement("option");
    option.innerText = i;
    option.value = i;
    selectMusterTroopCount.append(option);
  }
  callApi('/game/' + gameId + '/player/' + color + '/location', "get", "", showMusterTroopsHandler2);
}
function showMusterTroopsHandler2(response) {
  console.log("showMusterTroopsHandler2(): " + JSON.stringify(response.data));
  var selectLocation = document.getElementById("selectMusterTroopsLocation");
  clearOptions(selectLocation);
  var locations = response.data["occupies"];
  for (var i=0; i<locations.length; i++) {
    var locationName = locations[i];
    var option = document.createElement("option");
    option.innerText = locationName;
    option.value = locationName;
    selectLocation.append(option);
  }
  show("musterTroopsDiv");
}

function musterTroops() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var location = getSelectedValue("selectMusterTroopsLocation");
  var numberOfTroops = getSelectedValue("selectMusterTroopCount");
  var data = '{ "color": "' + color + '", "numberOfTroops": ' + numberOfTroops + '}';
  callApi("/game/" + gameId + "/location/" + location + "/troops", "put", data, placeTroopResponseHandler);
}

function cancelMusterTroops() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var data = '{ "action": "cancel" }';
  callApi('/game/' + gameId + '/player/' + color + '/turn', "put", data, beginActionResponseHandler);
}

function showMoveTroopsDiv() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  callApi('/game/' + gameId + '/player/' + color + '/location', "get", "", showMoveTroopsHandler);
}
function showMoveTroopsHandler(response) {
  console.log("showMoveTroopsHandler(): " + JSON.stringify(response.data));
  var selectFromLocation = document.getElementById("selectMoveFromLocation");
  clearOptions(selectFromLocation);
  var locations = response.data["occupies"];
  for (var i=0; i<locations.length; i++) {
    var locationName = locations[i];
    var option = document.createElement("option");
    option.innerText = locationName;
    option.value = locationName;
    selectFromLocation.append(option);
  }

  // TODO: update selectMoveToLocation based on selectMoveFromLocation
  var selectToLocation = document.getElementById("selectMoveToLocation");
  clearOptions(selectToLocation);
  var locations = response.data["neighbors"];
  for (var i=0; i<locations.length; i++) {
    var locationName = locations[i];
    var option = document.createElement("option");
    option.innerText = locationName;
    option.value = locationName;
    selectToLocation.append(option);
  }
  show("moveTroopsDiv");
}

function moveTroops() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  
  var fromLocation = getSelectedValue("selectMoveFromLocation");
  var toLocation = getSelectedValue("selectMoveToLocation");
  var moveLeader = 'N';
  var moveLeaderYN = document.getElementById("moveLeaderYN");
  if (moveLeaderYN.checked) {
    moveLeaderYN = getValue("moveLeaderYN");
  }
  var data = '{ "fromLocationName": "' + fromLocation + '", "toLocationName": "' + toLocation + '", "moveLeaderYN": "' + moveLeader + '" }';
  callApi("/game/" + gameId + "/player/" + color + "/move", "post", data, placeTroopResponseHandler);
}

function cancelMoveTroops() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var data = '{ "action": "cancel" }';
  callApi('/game/' + gameId + '/player/' + color + '/turn', "put", data, beginActionResponseHandler);
}


function showAttackDiv() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  callApi('/game/' + gameId + '/player/' + color + '/location', "get", "", showAttackHandler);
}
function showAttackHandler(response) {
  console.log("showAttackHandler(): " + JSON.stringify(response.data));
  var selectAttackLocation = document.getElementById("selectAttackLocation");
  clearOptions(selectAttackLocation);
  var locations = response.data["occupies"];
  for (var i=0; i<locations.length; i++) {
    var locationName = locations[i];
    var option = document.createElement("option");
    option.innerText = locationName;
    option.value = locationName;
    selectAttackLocation.append(option);
  }

  // TODO: update selectTargetToAttack based on location selection.
  show("attackDiv");
}

function attack() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  
  var attackLocation = getSelectedValue("selectAttackLocation");
  var target = getSelectedValue("selectTargetToAttack");
  var schemeDeckNumber = getSelectedRadioButton("attackSchemeDeck");
  var data = '{ "attackLocationName": "' + attackLocation + '", "target": "' + target + '", "schemeDeckNumber": "' + schemeDeckNumber + '" }';
  callApi("/game/" + gameId + "/player/" + color + "/attack", "post", data, placeTroopResponseHandler);
}

function cancelAttack() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var data = '{ "action": "cancel" }';
  callApi('/game/' + gameId + '/player/' + color + '/turn', "put", data, beginActionResponseHandler);
}

function showTaxDiv() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  callApi('/game/' + gameId + '/player/' + color + '/location', "get", "", showTaxHandler);
}
function showTaxHandler(response) {
  console.log("showTaxHandler(): " + JSON.stringify(response.data));
  var selectTaxLocation = document.getElementById("selectTaxLocation");
  clearOptions(selectTaxLocation);
  var locations = response.data["occupies"];
  // TODO: filter out locations that don't have any resources.
  for (var i=0; i<locations.length; i++) {
    var locationName = locations[i];
    var option = document.createElement("option");
    option.innerText = locationName;
    option.value = locationName;
    selectTaxLocation.append(option);
  }
  show("taxDiv");
}

function tax() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  
  var taxLocation = getSelectedValue("selectTaxLocation");
  var marketCoin = 'N';
  var marketCoinYN = document.getElementById("marketCoinYN");
  if (marketCoinYN.checked) {
    marketCoin = getValue("moveLeaderYN");
  }

  var data = '{ "locationName": "' + taxLocation + '", "marketCoinYN": "' + marketCoin + '" }';
  callApi("/game/" + gameId + "/player/" + color + "/tax", "post", data, placeTroopResponseHandler);
}

function cancelTax() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var data = '{ "action": "cancel" }';
  callApi('/game/' + gameId + '/player/' + color + '/turn', "put", data, beginActionResponseHandler);
}

function showBuildDiv() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  callApi('/game/' + gameId + '/player/' + color + '/location', "get", "", showBuildHandler);
}
function showBuildHandler(response) {
  console.log("showBuildHandler(): " + JSON.stringify(response.data));
  var selectBuildLocation = document.getElementById("selectBuildLocation");
  clearOptions(selectBuildLocation);
  var locations = response.data["occupies"];
  for (var i=0; i<locations.length; i++) {
    var locationName = locations[i];
    var option = document.createElement("option");
    option.innerText = locationName;
    option.value = locationName;
    selectBuildLocation.append(option);
  }
  show("buildDiv");
}

function build() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  
  var buildLocation = getSelectedValue("selectBuildLocation");
  var building = getSelectedValue("selectBuilding");
  var data = '{ "locationName": "' + buildLocation + '", "building": "' + building + '" }';
  callApi("/game/" + gameId + "/player/" + color + "/build", "post", data, placeTroopResponseHandler);
}

function cancelBuild() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var data = '{ "action": "cancel" }';
  callApi('/game/' + gameId + '/player/' + color + '/turn', "put", data, beginActionResponseHandler);
}