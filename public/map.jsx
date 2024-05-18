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
  
  
  