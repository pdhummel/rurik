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
    setInnerHtml("tradeBoon", goodsOnDock["tradeBoon"]);
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
    var capturedRebels = response.data["boat"]["capturedRebels"];
    setInnerHtml("rebelCount", capturedRebels);
    var buildings = response.data["buildings"];
    setInnerHtml("tavernCount", buildings["tavern"]);
    setInnerHtml("stableCount", buildings["stable"]);
    setInnerHtml("marketCount", buildings["market"]);
    setInnerHtml("strongholdCount", buildings["stronghold"]);
    setInnerHtml("churchCount", buildings["church"]);
    if (response.data.isFirstPlayer) {
      show("firstPlayerBear");
    } else {
      hide("firstPlayerBear");
    }
    if (response.data["boat"]["canPlayAttackConversionTile"]) {
      show("convertTroopAndMoneyForAttack");
    } else {
      hide("convertTroopAndMoneyForAttack");
    }
    if (response.data["boat"]["canPlayMusterConversionTile"]) {
      show("convertHoneyOrFishAndAnyForMuster");
    } else {
      hide("convertHoneyOrFishAndAnyForMuster");
    }
    if (response.data["boat"]["canPlayBuildConversionTile"]) {
      show("convertWoodOrStoneAndAnyForBuild");
    } else {
      hide("convertWoodOrStoneAndAnyForBuild");
    }

    // deedCards
    var deedCards = response.data.deedCards;
    var deedCardsDiv = document.getElementById("myDeedCardsDiv");
    deedCardsDiv.innerHTML = "";
    var playDeedCardChoices = document.getElementById("playDeedCardChoices");
    playDeedCardChoices.innerHTML = "";
    var rows = [];
    var accomplishRows = [];
    for (var i=0; i < deedCards.length; i++) {
      var deedCard = deedCards[i];
      var row = [];
      var accomplishRow = [];
      row.push(deedCard.name);
      row.push(deedCard.victoryPoints);
      row.push(deedCard.requirementText);
      row.push(deedCard.accomplished);
      rows.push(row);
      if (deedCard.accomplished == false) {
        accomplishRow.push('<input type="radio" id="accomplishDeedCard' + i + '" name="accomplishDeedCard" value="' + deedCard.name + '">');
        accomplishRow.push(deedCard.name);
        accomplishRow.push(deedCard.victoryPoints);
        accomplishRow.push(deedCard.requirementText);
        accomplishRows.push(accomplishRow);  
      }
    }
    var table = createTable(rows, ["Name", "VPs", "Description", "Accomplished?"], "white");
    var accomplishTable = createTable(accomplishRows, ["", "Name", "VPs", "Description"], "white");
    deedCardsDiv.appendChild(table);  
    playDeedCardChoices.appendChild(accomplishTable);
    show("myDeedCardsDiv");

    // secret agenda
    var secretAgendaCards = response.data.secretAgenda;
    var mySecretAgendaCardDiv = document.getElementById("mySecretAgendaCardDiv");
    if (secretAgendaCards.length > 0) {
      var secretAgendaCard = secretAgendaCards[0];
      mySecretAgendaCardDiv.innerHTML = '<span style="color:black;background-color:white">(' + secretAgendaCard.points + ') ' + secretAgendaCard.name + ': ' + secretAgendaCard.text + '</span>';
      show("mySecretAgendaCardDiv");
    } else {
      mySecretAgendaCardDiv.innerHTML = "";
      hide("mySecretAgendaCardDiv");
    }
  }
  
  