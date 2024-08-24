const lodash = require('lodash');

class AiAuction {
    constructor(advisor, action, coins) {
        this.advisor = advisor; // advisor number
        this.action = action;
        this.coins = coins;
    }
}

class AiStrategy {
    constructor(name, buildingOrder, auctions) {
        this.name = name;
        this.buildingOrder = buildingOrder; // array of building names
        this.auctions = auctions; // array of AiAuction
    }
}

class AiStrategyCard {
    constructor(id, strategies, locationOrder) {
        this.id = id;
        this.strategies = strategies; // map of AiStrategy - attack-move, build, tax
        this.locationOrder = locationOrder; // array of location names
    }
}

class Ai {
    
    constructor() {
        this.mapStateToFunction = {
            "waitingForLeaderSelection": "selectLeader",
            "waitingForSecretAgendaSelection": "selectSecretAgenda",
            "waitingForTroopPlacement": "placeInitialTroop",
            "waitingForLeaderPlacement": "placeLeader",
            "strategyPhase": "placeAdvisor",
            "retrieveAdvisor": "retrieveAdvisor",
            "actionPhase": "takeAction",
            "takeDeedCardForClaimPhase": "takeDeedCard",
            "takeDeedCardForActionPhase": "takeDeedCardForActionPhase",
            "schemeFirstPlayer": "schemeFirstPlayer",
            "drawSchemeCards": "drawSchemeCards",
            "selectSchemeCard": "selectSchemeCard",
            "endGame": "endGame"
        }
        this.aiCards = [];
        this.createAiCards();
    }

    evaluateGame(game) {
        var currentPlayer =  game.players.getCurrentPlayer();
        if (! currentPlayer.isPlayerAi) {
            return;
        }
        console.log("evaluateGame(): isPlayerAi=true");
        var currentPlayer =  game.players.getCurrentPlayer();
        var currentState = game.gameStates.currentState;
        if (currentState != undefined && currentState != null) {
            var currentStateName = currentState.name;
            var method = this.mapStateToFunction[currentStateName];
            if (method == undefined || method == null || method.length <= 0) {
                console.log("evaluateGame(): method not found for " + currentStateName);
                return
            }
            console.log("evaluateGame(): currentState=" + currentStateName + ", currentPlayer=" + currentPlayer.color + 
                ", method=" + method);
            try {
                this[method](game, currentPlayer);
            } catch(error) {
                console.log("ai evaluateGame(): " + error.message);
                //process.exit(1);
            }
    
        }        
    }

    selectLeader(game, player) {
        console.log("selectLeader()");
        var leaderNames = Object.keys(game.availableLeaders.availableLeaders);
        var r = Math.floor(Math.random() * leaderNames.length);
        var leaderName = leaderNames[r];
        game.chooseLeader(player.color, leaderName);
    }

    selectSecretAgenda(game, player) {
        console.log("selectSecretAgenda()");
        game.selectSecretAgenda(player.color, player.temporarySecretAgenda[0].name);
    }

    placeInitialTroop(game, player) {
        // TODO: consider an adjacent condensed or adjacent dispersed strategy.
        var r = Math.floor(Math.random() * game.gameMap.locationsForGame.length);
        var locationName = game.gameMap.locationsForGame[r].name;
        game.placeInitialTroop(player.color, locationName);
    }

    placeLeader(game, player) {
        // TODO: consider an adjacent condensed or adjacent dispersed strategy.
        var r = Math.floor(Math.random() * game.gameMap.locationsForGame.length);
        var locationName = game.gameMap.locationsForGame[r].name;
        game.placeLeader(player.color, locationName);
    }

    placeAdvisor(game, player) {
        if (player.aiCard == undefined || player.aiCard == null) {
            var r = Math.floor(Math.random() * this.aiCards.length);
            var aiCard = this.aiCards[r];
            player.aiCard = aiCard;
            var strategies = ["attack-move", "build", "tax"];
            r = Math.floor(Math.random() * strategies.length);
            player.aiStrategy = strategies[r];
        }
        var advisorsForRound = game.getAdvisorsForRound(game.players.getNumberOfPlayers(), game.currentRound-1);
        var aiStrategy = player.aiCard.strategies[player.aiStrategy];
        console.log("placeAdvisor(): aiCard=" + player.aiCard.id + " " + player.aiStrategy);
        var auctions = aiStrategy.auctions;
        var advisorNumber = 0;
        //var index = advisorsForRound.length - player.advisors.length;
        var index = 0;
        //console.log("placeAdvisor(): index=" + index);
        var auction = null;
        var success = false;
        // Using the AiStrategyCard, try to place the advisor per the curent turn. 
        // If that is not possible, move to the next turn recommendation on the AiStrategyCard.
        // The AiStrategyCards has some illegal moves which must be skipped.

        while (! success && index < auctions.length && player.advisors.length > 0) {
            //console.log("placeAdvisor(): " + player.color + " " + auction.action + " " + advisorNumber);
            try {
                auction = auctions[index];
                advisorNumber = auction.advisor;
                game.playAdvisor(player.color, auction.action, advisorNumber, auction.coins);
                success = true;
            } catch(error) {
                console.log("Could not place candidate advisor using strategy card: ", auction.action, advisorNumber, ": " + error.message);
                index++;
            }
        }
        if (! success) {
            console.log("placeAdvisor(): advisor could not be placed using strategy card");
        }
        var actions = ["muster", "move", "attack", "tax", "build", "scheme"];
        var actionsTried = new Set();
        while (! success && player.advisors.length > 0 && actionsTried.size < actions.length) {
            var r = Math.floor(Math.random() * actions.length);
            var action = actions[r];
            actionsTried.add(action);
            var advisor = player.advisors[0];
            try {
                game.playAdvisor(player.color, action, advisor, 0);
                success = true;
            } catch(error) {
                console.log("Could not place candidate advisor: ", action, advisor, ": " + error.message);
            }
        }
    }

    isAdvisorInList(advisor, advisorList) {
        var isInList = false;
        for (var i=0; i < advisorList.length; i++) {
            //console.log("isAdvisorInList(): advisor=" + advisor + ", i=" + i + ", advisorFromList=" + advisorList[i]);
            if (advisorList[i] == advisor) {
                return true;
            }
        }
        return isInList;
    }
    

    retrieveAdvisor(game, player) {
        console.log("ai retrieveAdvisor(): player=" + player.color + ", advisors=" + JSON.stringify(player.advisors));
        var color = player.color;
        var advisor = player.advisors[0];
        var advisorCount = player.advisors.length;
        var auctionSpaces = player.advisorsToAuctionSpace[advisor];
        var auctionSpace = auctionSpaces[0];
        var actionColumnName = auctionSpace.actionName;
        var row = auctionSpace.row;
        try {
            game.takeMainAction(color, advisor, actionColumnName, row);
        } catch(error) {
            console.log("ai retrieveAdvisor(): Warning player=" + player.color + " forfeiting " + auctionSpace.actionName);
            if (player.advisors.length < advisorCount) {
                player.boat.money++;
                player.tookMainActionForTurn = true;
                game.gameStates.setCurrentState("actionPhase");
                game.endTurn(player.color);
            } else {
                game.takeMainAction(color, advisor, actionColumnName, row, true); 
            }            
        }
    }

