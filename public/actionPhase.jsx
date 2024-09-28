function showOrHideActionPhases(currentState, currentPlayerColor) {
  console.log("showActionPhases(): currentState=" + currentState);
  var myColor = getInnerHtmlValue("myColor");
  if (currentState == "actionPhase" && currentPlayerColor == myColor) {
    showActionPhaseDiv();
  } else {
    hide("actionPhaseDiv");
  }
  if (currentState == "actionPhaseMuster" && currentPlayerColor == myColor) {
    showMusterTroopsDiv();
  } else {
    hide("musterTroopsDiv");
  }
  if (currentState == "actionPhaseMove" && currentPlayerColor == myColor) {
    showMoveTroopsDiv();
  } else {
    hide("moveTroopsDiv");
  }
  if (currentState == "actionPhaseAttack" && currentPlayerColor == myColor) {
    showAttackDiv();
  } else {
    hide("attackDiv");
  }
  if (currentState == "actionPhaseTax" && currentPlayerColor == myColor) {
    showTaxDiv();
  } else {
    hide("taxDiv");
  }
  if (currentState == "actionPhaseBuild" && currentPlayerColor == myColor) {
    showBuildDiv();
  } else {
    hide("buildDiv");
  }
  if (currentState == "actionPhaseTransfer" && currentPlayerColor == myColor) {
    showTransferGoodsDiv();
  } else {
    hide("transferGoodsDiv");
  }
  if (currentState == "actionPhasePlaySchemeCard" && currentPlayerColor == myColor) {
    show("playSchemeCardDiv");
  } else {
    hide("playSchemeCardDiv");
  }
  
  if ((currentState == "takeDeedCardForActionPhase" || currentState == "takeDeedCardForClaimPhase") && currentPlayerColor == myColor) {
    show("takeDeedCardDiv");
  } else {
    hide("takeDeedCardDiv");
  }

  if (currentState == "actionPhasePlayConversionTile" && currentPlayerColor == myColor) {
    showPlayConversionTile();
  } else {
    hide("playConversionTileDiv");
  }

  if (currentState == "actionPhaseAccomplishDeed" && currentPlayerColor == myColor) {
    showAccomplishDeed();
  } else {
    hide("accomplishDeedDiv");
  }

  if (currentState == "actionPhaseVerifyDeed" && currentPlayerColor == myColor) {
    showVerifyDeed();
  } else {
    hide("verifyDeedDiv");
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
    var playerData = response.data;

    if (playerData.leader.name == "Maria" && 1==0) {
      show("mariaMusterOption");
    } else {
      hide("mariaMusterOption");
    }
    if (playerData.leader.name == "Agatha" && 1==0) {
      show("agathaMoveOption");
    } else {
      hide("agathaMoveOption");
    }
    if (playerData.leader.name == "Gleb" && 1==0) {
      show("glebAttackOption");
    } else {
      hide("glebAttackOption");
    }
    if (playerData.leader.name == "Sudislav" && 1==0) {
      show("sudislavOption");
    } else {
      hide("sudislavOption");
    }
    if (playerData.leader.name == "Theofona" && 1==0) {
      show("theofonaTaxOption");
    } else {
      hide("theofonaTaxOption");
    }
    if (playerData.leader.name == "Sviatoslav" && 1==0) {
      show("sviatoslavBuildOption");
    } else {
      hide("sviatoslavBuildOption");
    }
    if (playerData.leader.name == "Predslava" && 1==0) {
      show("predslavaOption");
    } else {
      hide("predslavaOption");
    }

    if (playerData.convertedGoodsForTurn == false && 
      (playerData.boat.canPlayAttackConversionTile || playerData.boat.canPlayBuildConversionTile || playerData.boat.canPlayMusterConversionTile)) {
        show("convertGoodsOption");
    } else {
      hide("convertGoodsOption");
    }
    var moveActions = playerData.moveActions;
    if (moveActions > 0 || playerData.moveAnywhereActions > 0) {
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

    //if (playerData.boat.goodsOnDock[""] > 0 || playerData.boat.goodsOnBoat[""]> 0) {
    //  show("transferGoodsOption");
    //} else {
    //  hide("transferGoodsOption");
    //}

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
        actionPhaseActionValue == "buildAction" || actionPhaseActionValue == "transferGoodsAction" ||
        actionPhaseActionValue == "schemeAction" || actionPhaseActionValue == "convertGoodsAction" || 
        actionPhaseActionValue == "accomplishDeedAction") {
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
      moveLeader = getValue("moveLeaderYN");
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
    var targetToConvert = getSelectedValue("selectTargetToConvert");
    var data = '{ "locationName": "' + buildLocation + '", "building": "' + building + '", "targetToConvert": "' + targetToConvert + '" }';
    callApi("/game/" + gameId + "/player/" + color + "/build", "post", data, refreshGameHandler);
  }
  
  function cancelBuild() {
    var gameId = getInnerHtmlValue("gameId");
    var color = getInnerHtmlValue("myColor");
    var data = '{ "action": "cancel" }';
    callApi('/game/' + gameId + '/player/' + color + '/turn', "put", data, beginActionResponseHandler);
  }

  function selectBuildingChanged() {
    var building = getSelectedValue("selectBuilding");
    if (building == "church") {
      show("targetToConvertDiv", "inline");
    } else {
      hide("targetToConvertDiv");
    }
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

  function cancelAction() {
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

  function showDeedCardChoices() {
    show("takeDeedCardDiv");
  }
  
  function returnSchemeCard() {
    var gameId = getInnerHtmlValue("gameId");
    var color = getInnerHtmlValue("myColor");
    var schemeCard = getSelectedValue("selectReturnSchemeCard");
    var data = '{ "schemeCard": "' + schemeCard + '"}';
    callApi("/game/" + gameId + "/player/" + color + "/schemeCard", "delete", data, refreshGameHandler);
  }
  
  function playSchemeCard() {
    var gameId = getInnerHtmlValue("gameId");
    var color = getInnerHtmlValue("myColor");
    var schemeCard = getSelectedValue("selectPlaySchemeCard");
    var schemeCardActionChoice = getSelectedValue("schemeCardOrSelect");
    var data = '{ "schemeCard": "' + schemeCard + '", "schemeCardActionChoice": "' + schemeCardActionChoice + '"}';
    callApi("/game/" + gameId + "/player/" + color + "/schemeCard", "post", data, refreshGameHandler);
  }
  
  function selectPlaySchemeCardChanged() {
    var schemeCardOrSelect = document.getElementById("schemeCardOrSelect");
    clearOptions(schemeCardOrSelect);
    var schemeCardId = getSelectedValue("selectPlaySchemeCard");
    var parts = schemeCardId.split("-");
    var reward = parts.shift();
    // buildOrAttack, taxOrMuster
    if (reward.indexOf("Or") == -1) {
      hide("schemeCardOrSelect");
    } else {
      var orRewards = reward.split("Or");
      var reward1 = orRewards[0].toLowerCase(); 
      var reward2 = orRewards[1].toLowerCase(); 
      var option = document.createElement("option");
      option.value = reward1;
      option.innerText = reward1;
      schemeCardOrSelect.append(option);
      option = document.createElement("option");
      option.value = reward2;
      option.innerText = reward2;
      schemeCardOrSelect.append(option);
      show("schemeCardOrSelect", "inline");  
    }
  }

  function takeDeedCard() {
    var gameId = getInnerHtmlValue("gameId");
    var color = getInnerHtmlValue("myColor");
    var deedCard = getSelectedRadioButton("deedCardChoice");
    var data = '{ "deedCard": "' + deedCard + '"}';
    callApi("/game/" + gameId + "/player/" + color + "/takeDeedCard", "put", data, refreshGameHandler);
  }

  function showPlayConversionTile() {
    var gameId = getInnerHtmlValue("gameId");
    var color = getInnerHtmlValue("myColor");
    if (gameId != undefined && gameId != null && color != undefined && color != null) {
      callApi('/game/' + gameId + '/player/' + color, "get", "", showPlayConversionTileHandler);
    } 
  }
  function showPlayConversionTileHandler(response) {
    var player = response.data;
    console.log("showPlayConversionTileHandler():" + JSON.stringify(player));
    var selectConversionTile = document.getElementById("selectConversionTile");
    clearOptions(selectConversionTile);

    if (player.boat.canPlayAttackConversionTile) {
      var option = document.createElement("option");
      option.innerText = "Attack: Pay a rebel + 2 coins.";
      option.value = "attack";
      selectConversionTile.append(option);
    }
    if (player.boat.canPlayBuildConversionTile) {
      var option = document.createElement("option");
      option.innerText = "Build: Pay wood or stone + another resource.";
      option.value = "build";
      selectConversionTile.append(option);
    }
    if (player.boat.canPlayMusterConversionTile) {
      var option = document.createElement("option");
      option.innerText = "Muster: Pay honey or fish + another resource.";
      option.value = "muster";
      selectConversionTile.append(option);
    }
    selectConversionTileChanged();
    show("playConversionTileDiv");
  }

  function selectConversionTileChanged() {
    var selectConvertResource1 = document.getElementById("selectConvertResource1");
    clearOptions(selectConvertResource1);
    var selectConvertResource2 = document.getElementById("selectConvertResource2");
    clearOptions(selectConvertResource2);

    var value = getSelectedValue("selectConversionTile");
    if (value == "attack") {
      hide("selectConvertResource1");
      hide("selectConvertResource2");
    }
    if (value == "muster") {
      addSimpleOptions(selectConvertResource1, ["fish", "honey", "tradeBoon"]);
      show("selectConvertResource1", "inline");

      addSimpleOptions(selectConvertResource2, ["fish", "fur", "honey", "stone", "wood", "tradeBoon" ]);
      show("selectConvertResource2", "inline");
    }

    if (value == "build") {
      addSimpleOptions(selectConvertResource1, ["stone", "wood", "tradeBoon"]);
      show("selectConvertResource1", "inline");

      addSimpleOptions(selectConvertResource2, ["fish", "fur", "honey", "stone", "wood", "tradeBoon"]);
      show("selectConvertResource2", "inline");
    }
  }

function playConversionTile() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var conversionTile = getSelectedValue("selectConversionTile");
  var resource1 = getSelectedValue("selectConvertResource1");
  var resource2 = getSelectedValue("selectConvertResource2");
  var data = '{ "conversionTile": "' + conversionTile + '", "resource1": "' + resource1 +  '", "resource2": "' + resource2 + '" }';
  callApi("/game/" + gameId + "/player/" + color + "/conversionTile", "post", data, refreshGameHandler);
}

function showAccomplishDeed() {
  console.log("showAccomplishDeed()");
  selectClaimStatementChanged(0);
  selectClaimStatementChanged(1);
  selectClaimStatementChanged(2);
  selectClaimStatementChanged(3);
  selectClaimStatementChanged(4);
  show("accomplishDeedDiv");

}

function selectClaimStatementChanged(i) {
  var selectId = "claimStatement" + i;
  var value = getSelectedValue(selectId);
  if (value == "assert") {
    show("claimAssertionSpan" + i, "inline");
    hide("claimPayChoice" + i);
    hide("claimRemoveChoice" + i);
    hide("claimPaySchemeCardChoice" + i);
    hide("claimRemoveSpan0");
    hide("claimRemoveBuildingChoice" + i);
    hide("claimPayResourceChoice" + i);
  } else if (value == "pay") {
    hide("claimAssertionSpan" + i);
    show("claimPayChoice" + i, "inline");
    hide("claimRemoveChoice" + i);
    hide("claimPaySchemeCardChoice" + i);
    hide("claimRemoveSpan" + i);
    hide("claimRemoveBuildingChoice" + i);
    hide("claimPayResourceChoice" + i);
    var childSelectId = "claimPayChoice" + i;
    document.getElementById(childSelectId).value = "coin";
  } else if (value == "remove") {
    hide("claimAssertionSpan" + i);
    hide("claimPayChoice" + i);
    show("claimRemoveChoice" + i, "inline");
    hide("claimPaySchemeCardChoice" + i);
    show("claimRemoveSpan" + i, "inline");
    hide("claimRemoveBuildingChoice" + i);
    hide("claimPayResourceChoice" + i);
    var childSelectId = "claimRemoveChoice" + i;
    document.getElementById(childSelectId).value = "troop";
  }
}

function selectClaimPayChoiceChanged(i) {
  var selectId = "claimPayChoice" + i;
  var value = getSelectedValue(selectId);
  if (value == "coin") {
    hide("claimPayResourceChoice" + i);
    hide("claimPaySchemeCardChoice" + i);
  } else if (value == "resource") {
    show("claimPayResourceChoice" + i, "inline");
    hide("claimPaySchemeCardChoice" + i);
  } else if (value == "scheme card") {
    hide("claimPayResourceChoice" + i);
    show("claimPaySchemeCardChoice" + i, "inline");
  }
}

function selectClaimRemoveChoiceChanged(i) {
  var selectId = "claimRemoveChoice" + i;
  var value = getSelectedValue(selectId);
  if (value == "troop") {
    hide("claimRemoveBuildingChoice" + i);
  } else if (value == "building") {
    show("claimRemoveBuildingChoice" + i, "inline");
  }
}

function accomplishDeed() {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var data = {};
  var deedCardName = getSelectedRadioButton("accomplishDeedCard");
  data['deedCardName'] = deedCardName;  
  var claimStatements = [];
  for (var i=0; i<5; i++) {
    var claimStatement = {};
    claimStatement.claimPayChoice = getSelectedValue("claimPayChoice" + i);
    claimStatement.claimStatementChoice = getSelectedValue("claimStatement" + i);
    claimStatement.claimRemoveChoice = getSelectedValue("claimRemoveChoice" + i);
    claimStatement.claimPayResourceChoice = getSelectedValue("claimPayResourceChoice" + i);
    claimStatement.claimPaySchemeCardChoice = getSelectedValue("claimPaySchemeCardChoice" + i);
    claimStatement.claimRemoveBuildingChoice = getSelectedValue("claimRemoveBuildingChoice" + i);
    claimStatement.claimRemoveLocationChoice = getSelectedValue("claimRemoveLocationChoice" + i);
    claimStatement.claimAssertion = getValue("claimAssertion" + i);
    claimStatements.push(claimStatement);
  }
  data.claimStatements = claimStatements;
  var postData = JSON.stringify(data);
  console.log("accomplishDeed(): data=" + postData);
  callApi("/game/" + gameId + "/player/" + color + "/deed", "post", postData, refreshGameHandler);
}

function showVerifyDeed() {
  var gameId = getInnerHtmlValue("gameId");
  callApi("/game/" + gameId + "/deedToVerify", "get", "", showVerifyDeedHandler);
}

function showVerifyDeedHandler(response) {
  console.log("showVerifyDeedHandler():" + JSON.stringify(response.data));
  var deedCard = response.data;
  var deedCardToVerifyDiv = document.getElementById("deedCardToVerifyDiv");
  deedCardToVerifyDiv.innerHTML = "";
  var accomplishRows = [];
  var accomplishRow = [];
  accomplishRow.push(deedCard.name);
  accomplishRow.push(deedCard.victoryPoints);
  accomplishRow.push(deedCard.requirementText);
  accomplishRows.push(accomplishRow);  
  var table = createTable(accomplishRows, ["Name", "VPs", "Description"], "white");
  deedCardToVerifyDiv.appendChild(table);
  var verifyDeedTableDiv = document.getElementById("verifyDeedTableDiv");
  var claimStatements = deedCard.summarizedClaimStatements;
  var claimStatementRows = [];
  for (var i=0; i < claimStatements.length; i++) {
    var claimStatementRow = [];
    claimStatementRow.push(claimStatements[i]);
    claimStatementRows.push(claimStatementRow);
  }
  var claimsTable = createTable(claimStatementRows, ["Assertions / Actions"], "white");
  verifyDeedTableDiv.innerHTML = ""
  verifyDeedTableDiv.appendChild(claimsTable);
  show("verifyDeedDiv");
}

function verifyDeed(isVerified) {
  var gameId = getInnerHtmlValue("gameId");
  var color = getInnerHtmlValue("myColor");
  var data = '{ "verified": ' + isVerified + ' }'
  callApi("/game/" + gameId + "/player/" + color + "/deed", "put", data, refreshGameHandler);
}
