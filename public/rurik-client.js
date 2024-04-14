
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
  selectGameId2 = document.getElementById("selectGameId2");
  clearOptions(selectGameId);
  clearOptions(selectGameId2);
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
    selectGameId2.append(element);
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
        playerSummary = playerSummary + '<input type="button" style="background-color: 	#696969; color:' + player.color + '" value="' + player.name + '-' + position + '" onclick=\'javascript:rejoinGame("' + games[key].gameId + '", "' + player.color + '");\' />';
      }
      
    }
    row.push(playerSummary);
    rows.push(row);
  }

  if (Object.keys(games).length > 0) {
    populateTable(rows, ["Game Id", "Game Name", "Status", "Players"]);
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
      document.getElementById("tavernImage").src = "/tavern-" + myColor + ".png";
      document.getElementById("marketImage").src = "/market-" + myColor + ".png";
      document.getElementById("churchImage").src = "/church-" + myColor + ".png";
      document.getElementById("strongholdImage").src = "/stronghold-" + myColor + ".png";
      document.getElementById("stableImage").src = "/stable-" + myColor + ".png";
      document.getElementById("troopImage").src = "/troop-" + myColor + ".png";
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
    } else if (currentState == "actionPhase") {
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
  if (gameId == undefined || gameId == null || gameId.length <= 0) {
    gameId = getSelectedValue("selectGameId2");
  }
  if (color == undefined || color == null || color.length <= 0) {
    color = getSelectedValue("selectColor2");
  }
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
      if (secretAgendas[i].checked){
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
    var imageFile = "/" + advisorNumToText[advisors[i]] + "-" + color + ".png";
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
  callApi("/game/" + gameId + "/auction/" + selectedAction, "put", data, placeAdvisorResponseHandler);
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
        // "/one-blue.png"
        var imageSrc = "/" + advisorNumToText[advisor] + "-" + color + ".png";
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