    takeAction(game, player) {
        console.log("ai takeAction(): player=" + player.color);
        // Clone the game and calculate current points for all players.
        var clonedGame = lodash.cloneDeep(game);
        var clonedPlayer = lodash.cloneDeep(player);
        var endGameStats = clonedGame.calculateEndGameStats();
        var decisionValue = this.calculateDecisionValue(clonedGame, clonedPlayer);
        
        /*
        actionToStateMap["transferGoodsAction"] = "actionPhaseTransfer";
        actionToStateMap["convertGoodsAction"] = "actionPhasePlayConversionTile";
        actionToStateMap["accomplishDeedAction"] = "actionPhaseAccomplishDeed";
        */

        var takeAction = true;
        //while (takeAction) {
            takeAction = false;
            if (player.schemeCards.length > 0 && player.schemeCardsCanPlay > 0) {
                this.playSchemeCard(game, player);
            }
            if (player.troopsToDeploy > 0) {
                if (this.muster(game, player)) {
                    takeAction = true;
                }
            }
            if (player.taxActions > 0) {
                if (this.tax(game, player)) {
                    takeAction = true;
                }
            }
            if (player.attackActions > 0) {
                if (this.attack(game, player)) {
                    takeAction = true;
                }
            }
            if (player.moveActions > 0) {
                if (this.move(game, player)) {
                    takeAction = true;
                }
            }
            if (player.buildActions > 0) {
                if (this.build(game, player)) {
                    takeAction = true;
                }
            }    
        //}
        // Determine candidate actions.
        // For each candidate action
            // Clone the game
            // Take the candidate action
            // Recalculate the decision value
            // if the decision value > current decision value, save candidate action as preferred action
        // Take preferred action
        // Re-evaluate if there are other actions available and repeat above.
        // End turn if there are no more actions.
        game.endTurn(player.color);
    }

    playSchemeCard(game, player) {
        console.log("ai playSchemeCard(): player=" + player.color);
        var color = player.color;
        // For now, just play the first scheme car available which won't be too smart,
        // but better than holding the cards for the whole game.
        if (player.boat.money >= 3) {
            var r = Math.floor(Math.random() * player.schemeCards.length);
            if (player.schemeCards[r].rewards.indexOf("deedCard") < 0) {
                game.beginActionPhaseAction(color, "schemeAction");
                game.playSchemeCard(color, player.schemeCards[r].id, null);    
            }
        }
    }

    muster(game, player) {
        console.log("ai muster(): player=" + player.color);
        var tookAction = false;
        var color = player.color;
        //var aiCard = player.aiCard;
        //var locationNames = aiCard.locationOrder.split(",");
    
        while (player.troopsToDeploy > 0 && player.supplyTroops + player.supplyLeader > 0) {
            var occupyMap = this.determineOccupiedLocations(player, game.gameMap.locationsForGame);
            var occupies = occupyMap["occupies"];
            var locationName = null;
            if (occupies.length > 0) {
                var occupiesButDoesNotRule = occupyMap["occupiesButDoesNotRule"];
                if (occupiesButDoesNotRule.length > 0) {
                    var r = Math.floor(Math.random() * occupiesButDoesNotRule.length);
                    locationName = occupiesButDoesNotRule[r];
                } else {
                    var rules = occupyMap["rules"];
                    var r = Math.floor(Math.random() * rules.length);
                    locationName = rules[r];
                }
            } else {
                // This should handle cases when wiped off the board.
                var r = Math.floor(Math.random() * game.gameMap.locationsForGame.length);
                locationName = game.gameMap.locationsForGame[r].name;
            }
            game.beginActionPhaseAction(color, "musterAction");
            game.muster(color, locationName, 1);
            tookAction = true;
        }
        return tookAction;
    }

    tax(game, player) {
        console.log("ai tax(): player=" + player.color);
        var tookAction = false;
        var color = player.color;
        var canTax = true;
        while (player.taxActions > 0 && canTax) {
            // Priorities:
            // locations with goods remaining
            // locations with goods needed
            // location ruled with market
            // location ruled
            // location occupied with market
            // location occupied


            // goodsNeeded = goodsOnBoatSlots - goodsOnBoat
            var goodsNeeded = new Set();
            var boat = player.boat;
            var goods = ["stone", "wood", "fish", "fur", "honey"];
            for (var i=0; i < goods.length; i++) {
                if (boat.goodsOnBoatSlots[goods[i]] - boat.goodsOnBoat[goods[i]] > 0) {
                    goodsNeeded.add(goods[i]);
                }
            }

            var locationsWithGoods = [];
            var locationsRuled = [];
            var locationsOccupied = [];
            var locationsWithMarket = [];
            var locationsWithNeededGoods = [];

            for (var i=0; i<game.gameMap.locationsForGame.length; i++) {
                var location = game.gameMap.locationsForGame[i];
                if (location.resourceCount > 0) {
                    locationsWithGoods.push(location);
                    if (goodsNeeded.has(location.defaultResource)) {
                        locationsWithNeededGoods.push(location);
                    }
                }
                if (location.doesPlayerHaveMarket(color)) {
                    locationsWithMarket.push(location);
                }
                if (location.doesRule(color)) {
                    locationsRuled.push(location);
                }
                if (location.doesOccupy(color)) {
                    locationsOccupied.push(location);
                }
            }

            canTax = false;
            var locationName = null;
            var intersectionSet = lodash.intersection(locationsWithGoods, locationsOccupied);
            if (intersectionSet.length > 0) {
                var intersectionSetGoodsNeeded = lodash.intersection(intersectionSet, locationsWithNeededGoods);
                if (intersectionSetGoodsNeeded.length > 0) {
                    var intersectionSetRuled = lodash.intersection(intersectionSetGoodsNeeded, locationsRuled);
                    if (intersectionSetRuled.length > 0) {
                        var intersectionSetRuledWithMarket = lodash.intersection(intersectionSetRuled, locationsWithMarket);
                        if (intersectionSetRuledWithMarket.length > 0) {
                            canTax = true;
                            console.log("tax(): intersectionSetRuledWithMarket=" + intersectionSetRuledWithMarket.length);
                            locationName = intersectionSetRuledWithMarket[0].name;
                        } else {
                            canTax = true;
                            console.log("tax(): intersectionSetRuled=" + intersectionSetRuled.length);
                            locationName = intersectionSetRuled[0].name;
                        }
                    } else {
                        if (player.taxActions > 1) {
                            canTax = true;
                            console.log("tax(): intersectionSetGoodsNeeded=" + intersectionSetGoodsNeeded.length);
                            locationName = intersectionSetGoodsNeeded[0].name;
                        }
                    }
                } else {
                    if (player.taxActions > 1) {
                        canTax = true;
                        console.log("tax(): intersectionSet=" + intersectionSet.length);
                        locationName = intersectionSet[0].name;
                    }
                }
            }
            if (canTax == true) {
                game.beginActionPhaseAction(color, "taxAction");
                game.tax(color, locationName);
                tookAction = true;
            }
        }
        return tookAction;
    }

    
    pickTarget(player, location, firstPlacePlayerColors, convert=false) {
        var target = null;
        var possibleTargets = [];
        if (location.rebels.length > 0) {
            possibleTargets.push("rebel");
        }
        var colors = ["blue", "white", "red", "yellow"];
        for (var i=0; i< colors.length; i++) {
            var color = colors[i];
            if (player.color == color) {
                continue;
            }
            if (location.troopsByColor[color] > 0 || (convert == false && location.leaderByColor[color] > 0)) {
                possibleTargets.push(color);
            }
        }
        var firstPlaceTargets = lodash.intersection(possibleTargets, firstPlacePlayerColors);
        if (firstPlaceTargets.length > 0) {
            target = firstPlaceTargets[0];
        } else {
            if (possibleTargets.length > 0) {
                target = possibleTargets[possibleTargets.length-1];
            }
        }
        return target;
    }

