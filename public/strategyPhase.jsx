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
      show("strategyBoard-1-2");
    } else {
      show("strategyBoard-3-4");
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
  