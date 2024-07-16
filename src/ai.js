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
            "schemeFirstPlayer": "schemeFirstPlayer",
            "drawSchemeCards": "drawSchemeCards",
            "selectSchemeCard": "selectSchemeCard",
            "endGame": ""
        }
        this.aiCards = [];
        this.createAiCards();
    }

    evaluateGame(game) {
        if (! game.players.getCurrentPlayer().isPlayerAi) {
            return;
        }
        console.log("evaluateGame(): isPlayerAi=true");
        var currentPlayer =  game.players.getCurrentPlayer();
        var currentState = game.gameStates.currentState;
        var currentStateName = currentState.name;
        var method = this.mapStateToFunction[currentStateName];
        if (method == undefined || method == null || method.length <= 0) {
            console.log("evaluateGame(): method not found for " + currentStateName);
            return
        }
        console.log("evaluateGame(): currentState=" + currentStateName + ", currentPlayer=" + currentPlayer.color + 
            ", method=" + method);
        this[method](game, currentPlayer);
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
        // TODO: make sure the aiCard is set to null at the end of a round
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
        console.log("retrieveAdvisor()");
        var color = player.color;
        var advisor = player.advisors[0];
        var auctionSpaces = player.advisorsToAuctionSpace[advisor];
        var auctionSpace = auctionSpaces[0];
        var actionColumnName = auctionSpace.actionName;
        var row = auctionSpace.row;
        try {
            game.takeMainAction(color, advisor, actionColumnName, row);  
        } catch(error) {
            game.takeMainAction(color, advisor, actionColumnName, row, true);  
        }
    }

    takeAction(game, player) {
        // Clone the game and calculate current points for all players.
        var clonedGame = lodash.cloneDeep(game);
        var clonedPlayer = lodash.cloneDeep(player);
        var endGameStats = clonedGame.calculateEndGameStats();
        var decisionValue = this.calculateDecisionValue(clonedGame, clonedPlayer);
        
        /*
        beginActionPhaseAction(color, action) {
        console.log("beginActionPhaseAction(): " + color + " " + action);
        var actionToStateMap = {};
        actionToStateMap["cancel"] = "actionPhase";
        actionToStateMap["musterAction"] = "actionPhaseMuster";
        actionToStateMap["moveAction"] = "actionPhaseMove";
        actionToStateMap["attackAction"] = "actionPhaseAttack";
        actionToStateMap["taxAction"] = "actionPhaseTax";
        actionToStateMap["buildAction"] = "actionPhaseBuild";
        actionToStateMap["transferGoodsAction"] = "actionPhaseTransfer";
        actionToStateMap["schemeAction"] = "actionPhasePlaySchemeCard";
        actionToStateMap["convertGoodsAction"] = "actionPhasePlayConversionTile";
        actionToStateMap["accomplishDeedAction"] = "actionPhaseAccomplishDeed";
        */


        //this.taxActions = 0;
        //this.buildActions = 0;
        //this.moveActions = 0;
        //this.attackActions = 0;
        if (player.troopsToDeploy > 0) {
            this.muster(game, player);
        }
        if (player.taxActions > 0) {
            this.tax(game, player);
        }

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

    muster(game, player) {
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
        }
    }

    tax(game, player) {
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
            }

        }
        
    }

    build(game, player) {

    }

    attack(game, player) {

    }

    move(game, player) {

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
        var color = player.color;
        var deedCardName = game.cards.displayedDeedCards[0].name;
        game.takeDeedCard(color, deedCardName)
    }

    schemeFirstPlayer(game, player) {
        var sortedPlayers = game.players.sortedPlayers;
        var firstPlayerColor = player.color;
        for (var i=0; i < sortedPlayers.length; i++) {
            if (sortedPlayers[i].color == player.color) {
                var firstPlayer = player;
                var index = i;
                if (i == 0) {
                    index = sortedPlayers.length - 1;
                } else if (i > 0) {
                    index = i - 1;
                }
                firstPlayer = sortedPlayers[index];
                firstPlayerColor = firstPlayer.color;
                break;
            }
        }
        game.schemeFirstPlayer(player.color, firstPlayerColor)
    }

    drawSchemeCards(game, player) {
        var r = Math.floor(Math.random() * 2);
        var schemeDeck = r + 1;
        game.drawSchemeCards(player.color, schemeDeck);
    }

    selectSchemeCard(game, player) {
        while (player.temporarySchemeCards.length > 0) {
            var schemeCard = player.temporarySchemeCards[0];
            if (player.temporarySchemeCards.length == 1) {
                game.selectSchemeCardToKeep(player.color, schemeCard);
            } else {
                game.selectSchemeCardToReturn(player.color, player.returnSchemeDeck, schemeCard.id)
            }            
        }
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