    attack(game, player) {
        console.log("ai attack(): player=" + player.color);
        var tookAction = false;
        var color = player.color;
        var canAttack = true;
        var clonedGame = lodash.cloneDeep(game);
        var endGameStats = clonedGame.calculateEndGameStats();
        var firstPlacePlayerColors = clonedGame.getFirstPlacePlayers(endGameStats);

        while (player.attackActions > 0 && canAttack) {
            // Priorities:
            // build or tax strategy - prefer to attack where rule
            // attack-move strategy - prefer to attack where do not rule
            // prefer to attack where can rule (0 -> +1 diff)
            // prefer to attack where can disrupt rule of another player (-1 -> 0 diff)
            // prefer to attack first place player
            // if in first place, prefer to attack second place player
            // prefer to attack another player vs. rebel 
            // prefer to attack human player vs. ai player

            canAttack = false;
            var occupyMap = this.determineOccupiedLocations(player, game.gameMap.locationsForGame);
            var occupiesButDoesNotRule = occupyMap["occupiesButDoesNotRule"];
            var rules = occupyMap["rules"];
            var occupies = occupyMap["occupies"];
            var locationsWithEnemies = [];
            var locationsWithRebels = [];
            var locationsWithOtherPlayers = [];
            for (var i=0; i<game.gameMap.locationsForGame.length; i++) {
                var location = game.gameMap.locationsForGame[i];
                if (location.rebels.length > 0) {
                    locationsWithEnemies.push(location.name);
                    locationsWithRebels.push(location.name);
                }
                if (location.hasPlayerEnemy(color)) {
                    locationsWithOtherPlayers.push(location.name);
                }
            }
            var locationName = null;
            var target = null;
            if (locationsWithEnemies.length > 0) {
                var occupiesWithEnemies = lodash.intersection(locationsWithEnemies, occupies);
                console.log("attack(): occupiesWithEnemies=" + JSON.stringify(occupiesWithEnemies));
                if (occupiesWithEnemies.length > 0) {
                    var r = Math.floor(Math.random() * occupiesWithEnemies.length);
                    var locationName = occupiesWithEnemies[r];
                    var location = game.gameMap.locationByName[locationName];
                    target = this.pickTarget(player, location, firstPlacePlayerColors);
                    console.log("attack(): target=" + target);
                    if (target != null) {
                        canAttack = true;
                    }
                }

                // TODO: implement preferences
                // attack-move, build, tax
                if (player.aiStrategy == "attack-move") {
                    // Prefer to attack where they do not rule.
                    if (occupiesButDoesNotRule.length > 0) {
                        var noRule = lodash.intersection(locationsWithEnemies, occupiesButDoesNotRule);
                        if (noRule.length > 0) {
                            
                        }
                    } else if (rules.length > 0) {

                    }
                } else {
                    // Prefer to attack where they do rule.
                }
            }
            if (canAttack) {
                game.beginActionPhaseAction(color, "attackAction");
                game.attack(color, locationName, target, 1);
                tookAction = true;
            }
    
        }
        return tookAction;
    }

    move(game, player) {
        console.log("ai move(): player=" + player.color);
        var tookAction = false;
        var color = player.color;
        var canMove = true;
        while (player.moveActions > 0 && canMove) {
            var canMove = false;
            // Priorities:
            // build or tax strategy - prefer to move to a location they do not occupy
            // attack-move strategy - prefer to move to a location they do not rule
            // will not move if it will make someone else gain rule
            // will not move if it will make them lose rule
            // prefers to move leader over troop
            var occupyMap = this.determineOccupiedLocations(player, game.gameMap.locationsForGame);
            var occupiesButDoesNotRule = occupyMap["occupiesButDoesNotRule"];
            var rules = occupyMap["rules"];
            var occupies = occupyMap["occupies"];
            var fromLocationName = null;
            var toLocationName = null;
            var moveLeader = false;
            var locationsForGameNames = game.gameMap.getLocationsForGameNames();
            for (var i=0; i<rules.length; i++) {
                moveLeader = false;
                fromLocationName = rules[i];
                console.log("move(): fromLocationName=" + fromLocationName);
                var fromLocation = game.gameMap.locationByName[fromLocationName];
                if (fromLocation.leaderByColor[color] > 0) {
                    console.log("move(): leader in fromLocation=" + JSON.stringify(fromLocation));
                    moveLeader = true;
                }
                var excess = fromLocation.calculateExcessTroopsForRule(color);
                if (excess > 1) {
                    var neighbors = fromLocation.neighbors;
                    console.log("move(): neighbors=" + neighbors);
                    var validNeighbors = lodash.intersection(locationsForGameNames, neighbors);
                    console.log("move(): validNeighbors=" + validNeighbors);
                    for (var n=0; n<validNeighbors.length; n++) {
                        var neighbor = game.gameMap.locationByName[validNeighbors[n]];
                        if (player.aiStrategy == "attack-move") {
                            if (neighbor.doesOccupy(color) && ! neighbor.doesRule(color)) {
                                toLocationName = validNeighbors[n];
                                canMove = true;
                                break;
                            }
                        } else {
                            if (! neighbor.doesOccupy(color)) {
                                toLocationName = validNeighbors[n];
                                canMove = true;
                                break;
                            }
                        }
                    }
                    if (! canMove) {
                        var r = Math.floor(Math.random() * validNeighbors.length);
                        toLocationName = validNeighbors[r];
                        canMove = true;
                    }
                    break;
                }
            }
            if (canMove) {
                game.beginActionPhaseAction(color, "moveAction");
                game.move(color, fromLocationName, toLocationName, 1, moveLeader);
                tookAction = true;
            }
        }
        return tookAction;
    }

