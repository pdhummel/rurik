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
      var deleteButton =  '<input type="button" style="background-color: 	#696969; color:black" value="Delete" onclick=\'javascript:deleteGame("' + games[key].gameId + '");\' />'
      row.push(deleteButton);
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

  function deleteGame(gameId) {
    callApi("/game/" + gameId, "delete", "", deleteGameHandler);
  }
  function deleteGameHandler(response) {
    console.log("deleteGameHandler(): " + response.data);
    listGames();
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

  function joinGame() {
    var gameId = getSelectedValue("selectGameId");
    var color = getSelectedValue("selectColor");
    var position = getSelectedValue("selectPosition");
    var name = getValue("playerName");
    var isAi = false;
    if (document.getElementById("isAi").checked) {
      isAi = true;
    }
    if (gameId != undefined && gameId != null && gameId.length > 0) {
      var data = '{ "color": "' + color + '", "position": "' + position + '", "name":"' + name + '", "isAi": "' + isAi + '" }'
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
      leftSideDiv.style.display = "table-cell";
      rightSideDiv.style.display = "table-cell"
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
      leftSideDiv.style.display = "table-cell";
      rightSideDiv.style.display = "table-cell";
      refreshGameStatus();
      setInnerHtml("myName", name);
      show("statusDiv");
      hide("gameListDiv");
      hide("createGameDiv");
      hide("joinGameDiv");
      hide("rejoinGameDiv");
    }
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