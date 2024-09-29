function refreshPlayer() {
    var gameId = getInnerHtmlValue("gameId");
    var color = getInnerHtmlValue("myColor");
    var selectedColor = getSelectedValue("selectPlayerBoat");
    if (color == selectedColor || selectedColor == "" || selectedColor == null) {
      if (gameId != undefined && gameId != null && color != undefined && color != null) {
        changeSupplyImages(color);
        callApi('/game/' + gameId + '/player/' + color, "get", "", refreshPlayerResponseHandler);
      } 
    }
  }
  function refreshPlayerResponseHandler(response) {
    console.log("refreshPlayerResponseHandler(): " + JSON.stringify(response.data));
    var color = response.data.color;
    this.refreshPlayerAdvisors(response);
    this.refreshPlayerBoatAndSupply(response);
    this.refreshPlayerCards(response);
  }

  function selectPlayerBoatChanged() {
    var gameId = getInnerHtmlValue("gameId");
    var color = getSelectedValue("selectPlayerBoat");
    if (color == undefined && color == null || color == "") {
      var color = getInnerHtmlValue("myColor");
    }
    if (gameId != undefined && gameId != null && color != undefined && color != null) {
      callApi('/game/' + gameId + '/player/' + color, "get", "", refreshOtherPlayer);
    } 
  }

  function refreshOtherPlayer(response) {
    console.log("refreshOtherPlayer(): " + JSON.stringify(response.data));
    var color = response.data.color;
    changeSupplyImages(color);
    this.refreshPlayerBoatAndSupply(response);
  }

  function changeSupplyImages(color) {
    document.getElementById("tavernImage").src = "/assets/tavern-" + color + ".png";
    document.getElementById("stableImage").src = "/assets/stable-" + color + ".png";
    document.getElementById("marketImage").src = "/assets/market-" + color + ".png";
    document.getElementById("churchImage").src = "/assets/church-" + color + ".png";
    document.getElementById("strongholdImage").src = "/assets/stronghold-" + color + ".png";
    document.getElementById("troopImage").src = "/assets/troop-" + color + ".png";
  }

  
  function refreshPlayerAdvisors(response) {
    console.log("refreshPlayerAdvisors(): " + JSON.stringify(response.data));
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
    console.log("refreshPlayerAdvisors(): advisors=" + advisors);
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
  }


  function refreshPlayerCards(response) {
    console.log("refreshPlayerCards(): " + JSON.stringify(response.data));
    var color = response.data.color;

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
      var rewardString = getRewardsForDeedCard(deedCard);
      var row = [];
      var accomplishRow = [];
      row.push(deedCard.name);
      row.push(deedCard.victoryPoints);
      row.push(deedCard.requirementText);
      row.push(rewardString);
      row.push(deedCard.accomplished);
      rows.push(row);
      if (deedCard.accomplished == false) {
        accomplishRow.push('<input type="radio" id="accomplishDeedCard' + i + '" name="accomplishDeedCard" value="' + deedCard.name + '">');
        accomplishRow.push(deedCard.name);
        accomplishRow.push(deedCard.victoryPoints);
        accomplishRow.push(deedCard.requirementText);
        accomplishRow.push(rewardString);
        accomplishRows.push(accomplishRow);  
      }
    }
    var table = createTable(rows, ["Name", "VPs", "Description", "Reward", "Accomplished?"], "white");
    var accomplishTable = createTable(accomplishRows, ["", "Name", "VPs", "Description", "Reward"], "white");
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
    
  function refreshPlayerBoatAndSupply(response) {
    console.log("refreshPlayerBoatAndSupply(): " + JSON.stringify(response.data));
    var color = response.data.color;
    setInnerHtml("boatLeaderText", "<i>" + response.data.leader.description + "</i>");
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
    var supplyLeader = response.data["supplyLeader"];
    setInnerHtml("leaderCount", supplyLeader);
    if (supplyLeader > 0) {
      show("supplyLeader");
    } else {
      hide("supplyLeader");
    }
    var buildings = response.data["buildings"];
    setInnerHtml("tavernCount", buildings["tavern"]);
    setInnerHtml("stableCount", buildings["stable"]);
    setInnerHtml("marketCount", buildings["market"]);
    setInnerHtml("strongholdCount", buildings["stronghold"]);
    setInnerHtml("churchCount", buildings["church"]);
    var victoryPointTokens = response.data["victoryPoints"];
    setInnerHtml("victoryPointTokens", victoryPointTokens);
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
    var completedDeedCards = 0;
    var deedCards = response.data["deedCards"];
    if (deedCards != undefined && deedCards != null) {
      for (var i=0; i < deedCards.length; i++) {
        if (deedCards[i].accomplished == true) {
          completedDeedCards++;
        }
      }
    }
    setInnerHtml("accomplishedDeedsCount", completedDeedCards);
    var schemeCardCount = 0;
    var schemeCards = response.data["schemeCards"];
    if (schemeCards != undefined && schemeCards != null) {
      schemeCardCount = schemeCards.length;
    }
    setInnerHtml("schemeCardsCount", schemeCardCount);
  }
    