    checkLocationForBuildingsToPlay(location, player) {
        console.log("checkLocationForBuildingsToPlay(): " + JSON.stringify(location) + " " + player.color);
        var locationBuildings = [];
        for (var i=0; i<location.buildings.length; i++) {
            locationBuildings.push(location.buildings[i].name);
        }
        var allBuildings = ["stable", "tavern", "church", "market", "stronghold"];
        var playerBuildings = [];
        for (var i=0; i<allBuildings.length; i++) {
            var building = allBuildings[i];
            if (player.buildings[building] > 0) {
                playerBuildings.push(building);
            }
        }
        var buildingsAllowed = [];
        //console.log("checkLocationForBuildingsToPlay(): locationBuildings=" + JSON.stringify(locationBuildings));
        //console.log("checkLocationForBuildingsToPlay(): playerBuildings=" + JSON.stringify(playerBuildings));
        var buildingsAllowedInLocation = lodash.difference(allBuildings, locationBuildings);
        console.log("checkLocationForBuildingsToPlay(): buildingsAllowedInLocation=" + JSON.stringify(buildingsAllowedInLocation));
        if (buildingsAllowedInLocation.length > 0) {
            var candidateBuildings = lodash.intersection(buildingsAllowedInLocation, playerBuildings);
            console.log("checkLocationForBuildingsToPlay(): candidateBuildings=" + JSON.stringify(candidateBuildings));
            for (var i=0; i < candidateBuildings.length; i++) {
                var candidate = candidateBuildings[i];
                if (candidate == "stable" && location.doesRule(player.color)) {
                    if (location.calculateExcessTroopsForRule(player.color) >= 3) {
                        buildingsAllowed.push(candidate);
                        break;                        
                    }
                }
                if (candidate == "tavern" && locationBuildings.length == 2) {
                    buildingsAllowed.push(candidate);
                    break;
                }
                if (candidate == "church" && location.hasEnemy(player.color)) {
                    buildingsAllowed.push(candidate);
                    break;
                }
                if (candidate == "stronghold" || candidate == "market") {
                    buildingsAllowed.push(candidate);
                }
            }
        }
        console.log("checkLocationForBuildingsToPlay(): buildingsAllowed=" + JSON.stringify(buildingsAllowed));
        return buildingsAllowed;        
    }

    pickLocationAndBuilding(gameMap, locationNames, player, buildingOrder) {
        var buildingAndLocation = {};
        buildingAndLocation["location"] = null;
        buildingAndLocation["building"] = null;
        for (var i=0; i < locationNames.length; i++) {
            buildingAndLocation["location"] = locationNames[i];
            var location = gameMap.locationByName[locationNames[i]];
            var buildingsAllowed = this.checkLocationForBuildingsToPlay(location, player);
            if (buildingsAllowed.length > 0) {
                // TODO: consider buildingOrder or at least use random
                buildingAndLocation["building"] = buildingsAllowed[0];
                break;
            }
        }
        return buildingAndLocation;
    }

    build(game, player) {
        console.log("ai build(): player=" + player.color);
        var tookAction = false;
        var color = player.color;
        var aiCard = player.aiCard;
        var gameMap = game.gameMap;
        var buildingOrder = aiCard.strategies[player.aiStrategy].buildingOrder;
        var canBuild = true;

        var locationsForGame = gameMap.locationsForGame;
        while (player.buildActions > 0 && canBuild) {
            var canBuild = false;
            // Priorities:
            // build where they rule
            // build where there are none of their buildings
            // build where there are enemy or neutral troops
            // build where there are no enemy or neutral troops
            var rules = [];
            var occupies = [];
            var enemies = [];
            var noPlayerBuildings = [];
            var openings = [];
            var targetToConvert = null;
            for (var i=0; i < locationsForGame.length; i++) {
                var location = locationsForGame[i];
                if (location.doesRule(color)) {
                    rules.push(location.name);
                }
                if (location.doesOccupy(color)) {
                    occupies.push(location.name);
                }
                if (location.hasPlayerEnemy(color)) {
                    enemies.push(location.name);
                }
                if (!location.doesPlayerHaveBuilding(color)) {
                    noPlayerBuildings.push(location.name);
                }
                if (location.buildings.length < 3) {
                    openings.push(location.name);
                }
            }
            var buildingAndLocation = null;
            var occupiesWithOpenings = lodash.intersection(occupies, openings);
            console.log("ai build(): rules=" + JSON.stringify(rules));
            console.log("ai build(): occupies=" + JSON.stringify(occupies));
            console.log("ai build(): openings=" + JSON.stringify(openings));
            console.log("ai build(): occupiesWithOpenings=" + JSON.stringify(occupiesWithOpenings));
            if (occupiesWithOpenings.length > 0) {
                var openWithNoPlayerBuildings = lodash.intersection(occupiesWithOpenings, noPlayerBuildings);
                if (openWithNoPlayerBuildings.length > 0) {
                    console.log("ai build(): openWithNoPlayerBuildings=" + JSON.stringify(openWithNoPlayerBuildings));
                    var rulesWithNoPlayerBuildings = lodash.intersection(rules, openWithNoPlayerBuildings);
                    if (rulesWithNoPlayerBuildings.length > 0) {
                        console.log("ai build(): rulesWithNoPlayerBuildings=" + JSON.stringify(rulesWithNoPlayerBuildings));
                        buildingAndLocation = this.pickLocationAndBuilding(gameMap, rulesWithNoPlayerBuildings, player, buildingOrder);
                        if (buildingAndLocation["location"] != null && buildingAndLocation["building"] != null) {
                            canBuild = true;
                        }
                    }
                    if (! canBuild) {
                        buildingAndLocation = this.pickLocationAndBuilding(gameMap, openWithNoPlayerBuildings, player, buildingOrder);
                        if (buildingAndLocation["location"] != null && buildingAndLocation["building"] != null) {
                            var location = gameMap.locationByName[buildingAndLocation["location"]];
                            if (location.doesRule(color) || player.buildActions >= 2) {
                                canBuild = true;
                            }
                        }
                    }
                }
                if (! canBuild) {
                    buildingAndLocation = this.pickLocationAndBuilding(gameMap, occupiesWithOpenings, player, buildingOrder);
                    if (buildingAndLocation["location"] != null && buildingAndLocation["building"] != null) {
                        var location = gameMap.locationByName[buildingAndLocation["location"]];
                        if (location.doesRule(color) || player.buildActions >= 2) {
                            canBuild = true;
                        }
                    }
                }
            }
            console.log("ai build(): buildingAndLocation=" + JSON.stringify(buildingAndLocation) + " " + canBuild);
            if (canBuild) {
                if (buildingAndLocation["building"] == "church") {
                    var clonedGame = lodash.cloneDeep(game);
                    var endGameStats = clonedGame.calculateEndGameStats();
                    var firstPlacePlayerColors = clonedGame.getFirstPlacePlayers(endGameStats);
                    var location = game.gameMap.locationByName[buildingAndLocation["location"]];
                    targetToConvert = this.pickTarget(player, location, firstPlacePlayerColors, true);
                    console.log("ai build(): targetToConvert=" + targetToConvert);
                }
                game.beginActionPhaseAction(color, "buildAction");
                game.build(color, buildingAndLocation["location"], buildingAndLocation["building"], targetToConvert);
                tookAction = true;
            }
        }
        return tookAction;
    }



    determineOccupiedLocations(player, locations) {
        var color = player.color;
        var occupyMap = {};
        var occupies = [];
        var rules = [];
        var occupiesButDoesNotRule = [];
        for (var i=0; i<locations.length; i++) {
            //var location = game.gameMap.locationByName[locations[i]];
            var location = locations[i];
            var locationName = location.name;
            if (location.doesOccupy(color)) {
                occupies.push(locationName);
                if (location.doesRule(color)) {
                    rules.push(locationName);
                } else {
                    occupiesButDoesNotRule.push(locationName);
                }
            }
        }
        occupyMap["occupiesButDoesNotRule"] = occupiesButDoesNotRule;
        occupyMap["occupies"] = occupies;
        occupyMap["rules"] = rules;
        return occupyMap;
    }

