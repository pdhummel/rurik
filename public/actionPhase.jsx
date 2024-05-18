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
        actionPhaseActionValue == "buildAction" || actionPhaseActionValue == "transferGoodsAction") {
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
    callApi("/game/" + gameId + "/player/" + color + "/move", "post", data, refreshGameHandler);
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
    callApi("/game/" + gameId + "/player/" + color + "/attack", "post", data, refreshGameHandler);
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
    callApi("/game/" + gameId + "/player/" + color + "/tax", "post", data, refreshGameHandler);
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
    callApi("/game/" + gameId + "/player/" + color + "/build", "post", data, refreshGameHandler);
  }
  
  function cancelBuild() {
    var gameId = getInnerHtmlValue("gameId");
    var color = getInnerHtmlValue("myColor");
    var data = '{ "action": "cancel" }';
    callApi('/game/' + gameId + '/player/' + color + '/turn', "put", data, beginActionResponseHandler);
  }
  
  
  function showTransferGoodsDiv() {
    show("transferGoodsDiv");
  }
  
  function transferGoods() {
    var gameId = getInnerHtmlValue("gameId");
    var color = getInnerHtmlValue("myColor");
    var direction = getSelectedRadioButton("transferGoodsDirection");
    var resource = getSelectedValue("resourceToTransfer");
    var data = '{ "direction": "' + direction + '", "resource": "' + resource + '" }';
    callApi("/game/" + gameId + "/player/" + color + "/boat", "put", data, refreshGameHandler);
  }
  
  function cancelTransfer() {
    var gameId = getInnerHtmlValue("gameId");
    var color = getInnerHtmlValue("myColor");
    var data = '{ "action": "cancel" }';
    callApi('/game/' + gameId + '/player/' + color + '/turn', "put", data, beginActionResponseHandler);
  }
  
  function chooseSchemeDeck() {
    var gameId = getInnerHtmlValue("gameId");
    var color = getInnerHtmlValue("myColor");
    var pickFirstPlayer = getInnerHtmlValue("pickFirstPlayer");
    if (pickFirstPlayer == "1") {
      var firstPlayerColor = getSelectedValue("firstPlayerColor");
      var data = '{ "firstPlayerColor": "' + firstPlayerColor + '" }';
      callApi("/game/" + gameId + "/player/" + color + "/schemeFirstPlayer", "put", data, schemeFirstPlayerHandler);
    } else {
      var schemeDeck = getSelectedRadioButton("schemeDeck");
      var data = '{ "schemeDeck": "' + schemeDeck + '" }';
      callApi("/game/" + gameId + "/player/" + color + "/drawSchemeCards", "put", data, chooseSchemeDeckHandler);
    }
  }
  function schemeFirstPlayerHandler(response) {
    console.log("schemeFirstPlayerHandler(): " + JSON.stringify(response.data));
    setInnerHtml("pickFirstPlayer", 0);
    chooseSchemeDeck();
  }
  function chooseSchemeDeckHandler(response) {
    console.log("chooseSchemeDeckHandler(): " + JSON.stringify(response.data));
    refreshGameStatus();
  }
  
  
  function showReturnSchemeCard(player) {
    console.log("showReturnSchemeCard():" + JSON.stringify(player));
    var temporarySchemeCards = player.temporarySchemeCards;
    var selectSchemeCard = document.getElementById("selectReturnSchemeCard");
    clearOptions(selectSchemeCard);
    for (var i=0; i<3; i++) {
      if (i < temporarySchemeCards.length) {
        var schemeCard = temporarySchemeCards[i];
        var option = document.createElement("option");
        option.value = schemeCard.id;
        var parts = schemeCard.id.split("-");
        var deaths = parts.pop();
        var cost = parts.pop();
        var schemeDescription = parts.join("+");
        option.innerText = i+1 + ") " + schemeDescription;
        selectSchemeCard.append(option);
        outputSchemeCard("returnSchemeCardDiv"+i, schemeCard.id);
      } else {
        setInnerHtml("returnSchemeCardDiv"+i, "");
      }
    }
    show("returnSchemeCardDiv");
  }
  
  function returnSchemeCard() {
    var gameId = getInnerHtmlValue("gameId");
    var color = getInnerHtmlValue("myColor");
    var schemeCard = getSelectedValue("selectReturnSchemeCard");
    var data = '{ "schemeCard": "' + schemeCard + '"}';
    callApi("/game/" + gameId + "/player/" + color + "/schemeCard", "delete", data, refreshGameHandler);
  }
  