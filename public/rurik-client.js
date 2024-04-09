
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
      var textNode = document.createTextNode(row[cell]);
      td.appendChild(textNode);
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
    var playerSummary = games[key].numberOfPlayers + " of " + games[key].targetNumberOfPlayers;
    if (games[key].numberOfPlayers > 0) {
      playerSummary = playerSummary + " ( " + games[key].playerNames + ")";
    }
    row.push(playerSummary);
    rows.push(row);
  }
  if (Object.keys(games).length > 0) {
    populateTable(rows, ["Game Id", "Game Name", "Status", "Players"]);
    show("joinGameDiv");
    show("rejoinGameDiv");
  }
}

function createGame() {
  var data = '{ "gameName": "' + document.getElementById("gameName").value + '" }';
  callApi("/game", "post", data, createGameResponseHandler);
}
function createGameResponseHandler(response) {
  console.log("listGamesResponseHandler(): " + response.data);
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
  }
}
function refreshGameStatusResponseHandler(response) {
    console.log("refreshGameStatusResponseHandler(): " + JSON.stringify(response.data));
    var myColor = getInnerHtmlValue("myColor");
    var gameId = getInnerHtmlValue("gameId");
    var gameStatus = response.data;
    var gameName = gameStatus.gameName;
    var currentState = gameStatus.currentState;
    var currentPlayer = gameStatus.currentPlayer;
    var status = currentState;
    var clientLeader = gameStatus.clientLeader;
    var clientPosition = gameStatus.clientPosition;
    if (clientLeader != undefined && clientLeader != null && 
        clientLeader.name != undefined && clientLeader.name != null && clientLeader.name.length > 0) {
      setInnerHtml("leader", clientLeader.name);
    } else {
      setInnerHtml("leader", ". . . ?");
    }
    if (currentPlayer != undefined) {
      status = status + " Current Player:" + currentPlayer;
    }
    setInnerHtml("gameStatusName", gameName);
    setInnerHtml("gameStatus", status);
    console.log("refreshGameStatusResponseHandler: currentState=" + currentState + ", currentPlayer=" + currentPlayer + ", myColor=" + myColor);

    if (currentState == "waitingForPlayers") {
      show("startGameDiv");
    } else {
      hide("startGameDiv");
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
}
function leaderResponseHandler(response) {
  console.log("leaderResponseHandler(): " + JSON.stringify(response.data));
  selectLeader = document.getElementById("selectLeader");
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
  if (gameId != undefined) {
    var data = '{ "color": "' + color + '", "position": "' + position + '", "name":"' + name + '" }'
    callApi("/game/" + gameId + "/player", "post", data, joinGameResponseHandler);
    setInnerHtml("gameId", gameId);
    setInnerHtml("myName", name);
    setInnerHtml("myPosition", position);
    setInnerHtml("myColor", color);
  }
}
function joinGameResponseHandler(response) {
    console.log("joinGameResponseHandler(): " + JSON.stringify(response.data));
    refreshGameStatus();
    show("statusDiv");
    hide("gameListDiv");
    hide("createGameDiv");
    hide("joinGameDiv");
    hide("rejoinGameDiv");
}

function rejoinGame() {
  var gameId = getSelectedValue("selectGameId2");
  var color = getSelectedValue("selectColor2");
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