    calculateDecisionValue(game, player) {
        // Clone the game and calculate current points for all players.
        var clonedGame = lodash.cloneDeep(game);
        var gameEndStats = clonedGame.calculateEndGameStats();
        //console.log("takeAction(): gameEndStats=" + JSON.stringify(gameEndStats));
        // Descision value calculation:
        // + If winning, [ai points minus (second place points)] * 100.
        // - If losing, [ai points minus first place points] * 100.
        // + Money on-hand.
        // + Resources on dock.
        // + Troops on the board.
        var playerPoints = 0;
        var decisionValue = 0;
        var firstPlacePlayerPoints = 0;
        var secondPlacePlayerPoints = 0;
        var firstPlacePlayerColors = [];
        for (var i=0; i < clonedGame.players.sortedPlayers.length; i++) {
            var playerI = clonedGame.players.sortedPlayers[i];
            var colorI = playerI.color;
            var pointsI = gameEndStats["rule"]["color"] + gameEndStats["build"]["color"] + gameEndStats["trade"]["color"] + 
              + gameEndStats["warfare"]["color"]  + gameEndStats["vp"]["color"];
            if (pointsI > firstPlacePlayerPoints) {
                firstPlacePlayerColors = [];
                firstPlacePlayerPoints = pointsI;
                firstPlacePlayerColors.push(colorI);
            } else if (pointsI == firstPlacePlayerPoints) {
                firstPlacePlayerColors.push(colorI);
            }
            if (pointsI > secondPlacePlayerPoints && pointsI < firstPlacePlayerPoints) {
                secondPlacePlayerPoints = pointsI;
            }
            if (colorI == player.color) {
                playerPoints = pointsI;
            }
        }
        if (firstPlacePlayerPoints == playerPoints) {
            if (firstPlacePlayerColors.length > 1) {
                decisionValue = 0;
            } else {
                decisionValue = (firstPlacePlayerPoints - secondPlacePlayerPoints) * 100;
            }
        } else {
            decisionValue = (playerPoints - firstPlacePlayerPoints) * 100;
        }
        return decisionValue;
    }

    takeDeedCard(game, player) {
        console.log("ai takeDeedCard(): player=" + player.color);
        var color = player.color;
        var deedCardName = game.cards.displayedDeedCards[0].name;
        game.takeDeedCard(color, deedCardName)
    }

    takeDeedCardForActionPhase(game, player) {
        game.gameStates.setCurrentState("actionPhase");
    }

    schemeFirstPlayer(game, player) {
        console.log("ai schemeFirstPlayer(): player=" + player.color);
        var nextPlayer = game.players.getNextPlayer(player);
        game.schemeFirstPlayer(player.color, nextPlayer.color)
    }

    drawSchemeCards(game, player) {
        console.log("ai drawSchemeCards(): player=" + player.color);
        var r = Math.floor(Math.random() * 2);
        var schemeDeck = r + 1;
        game.drawSchemeCards(player.color, schemeDeck);
    }

    selectSchemeCard(game, player) {
        while (player.temporarySchemeCards.length > 0) {
            var schemeCard = player.temporarySchemeCards[0];
            if (player.temporarySchemeCards.length == 1) {
                console.log("ai selectSchemeCard() keep: player=" + player.color + " " + schemeCard.id);
                game.selectSchemeCardToKeep(player.color, schemeCard);
            } else {
                console.log("ai selectSchemeCard() return: player=" + player.color + " " + schemeCard.id);
                game.selectSchemeCardToReturn(player.color, player.returnSchemeDeck, schemeCard.id)
            }            
        }
    }

    endGame(game, player) {
    }

    createAiCards() {
        var aiStrategies = {};
        var auctions = [];
        auctions.push(new AiAuction(2, "scheme", 0));
        auctions.push(new AiAuction(4, "attack", 1));
        auctions.push(new AiAuction(1, "move", 0));
        auctions.push(new AiAuction(3, "move", 0));
        auctions.push(new AiAuction(5, "build", 0));
        auctions.push(new AiAuction(2, "muster", 0));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["stronghold", "church", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "attack", 0));
        auctions.push(new AiAuction(4, "muster", 0));
        auctions.push(new AiAuction(1, "scheme", 0));
        auctions.push(new AiAuction(3, "muster", 0));
        auctions.push(new AiAuction(5, "build", 1));
        auctions.push(new AiAuction(2, "move", 0));
        aiStrategies["build"] = new AiStrategy("build", ["church", "stronghold", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "scheme", 0));
        auctions.push(new AiAuction(4, "tax", 1));
        auctions.push(new AiAuction(1, "build", 0));
        auctions.push(new AiAuction(3, "tax", 0));
        auctions.push(new AiAuction(5, "move", 0));
        auctions.push(new AiAuction(2, "muster", 0));
        aiStrategies["tax"] = new AiStrategy("tax", ["market", "church", "stronghold"], auctions);
        var locationOrder = "Kiev,Volyn,Pereyaslavl,Chernigov,Polotsk,Smolensk,Rostov,Novgorod";
        this.aiCards.push(new AiStrategyCard(1, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(4, "muster", 0));
        auctions.push(new AiAuction(2, "attack", 1));
        auctions.push(new AiAuction(3, "build", 0));
        auctions.push(new AiAuction(1, "move", 1));
        auctions.push(new AiAuction(2, "scheme", 0));
        auctions.push(new AiAuction(5, "attack", 0));
        aiStrategies["attack-move"] = new AiStrategy("attack-mmove", ["stronghold", "church", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(4, "build", 0));
        auctions.push(new AiAuction(2, "tax", 0));
        auctions.push(new AiAuction(3, "scheme", 0));
        auctions.push(new AiAuction(1, "build", 0));
        auctions.push(new AiAuction(2, "attack", 0));
        auctions.push(new AiAuction(5, "muster", 1));
        aiStrategies["build"] = new AiStrategy("build", ["market", "stronghold", "church"], auctions);
        auctions = [];
        auctions.push(new AiAuction(4, "tax", 0));
        auctions.push(new AiAuction(2, "tax", 0));
        auctions.push(new AiAuction(3, "scheme", 0));
        auctions.push(new AiAuction(1, "move", 0));
        auctions.push(new AiAuction(2, "muster", 0));
        auctions.push(new AiAuction(5, "build", 1));
        aiStrategies["tax"] = new AiStrategy("tax", ["church", "market", "stronghold"], auctions);
        locationOrder = "Chernigov,Smolensk,Rostov,Polotsk,Kiev,Volyn,Novgorod,Pereyaslavl";
        this.aiCards.push(new AiStrategyCard(2, aiStrategies, locationOrder));


        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(2, "move", 0));
        auctions.push(new AiAuction(3, "attack", 0));
        auctions.push(new AiAuction(2, "muster", 0));
        auctions.push(new AiAuction(4, "muster", 1));
        auctions.push(new AiAuction(5, "attack", 0));
        auctions.push(new AiAuction(1, "scheme", 0));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["stronghold", "church", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "move", 0));
        auctions.push(new AiAuction(3, "tax", 0));
        auctions.push(new AiAuction(2, "muster", 0));
        auctions.push(new AiAuction(4, "attack", 1));
        auctions.push(new AiAuction(5, "build", 0));
        auctions.push(new AiAuction(1, "scheme", 0));
        aiStrategies["build"] = new AiStrategy("build", ["church", "stronghold", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "build", 0));
        auctions.push(new AiAuction(3, "move", 0));
        auctions.push(new AiAuction(2, "tax", 0));
        auctions.push(new AiAuction(4, "build", 0));
        auctions.push(new AiAuction(5, "tax", 0));
        auctions.push(new AiAuction(1, "scheme", 1));
        aiStrategies["tax"] = new AiStrategy("tax", ["market", "church", "stronghold"], auctions);
        locationOrder = "Polotsk,Kiev,Pereyaslavl,Chernigov,Smolensk,Novgorod,Volyn,Rostov";
        this.aiCards.push(new AiStrategyCard(3, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(3, "tax", 0));
        auctions.push(new AiAuction(4, "scheme", 0));
        auctions.push(new AiAuction(2, "muster", 0));
        auctions.push(new AiAuction(2, "attack", 1));
        auctions.push(new AiAuction(1, "move", 0));
        auctions.push(new AiAuction(5, "build", 0));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["stronghold", "church", "market"], auctions);        
        auctions = [];
        auctions.push(new AiAuction(3, "attack", 0));
        auctions.push(new AiAuction(4, "build", 0));
        auctions.push(new AiAuction(2, "scheme", 0));
        auctions.push(new AiAuction(2, "tax", 0));
        auctions.push(new AiAuction(1, "muster", 1));
        auctions.push(new AiAuction(5, "move", 0));
        aiStrategies["build"] = new AiStrategy("build", ["church", "stronghold", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(3, "muster", 0));
        auctions.push(new AiAuction(4, "move", 0));
        auctions.push(new AiAuction(2, "scheme", 0));
        auctions.push(new AiAuction(2, "build", 1));
        auctions.push(new AiAuction(1, "muster", 0));
        auctions.push(new AiAuction(5, "tax", 0));
        aiStrategies["tax"] = new AiStrategy("tax", ["market", "church", "stronghold"], auctions);
        var locationOrder = "Smolensk,Polotsk,Kiev,Chernigov,Novgorod,Pereyaslavl,Rostov,Volyn";
        this.aiCards.push(new AiStrategyCard(4, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(2, "muster", 0));
        auctions.push(new AiAuction(1, "move", 0));
        auctions.push(new AiAuction(3, "build", 0));
        auctions.push(new AiAuction(5, "muster", 0));
        auctions.push(new AiAuction(4, "attack", 0));
        auctions.push(new AiAuction(2, "scheme", 1));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["church", "stronghold", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "move", 0));
        auctions.push(new AiAuction(1, "build", 0));
        auctions.push(new AiAuction(3, "tax", 0));
        auctions.push(new AiAuction(5, "muster", 0));
        auctions.push(new AiAuction(4, "build", 1));
        auctions.push(new AiAuction(2, "scheme", 0));
        aiStrategies["build"] = new AiStrategy("build", ["market", "church", "stronghold" ], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "move", 0));
        auctions.push(new AiAuction(1, "scheme", 0));
        auctions.push(new AiAuction(3, "tax", 0));
        auctions.push(new AiAuction(5, "build", 0));
        auctions.push(new AiAuction(4, "muster", 0));
        auctions.push(new AiAuction(2, "tax", 1));
        aiStrategies["tax"] = new AiStrategy("tax", ["church", "market", "stronghold"], auctions);
        var locationOrder = "Pereyaslavl,Smolensk,Polotsk,Chernigov,Kiev,Volyn,Rostov,Novgorod";
        this.aiCards.push(new AiStrategyCard(5, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(2, "move", 0));
        auctions.push(new AiAuction(3, "attack", 0));
        auctions.push(new AiAuction(4, "attack", 0));
        auctions.push(new AiAuction(5, "build", 1));
        auctions.push(new AiAuction(1, "muster", 0));
        auctions.push(new AiAuction(2, "muster", 0));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["stronghold", "church", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "muster", 0));
        auctions.push(new AiAuction(3, "tax", 0));
        auctions.push(new AiAuction(4, "tax", 1));
        auctions.push(new AiAuction(5, "build", 0));
        auctions.push(new AiAuction(1, "attack", 0));
        auctions.push(new AiAuction(2, "scheme", 0));
        aiStrategies["build"] = new AiStrategy("build", ["church", "stronghold", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "scheme", 0));
        auctions.push(new AiAuction(3, "muster", 0));
        auctions.push(new AiAuction(4, "tax", 0));
        auctions.push(new AiAuction(5, "muster", 0));
        auctions.push(new AiAuction(1, "build", 1));
        auctions.push(new AiAuction(2, "move", 0));
        aiStrategies["tax"] = new AiStrategy("tax", ["market", "church", "stronghold"], auctions);
        var locationOrder = "Polotsk,Smolensk,Kiev,Novgorod,Chernigov,Volyn,Pereyaslavl,Rostov";
        this.aiCards.push(new AiStrategyCard(6, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(1, "move", 0));
        auctions.push(new AiAuction(5, "muster", 1));
        auctions.push(new AiAuction(2, "attack", 0));
        auctions.push(new AiAuction(3, "build", 0));
        auctions.push(new AiAuction(2, "attack", 1));
        auctions.push(new AiAuction(4, "scheme", 0));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["stronghold", "church", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(1, "scheme", 1));
        auctions.push(new AiAuction(5, "tax", 0));
        auctions.push(new AiAuction(2, "muster", 1));
        auctions.push(new AiAuction(3, "attack", 0));
        auctions.push(new AiAuction(2, "build", 0));
        auctions.push(new AiAuction(4, "attack", 0));
        aiStrategies["build"] = new AiStrategy("build", ["market", "church", "stronghold"], auctions);
        auctions = [];
        auctions.push(new AiAuction(1, "tax", 0));
        auctions.push(new AiAuction(5, "tax", 0));
        auctions.push(new AiAuction(2, "muster", 1));
        auctions.push(new AiAuction(3, "move", 0));
        auctions.push(new AiAuction(2, "scheme", 0));
        auctions.push(new AiAuction(4, "build", 1));
        aiStrategies["tax"] = new AiStrategy("tax", ["market", "church", "stronghold"], auctions);
        var locationOrder = "Chernigov,Pereyaslavl,Smolensk,Rostov,Kiev,Novgorod,Polotsk,Volyn";
        this.aiCards.push(new AiStrategyCard(7, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(2, "move", 0));
        auctions.push(new AiAuction(5, "tax", 1));
        auctions.push(new AiAuction(1, "scheme", 0));
        auctions.push(new AiAuction(2, "build", 0));
        auctions.push(new AiAuction(4, "attack", 1));
        auctions.push(new AiAuction(3, "attack", 0));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["stronghold", "church", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "attack", 1));
        auctions.push(new AiAuction(5, "build", 1));
        auctions.push(new AiAuction(1, "muster", 0));
        auctions.push(new AiAuction(2, "move", 0));
        auctions.push(new AiAuction(4, "tax", 0));
        auctions.push(new AiAuction(3, "build", 0));
        aiStrategies["build"] = new AiStrategy("build", ["market", "church", "stronghold"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "scheme", 0));
        auctions.push(new AiAuction(5, "tax", 0));
        auctions.push(new AiAuction(1, "tax", 0));
        auctions.push(new AiAuction(2, "muster", 1));
        auctions.push(new AiAuction(4, "build", 1));
        auctions.push(new AiAuction(3, "move", 0));
        aiStrategies["tax"] = new AiStrategy("tax", ["market", "church", "stronghold"], auctions);
        var locationOrder = "Chernigov,Polotsk,Pereyaslavl,Kiev,Volyn,Smolensk,Novgorod,Rostov";
        this.aiCards.push(new AiStrategyCard(8, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(1, "tax", 0));
        auctions.push(new AiAuction(3, "muster", 1));
        auctions.push(new AiAuction(4, "move", 0));
        auctions.push(new AiAuction(5, "attack", 0));
        auctions.push(new AiAuction(2, "attack", 0));
        auctions.push(new AiAuction(2, "build", 1));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["church", "stronghold", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(1, "tax", 0));
        auctions.push(new AiAuction(3, "move", 0));
        auctions.push(new AiAuction(4, "attack", 1));
        auctions.push(new AiAuction(5, "build", 0));
        auctions.push(new AiAuction(2, "build", 1));
        auctions.push(new AiAuction(2, "scheme", 0));
        aiStrategies["build"] = new AiStrategy("build", ["church", "stronghold", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(1, "move", 0));
        auctions.push(new AiAuction(3, "tax", 0));
        auctions.push(new AiAuction(4, "tax", 0));
        auctions.push(new AiAuction(5, "scheme", 0));
        auctions.push(new AiAuction(2, "build", 1));
        auctions.push(new AiAuction(2, "muster", 1));
        aiStrategies["tax"] = new AiStrategy("tax", ["market", "church", "stronghold"], auctions);
        var locationOrder = "Smolensk,Novgorod,Pereyaslavl,Kiev,Chernigov,Polotsk,Rostov,Volyn";
        this.aiCards.push(new AiStrategyCard(9, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(2, "attack", 0));
        auctions.push(new AiAuction(1, "scheme", 0));
        auctions.push(new AiAuction(4, "move", 0));
        auctions.push(new AiAuction(3, "build", 1));
        auctions.push(new AiAuction(2, "muster", 1));
        auctions.push(new AiAuction(5, "tax", 0));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["market", "stronghold", "church"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "move", 0));
        auctions.push(new AiAuction(1, "scheme", 0));
        auctions.push(new AiAuction(4, "tax", 1));
        auctions.push(new AiAuction(3, "attack", 0));
        auctions.push(new AiAuction(2, "build", 1));
        auctions.push(new AiAuction(5, "muster", 0));
        aiStrategies["build"] = new AiStrategy("build", ["market", "church", "stronghold"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "move", 0));
        auctions.push(new AiAuction(1, "scheme", 0));
        auctions.push(new AiAuction(4, "tax", 1));
        auctions.push(new AiAuction(3, "muster", 0));
        auctions.push(new AiAuction(2, "muster", 0));
        auctions.push(new AiAuction(5, "build", 1));
        aiStrategies["tax"] = new AiStrategy("tax", ["stronghold", "church", "market"], auctions);
        var locationOrder = "Smolensk,Kiev,Chernigov,Pereyaslavl,Polotsk,Volyn,Rostov,Novgorod";
        this.aiCards.push(new AiStrategyCard(10, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(3, "attack", 1));
        auctions.push(new AiAuction(4, "muster", 0));
        auctions.push(new AiAuction(2, "scheme", 0));
        auctions.push(new AiAuction(1, "scheme", 0));
        auctions.push(new AiAuction(5, "attack", 0));
        auctions.push(new AiAuction(2, "build", 1));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["church", "stronghold", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(3, "attack", 0));
        auctions.push(new AiAuction(4, "build", 1));
        auctions.push(new AiAuction(2, "tax", 0));
        auctions.push(new AiAuction(1, "muster", 1));
        auctions.push(new AiAuction(5, "tax", 0));
        auctions.push(new AiAuction(2, "scheme", 0));
        aiStrategies["build"] = new AiStrategy("build", ["market", "church", "stronghold"], auctions);
        auctions = [];
        auctions.push(new AiAuction(3, "tax", 0));
        auctions.push(new AiAuction(4, "tax", 0));
        auctions.push(new AiAuction(2, "muster", 1));
        auctions.push(new AiAuction(1, "build", 0));
        auctions.push(new AiAuction(5, "move", 0));
        auctions.push(new AiAuction(2, "scheme", 1));
        aiStrategies["tax"] = new AiStrategy("tax", ["market", "church", "stronghold"], auctions);
        var locationOrder = "Volyn,Smolensk,Pereyaslavl,Polotsk,Kiev,Rostov,Chernigov,Novgorod";
        this.aiCards.push(new AiStrategyCard(11, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(2, "move", 0));
        auctions.push(new AiAuction(3, "attack", 1));
        auctions.push(new AiAuction(1, "muster", 0));
        auctions.push(new AiAuction(4, "scheme", 1));
        auctions.push(new AiAuction(5, "build", 0));
        auctions.push(new AiAuction(2, "attack", 0));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["stronghold", "church", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "muster", 0));
        auctions.push(new AiAuction(3, "attack", 1));
        auctions.push(new AiAuction(1, "move", 0));
        auctions.push(new AiAuction(4, "scheme", 0));
        auctions.push(new AiAuction(5, "build", 0));
        auctions.push(new AiAuction(2, "tax", 1));
        aiStrategies["build"] = new AiStrategy("build", ["stronghold", "market", "church"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "tax", 1));
        auctions.push(new AiAuction(3, "move", 0));
        auctions.push(new AiAuction(1, "scheme", 0));
        auctions.push(new AiAuction(4, "build", 1));
        auctions.push(new AiAuction(5, "muster", 0));
        auctions.push(new AiAuction(2, "tax", 0));
        aiStrategies["tax"] = new AiStrategy("tax", ["church", "stronghold", "market"], auctions);
        var locationOrder = "Kiev,Chernigov,Rostov,Pereyaslavl,Smolensk,Novgorod,Volyn,Polotsk";
        this.aiCards.push(new AiStrategyCard(12, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(2, "muster", 0));
        auctions.push(new AiAuction(3, "build", 1));
        auctions.push(new AiAuction(2, "tax", 0));
        auctions.push(new AiAuction(1, "move", 0));
        auctions.push(new AiAuction(5, "attack", 1));
        auctions.push(new AiAuction(4, "scheme", 0));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["stronghold", "church", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "move", 0));
        auctions.push(new AiAuction(3, "attack", 1));
        auctions.push(new AiAuction(2, "tax", 0));
        auctions.push(new AiAuction(1, "build", 0));
        auctions.push(new AiAuction(5, "tax", 0));
        auctions.push(new AiAuction(4, "muster", 1));
        aiStrategies["build"] = new AiStrategy("build", ["church", "market", "stronghold"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "tax", 0));
        auctions.push(new AiAuction(3, "build", 1));
        auctions.push(new AiAuction(2, "muster", 1));
        auctions.push(new AiAuction(1, "move", 0));
        auctions.push(new AiAuction(5, "tax", 0));
        auctions.push(new AiAuction(4, "scheme", 0));
        aiStrategies["tax"] = new AiStrategy("tax", ["market", "church", "stronghold"], auctions);
        var locationOrder = "Novgorod,Rostov,Smolensk,Chernigov,Pereyaslavl,Volyn,Polotsk,Kiev";
        this.aiCards.push(new AiStrategyCard(13, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(3, "build", 0));
        auctions.push(new AiAuction(1, "muster", 0));
        auctions.push(new AiAuction(4, "scheme", 1));
        auctions.push(new AiAuction(5, "tax", 1));
        auctions.push(new AiAuction(2, "move", 0));
        auctions.push(new AiAuction(2, "attack", 0));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["stronghold", "market", "church"], auctions);
        auctions = [];
        auctions.push(new AiAuction(3, "build", 0));
        auctions.push(new AiAuction(1, "muster", 1));
        auctions.push(new AiAuction(4, "scheme", 0));
        auctions.push(new AiAuction(5, "attack", 0));
        auctions.push(new AiAuction(2, "build", 1));
        auctions.push(new AiAuction(2, "tax", 0));
        aiStrategies["build"] = new AiStrategy("build", ["church", "stronghold", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(3, "build", 1));
        auctions.push(new AiAuction(1, "muster", 0));
        auctions.push(new AiAuction(4, "scheme", 0));
        auctions.push(new AiAuction(5, "muster", 0));
        auctions.push(new AiAuction(2, "tax", 1));
        auctions.push(new AiAuction(2, "scheme", 0));
        aiStrategies["tax"] = new AiStrategy("tax", ["stronghold", "church", "market"], auctions);
        var locationOrder = "Novgorod,Smolensk,Kiev,Pereyaslavl,Chernigov,Polotsk,Rostov,Volyn";
        this.aiCards.push(new AiStrategyCard(14, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(2, "attack", 0));
        auctions.push(new AiAuction(1, "muster", 0));
        auctions.push(new AiAuction(5, "move", 0));
        auctions.push(new AiAuction(3, "attack", 0));
        auctions.push(new AiAuction(2, "scheme", 0));
        auctions.push(new AiAuction(4, "tax", 1));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["church", "stronghold", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "attack", 0));
        auctions.push(new AiAuction(1, "scheme", 0));
        auctions.push(new AiAuction(5, "move", 0));
        auctions.push(new AiAuction(3, "muster", 1));
        auctions.push(new AiAuction(2, "tax", 0));
        auctions.push(new AiAuction(4, "build", 0));
        aiStrategies["build"] = new AiStrategy("build", ["church", "stronghold", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(2, "scheme", 0));
        auctions.push(new AiAuction(1, "muster", 0));
        auctions.push(new AiAuction(5, "tax", 0));
        auctions.push(new AiAuction(3, "tax", 0));
        auctions.push(new AiAuction(2, "build", 1));
        auctions.push(new AiAuction(4, "move", 0));
        aiStrategies["tax"] = new AiStrategy("tax", ["market", "church", "stronghold"], auctions);
        var locationOrder = "Volyn,Kiev,Smolensk,Polotsk,Novgorod,Rostov,Chernigov,Pereyaslavl";
        this.aiCards.push(new AiStrategyCard(15, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(4, "attack", 0));
        auctions.push(new AiAuction(5, "muster", 0));
        auctions.push(new AiAuction(3, "build", 0));
        auctions.push(new AiAuction(1, "tax", 1));
        auctions.push(new AiAuction(2, "scheme", 0));
        auctions.push(new AiAuction(2, "move", 0));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["church", "stronghold", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(4, "build", 0));
        auctions.push(new AiAuction(5, "build", 0));
        auctions.push(new AiAuction(3, "attack", 1));
        auctions.push(new AiAuction(1, "tax", 0));
        auctions.push(new AiAuction(2, "move", 0));
        auctions.push(new AiAuction(2, "attack", 0));
        aiStrategies["build"] = new AiStrategy("build", ["church", "stronghold", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(4, "build", 0));
        auctions.push(new AiAuction(5, "tax", 0));
        auctions.push(new AiAuction(3, "muster", 1));
        auctions.push(new AiAuction(1, "move", 0));
        auctions.push(new AiAuction(2, "tax", 0));
        auctions.push(new AiAuction(2, "scheme", 0));
        aiStrategies["tax"] = new AiStrategy("tax", ["market", "stronghold", "church"], auctions);
        var locationOrder = "Pereyaslavl,Chernigov,Smolensk,Polotsk,Volyn,Rostov,Novgorod,Kiev";
        this.aiCards.push(new AiStrategyCard(16, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(1, "move", 0));
        auctions.push(new AiAuction(2, "scheme", 0));
        auctions.push(new AiAuction(2, "scheme", 0));
        auctions.push(new AiAuction(3, "tax", 0));
        auctions.push(new AiAuction(5, "attack", 0));
        auctions.push(new AiAuction(4, "build", 1));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["church", "stronghold", "market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(1, "muster", 0));
        auctions.push(new AiAuction(2, "build", 0));
        auctions.push(new AiAuction(2, "tax", 0));
        auctions.push(new AiAuction(3, "tax", 0));
        auctions.push(new AiAuction(5, "scheme", 0));
        auctions.push(new AiAuction(4, "attack", 1));
        aiStrategies["build"] = new AiStrategy("build", ["market", "church", "stronghold"], auctions);
        auctions = [];
        auctions.push(new AiAuction(1, "muster", 0));
        auctions.push(new AiAuction(2, "build", 1));
        auctions.push(new AiAuction(2, "scheme", 0));
        auctions.push(new AiAuction(3, "tax", 0));
        auctions.push(new AiAuction(5, "tax", 0));
        auctions.push(new AiAuction(4, "move", 0));
        aiStrategies["tax"] = new AiStrategy("tax", ["market", "church", "stronghold"], auctions);
        var locationOrder = "Polotsk,Volyn,Chernigov,Smolensk,Kiev,Pereyaslavl,Novgorod,Rostov";
        this.aiCards.push(new AiStrategyCard(17, aiStrategies, locationOrder));

        aiStrategies = {};
        auctions = [];
        auctions.push(new AiAuction(1, "scheme", 0));
        auctions.push(new AiAuction(2, "muster", 0));
        auctions.push(new AiAuction(5, "build", 0));
        auctions.push(new AiAuction(2, "move", 0));
        auctions.push(new AiAuction(4, "attack", 1));
        auctions.push(new AiAuction(3, "tax", 0));
        aiStrategies["attack-move"] = new AiStrategy("attack-move", ["church", "stronghold","market"], auctions);
        auctions = [];
        auctions.push(new AiAuction(1, "move", 0));
        auctions.push(new AiAuction(2, "muster", 0));
        auctions.push(new AiAuction(5, "build", 0));
        auctions.push(new AiAuction(2, "tax", 1));
        auctions.push(new AiAuction(4, "attack", 0));
        auctions.push(new AiAuction(3, "move", 0));
        aiStrategies["build"] = new AiStrategy("build", ["church", "market", "stronghold"], auctions);
        auctions = [];
        auctions.push(new AiAuction(1, "scheme", 0));
        auctions.push(new AiAuction(2, "move", 0));
        auctions.push(new AiAuction(5, "scheme", 0));
        auctions.push(new AiAuction(2, "build", 0));
        auctions.push(new AiAuction(4, "tax", 1));
        auctions.push(new AiAuction(3, "muster", 0));
        aiStrategies["tax"] = new AiStrategy("tax", ["market", "church", "stronghold"], auctions);
        var locationOrder = "Polotsk,Novgorod,Rostov,Chernigov,Kiev,Smolensk,Volyn,Pereyaslavl";
        this.aiCards.push(new AiStrategyCard(18, aiStrategies, locationOrder));

    }
}

module.exports = Ai