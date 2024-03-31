const GameMap = require('./map.js');
const AuctionBoard = require('./auction.js');
const GamePlayers = require('./player.js');
const AvailableLeaders = require('./leader.js');
const GameStates = require('./state.js');
const Cards = require('./cards.js');
const Validator = require('./validations.js');


class Games {
    constructor() {
        this.games = {};
    }
    createGame(targetNumberOfPlayers) {
        var game = new Game(targetNumberOfPlayers);
        console.log("createGame(): gameId=" + game.id);
        this.games[game.id] = game;
        return game;
    }

    getGameById(id) {
        return this.games[id];
    }
}

class Game {
    
    // validate targetNumberOfPlayers
    constructor(targetNumberOfPlayers) {
        this.currentRound = 1;
        this.gameMap = new GameMap();
        this.cards = new Cards();
        this.players = new GamePlayers(targetNumberOfPlayers);
        this.availableLeaders = new AvailableLeaders();
        this.gameStates = new GameStates();
        this.auctionBoard = new AuctionBoard();
        // TODO: generate id
        this.id = "1";
    }



    joinGame(name, color, position, isPlayerAi=false) {
        Validator.validateColor(color);
        Validator.validateTablePosition(position);
        if (this.gameStates.currentState.name == "waitingForPlayers") {
            if (this.players.players.length < this.players.targetNumberOfPlayers) {
                var player = this.players.addPlayer(name, color, position, isPlayerAi, this.cards);
                player.resetMoveActionsFromLocation(this.gameMap.locations);
                console.log("joinGame(): exit: " + name + ", " + color);
            } else {
                throw new Error("Game is full and already has " + this.players.targetNumberOfPlayers + " players.", "joinGame()");    
            }
        } else {
            throw new Error("Game is no longer accepting players.", "joinGame()");
        }           
    }

    startGame() {        
        if (this.gameStates.currentState.name == "waitingForPlayers") {
            // Allows person to play w/o opponent
            if (this.players.getNumberOfPlayers() > 0) {
                this.players.sortPlayers();
                this.auctionBoard = new AuctionBoard(this.players.getNumberOfPlayers());
                this.gameStates.setCurrentState("waitingForFirstPlayerSelection");
                console.log("startGame(): exit");
            } else {
                throw new Error("Cannot start game without players.", "startGame()");
            }
        }        
    }

    selectFirstPlayer(color) {
        Validator.validateColor(color);
        if (this.gameStates.currentState.name == "waitingForFirstPlayerSelection") {
            this.players.setFirstPlayer(color);
            this.players.setCurrentPlayer(color);
            this.gameStates.setCurrentState("waitingForLeaderSelection");
        } else {
            throw new Error("Cannot select first player right now.", "selectFirstPlayer()");
        }
    }

    selectRandomFirstPlayer() {
        if (this.gameStates.currentState.name == "waitingForFirstPlayerSelection") {
            var randomPlayer = this.players.getRandomPlayer();
            this.players.setFirstPlayer(randomPlayer);
            this.players.setCurrentPlayer(randomPlayer);
            this.gameStates.setCurrentState("waitingForLeaderSelection");
        } else {
            throw new Error("Cannot select first player right now.", "selectRandomFirstPlayer()");
        }
    }    

    chooseLeader(color, leaderName) {
        Validator.validateColor(color);
        if (this.gameStates.currentState.name == "waitingForLeaderSelection") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                var leader = this.availableLeaders.chooseLeader(leaderName);
                currentPlayer.setLeader(leader);
                var nextPlayer = this.players.getNextPlayer(currentPlayer);
                if (nextPlayer.leader == null) {
                    this.players.setCurrentPlayer(nextPlayer);
                } else {
                    var firstPlayer = this.players.getFirstPlayer()
                    this.players.setCurrentPlayer(firstPlayer);
                    this.gameStates.setCurrentState("waitingForSecretAgendaSelection");
                }
            } else {
                throw new Error(currentPlayer.color + " should choose leader before " + color + ".", "chooseLeader()");    
            }
        } else {
            throw new Error("Cannot choose leader right now.", "chooseLeader()");
        }
    }


    selectSecretAgenda(color, cardName) {
        if (this.gameStates.currentState.name == "waitingForSecretAgendaSelection") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                for (var i=0; i<currentPlayer.temporarySecretAgenda.length; i++) {
                    if (cardName == currentPlayer.temporarySecretAgenda[i].name) {
                        currentPlayer.secretAgenda.push(currentPlayer.temporarySecretAgenda[i]);
                        currentPlayer.temporarySecretAgenda = [];
                        break;
                    }
                }
                var nextPlayer = this.players.getNextPlayer(currentPlayer);
                if (nextPlayer.secretAgenda.length < 1) {
                    this.players.setCurrentPlayer(nextPlayer);
                } else {
                    this.players.setCurrentPlayer(this.players.firstPlayer);
                    this.gameStates.setCurrentState("waitingForTroopPlacement");
                }
            }

        }
    }

    placeInitialTroop(color, locationName) {
        if (this.gameStates.currentState.name == "waitingForTroopPlacement") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                this.gameMap.locationByName[locationName].addTroop(color);
                currentPlayer.troopsToDeploy--;
                var nextPlayer = this.players.getNextPlayer(currentPlayer);
                if (nextPlayer.troopsToDeploy > 0) {
                    this.players.setCurrentPlayer(nextPlayer);
                } else {
                    this.players.setCurrentPlayer(this.players.firstPlayer);
                    this.gameStates.setCurrentState("waitingForLeaderPlacement");
                    this.players.setTroopsToDeploy(1);
                }
            }
        }
    }

    placeLeader(color, locationName) {
        if (this.gameStates.currentState.name == "waitingForLeaderPlacement") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                this.gameMap.locationByName[locationName].addLeader(color);
                currentPlayer.troopsToDeploy--;
                var nextPlayer = this.players.getNextPlayer(currentPlayer);
                if (nextPlayer.troopsToDeploy > 0) {
                    this.players.setCurrentPlayer(nextPlayer);
                } else {
                    this.players.setCurrentPlayer(this.players.firstPlayer);
                    var advisors = this.getAdvisorsForRound(this.players.getNumberOfPlayers(), this.currentRound-1);
                    this.players.setAdvisors(advisors);
                    this.gameStates.setCurrentState("strategyPhase");
                }
            }
        }
    }

    playAdvisor(color, columnName, advisor, bidCoins=0) {
        if (this.gameStates.currentState.name == "strategyPhase") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                if (currentPlayer.isAdvisorAvailable(advisor)) {
                    this.auctionBoard.auctionBid(columnName, color, advisor, bidCoins);
                    currentPlayer.useAdvisor(advisor);
                    var nextPlayer = this.players.getNextPlayer(currentPlayer);
                    if (nextPlayer.advisors.length > 0) {
                        this.players.setCurrentPlayer(nextPlayer);
                    } else {
                        this.players.setCurrentPlayer(this.players.firstPlayer);
                        var advisors = this.getAdvisorsForRound(this.players.getNumberOfPlayers(), this.currentRound-1);
                        this.players.setAdvisors(advisors);
                        this.players.mapAdvisorsToAuctionSpaces(this.auctionBoard);
                        this.gameStates.setCurrentState("actionPhase");
                    }
                }
            }
        }
    }

    takeMainAction(color, advisor, actionColumnName, forfeitAction=false) {
        if (this.gameStates.currentState.name == "actionPhase") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color && currentPlayer.tookMainActionForTurn == false) {
                // TODO: figure out how to differentiate if there are 2 with the same advisor number 
                // in the same column - for now, process top to bottom.
                if (advisor == currentPlayer.advisors[0]) {
                    currentPlayer.advisors.shift();
                    var auctionSpaces = currentPlayer.advisorsToAuctionSpace[advisor];
                    var auctionSpace = null;
                    if (auctionSpaces.length > 0 && auctionSpaces[0].actionName == actionColumnName) {
                        auctionSpace = auctionSpaces.shift();
                    } else if (auctionSpaces.length > 1 && auctionSpaces[1].actionName == actionColumnName) {
                        auctionSpace = auctionSpaces.pop();
                    } else {
                        // TODO: throw exception
                    }
                    if (forfeitAction == true) {
                        currentPlayer.boat.money++;
                    } else {
                        if (auctionSpace.extraCoin > currentPlayer.boat.money) {
                            // TODO: throw exception
                        } else {
                            currentPlayer.boat.money = currentPlayer.boat.money - auctionSpace.extraCoin;
                        }
                        if (actionColumnName == "build") {
                            currentPlayer.buildActions = currentPlayer.buildActions + auctionSpace.quantity;
                            //this.gameStates.setCurrentState("build");
                        } else if (actionColumnName == "tax") {
                            currentPlayer.taxActions = currentPlayer.taxActions + auctionSpace.quantity;
                            //this.gameStates.setCurrentState("tax");
                        } else if (actionColumnName == "move") {
                            currentPlayer.moveActions = currentPlayer.moveActions + auctionSpace.quantity;
                            //this.gameStates.setCurrentState("move");
                        } else if (actionColumnName == "attack") {
                            currentPlayer.attackActions = currentPlayer.attackActions + auctionSpace.quantity;
                            //this.gameStates.setCurrentState("attack");
                        } else if (actionColumnName == "muster") {
                            var quantity = auctionSpace.quantity;
                            if (quantity > currentPlayer.supplyTroops) {
                                quantity = currentPlayer.supplyTroops;
                            }
                            currentPlayer.troopsToDeploy = currentPlayer.troopsToDeploy + quantity;
                            currentPlayer.supplyTroops = currentPlayer.supplyTroops - quantity;
                            //this.gameStates.setCurrentState("muster");
                        } else if (actionColumnName == "scheme") {
                            currentPlayer.schemeCardsToDraw = auctionSpace.quantity;
                            if (auctionSpace.quantity = 3) {
                                currentPlayer.assignFirstPlayer = true;
                            }
                            this.gameStates.setCurrentState("scheme");
                        }
    
                    }
                    currentPlayer.tookMainActionForTurn = true;
                }

            }
        }
    }

    assignFirstPlayer(color) {
        if (this.gameStates.currentState.name == "scheme") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color && currentPlayer.assignFirstPlayer) {
                this.players.setNextFirstPlayerByColor(color);
                currentPlayer.assignFirstPlayer = false;
                if (currentPlayer.temporarySchemeCards.length < 1) {
                    this.gameStates.setCurrentState("actionPhase");
                }
            }
        }            
    }


    drawSchemeCards(color, schemeDeck) {
        if (this.gameStates.currentState.name == "scheme") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color && currentPlayer.schemeCardsToDraw > 0) {
                currentPlayer.canKeepSchemeCard = true;
                if (currentPlayer.schemeCardsToDraw == 1) {
                    var card = this.cards.drawSchemeCard(schemeDeck);
                    currentPlayer.temporarySchemeCards.push(card);
                    this.selectSchemeCard(color, card);
                } else {
                    for (var i=0; currentPlayer.schemeCardsToDraw; i++) {
                        var card = this.cards.drawSchemeCard(schemeDeck);
                        currentPlayer.temporarySchemeCards.push(card);
                    }
                }

                currentPlayer.schemeCardsToDraw == 0;
            }
        }
    }

    selectSchemeCardToKeep(color, schemeCard) {
        if (this.gameStates.currentState.name == "scheme") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color && currentPlayer.temporarySchemeCards.length > 0 && 
                currentPlayer.canKeepSchemeCard) {
                var tempCards = [];
                for (var i=0; i<currentPlayer.temporarySchemeCards.length; i++) {
                    if (schemeCard.isEqual(currentPlayer.temporarySchemeCards[i])) {
                        currentPlayer.schemeCards.push(currentPlayer.temporarySchemeCards[i]);
                        currentPlayer.canKeepSchemeCard = false;
                    } else {
                        tempCards.push(currentPlayer.temporarySchemeCards[i]);
                    }
                }                
                currentPlayer.temporarySchemeCards = tempCards;
                if (currentPlayer.temporarySchemeCards.length < 1 && !currentPlayer.assignFirstPlayer) {
                    this.gameStates.setCurrentState("actionPhase");
                }
            }
        }    
    }

    selectSchemeCardToReturn(color, schemeDeck, schemeCard) {
        if (this.gameStates.currentState.name == "scheme") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color && currentPlayer.temporarySchemeCards.length > 0) {
                var tempCards = [];
                for (var i=0; i<currentPlayer.temporarySchemeCards.length; i++) {
                    if (schemeCard.isEqual(currentPlayer.temporarySchemeCards[i])) {
                        schemeDeck.unshift(currentPlayer.temporarySchemeCards[i]);
                    } else {
                        tempCards.push(currentPlayer.temporarySchemeCards[i]);
                    }
                }                
                currentPlayer.temporarySchemeCards = tempCards;
                if (currentPlayer.temporarySchemeCards.length == 1 && currentPlayer.canKeepSchemeCard) {
                    var card = currentPlayer.temporarySchemeCards.pop();
                    currentPlayer.schemeCards.push(card);
                    currentPlayer.canKeepSchemeCard = false;
                }
                if (currentPlayer.temporarySchemeCards.length < 1 && !currentPlayer.assignFirstPlayer) {
                    this.gameStates.setCurrentState("actionPhase");
                }
            }
        }    
    }

    muster(color, locationName, numberOfTroops) {
        if (this.gameStates.currentState.name == "actionPhase") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                var location = this.gameMap.getLocation(locationName);
                if (location.troopsByColor["color"] > 0 && numberOfTroops <= currentPlayer.troopsToDeploy) {
                    location.troopsByColor["color"] = location.troopsByColor["color"] + numberOfTroops;
                    currentPlayer.troopsToDeploy = currentPlayer.troopsToDeploy - numberOfTroops;
                    //if (currentPlayer.troopsToDeploy < 1) {
                    //    this.gameStates.setCurrentState("actionPhase");
                    //}
                }
            }
        }
    }

    move(color, fromLocationName, toLocationName, numberOfTroops) {
        if (this.gameStates.currentState.name == "actionPhase") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                var fromLocation = this.gameMap.getLocation(fromLocationName);
                var toLocation = this.gameMap.getLocation(toLocationName);

                if (numberOfTroops <= currentPlayer.moveActions + currentPlayer.moveActionsFromLocation[fromLocationName]) {
                    if (fromLocation.isNeighbor(toLocationName)) {
                        fromLocation.troopsByColor[color] = fromLocation.troopsByColor[color] - numberOfTroops;
                        toLocation.troopsByColor[color] = toLocation.troopsByColor[color] + numberOfTroops;
                        for (var i=0; i < numberOfTroops; i++) {
                            if (currentPlayer.moveActionsFromLocation[fromLocationName] > 0) {
                                currentPlayer.moveActionsFromLocation[fromLocationName]--;
                            } else {
                                currentPlayer.moveActions = currentPlayer.moveActions--;
                            }
                        }
                        //if (currentPlayer.getTotalMoveActions() < 1) {
                        //    this.gameStates.setCurrentState("actionPhase");
                        //}    
                    }
                }
            }
        }
    }

    tax(color, locationName, toBoat=true, marketCoinNotResource=false) {
        if (this.gameStates.currentState.name == "actionPhase") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                var location = this.gameMap.getLocation(locationName);
                if (location.doesOccupy(color)) {
                    var taxActionsRequired = 2;
                    if (location.doesRule(color)) {
                        taxActionsRequired = 1;
                    }
                    if (currentPlayer.taxActions >= taxActionsRequired && location.resourceCount > 0) {
                        var resource = location.defaultResource;
                        currentPlayer.taxActions = currentPlayer.taxActions - taxActionsRequired;
                        if (toBoat && currentPlayer.boat.doesBoatHaveRoom(resource)) {
                            currentPlayer.boat.addGoodToBoat(resource);
                        } else {
                            currentPlayer.boat.addGoodToDock(resource);
                        }
                        // check for market
                        if (location.doesPlayerHaveMarket(color)) {
                            if (marketCoinNotResource) {
                                currentPlayer.boat.money++;
                            } else {
                                if (toBoat && currentPlayer.boat.doesBoatHaveRoom(resource)) {
                                    currentPlayer.boat.addGoodToBoat(resource);
                                } else {
                                    currentPlayer.boat.addGoodToDock(resource);
                                }                                
                            }
                        }
                    }    
                }
                //if (currentPlayer.taxActions < 1) {
                //    this.gameStates.setCurrentState("actionPhase");
                //}                
            }
        }
    }

    build(color, locationName, buildingName) {
        if (this.gameStates.currentState.name == "actionPhase") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                var location = this.gameMap.getLocation(locationName);
                if (location.doesOccupy(color) && location.buildings.length < 3 && ! location.hasBuilding(buildingName)) {
                    var buildActionsRequired = 2;
                    if (location.doesRule(color)) {
                        buildActionsRequired = 1;
                    }                    
                    if (currentPlayer.buildActions >= buildActionsRequired) {
                        if (currentPlayer.buildings[buildingName] > 1) {
                            currentPlayer.buildings[buildingName]--;
                            location.buildings.push(buildingName);

                            if (buildingName == "stable") {
                                currentPlayer.moveActionsFromLocation[locationName] = 2;
                            } else if (buildingName = "tavern") {
                                currentPlayer.boat.money = currentPlayer.boat.money + location.buildings.length;
                                this.gameStates.setCurrentState("oneTimeScheme");
                            }

                            //if (currentPlayer.buildActions < 1) {
                            //    this.gameStates.setCurrentState("actionPhase");
                            //}
    
                        }

                    }                    
                }
            }
        }
    }

    attack(color, locationName, targetColor, schemeDeck) {
        var troopsLost = 0;
        if (this.gameStates.currentState.name == "actionPhase") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                var location = this.gameMap.getLocation(locationName);

                if ((location.troopsByColor[color] > 0 || location.leaderByColor[color] > 0) && 
                   (location.troopsByColor[targetColor] > 0 || location.leaderByColor[targetColor] > 0)) {

                    if (location.troopsByColor[targetColor] > 0) {
                        location.troopsByColor[targetColor]--;
                    } else {
                        location.leaderByColor[targetColor]--;
                    }

                    var schemeCardsToDraw = 1;
                    if (location.doesRule(targetColor)) {
                        schemeCardsToDraw++;
                    }
                    if (location.countStrongholds(targetColor) > 0) {
                        schemeCardsToDraw++;
                    }
                    for (var i=0; i<schemeCardsToDraw; i++) {
                        var card = this.cards.drawAndDiscardSchemeCard(schemeDeck);
                        deaths = card.deaths;
                        if (deaths > location.troopsByColor[color]) {
                            deaths = location.troopsByColor[color];
                        }
                        location.troopsByColor[color] = location.troopsByColor[color] - deaths;
                        if (deaths > 0) {
                            troopsLost = deaths;
                            break;
                        }
                    }

                    //if (currentPlayer.attackActions < 1) {
                    //    this.gameStates.setCurrentState("actionPhase");
                    //}
                }
            }
        }
        return troopsLost;
    }

    drawOneTimeSchemeCard(color, schemeDeck) {
        if (this.gameStates.currentState.name == "oneTimeScheme") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color && currentPlayer.oneTimeSchemeCard == null) {
                var card = this.cards.drawSchemeCard(schemeDeck);
                this.currentPlayer.oneTimeSchemeCard = card;
            }
        }
    }

    playOneTimeSchemeCard(color) {
        if (this.gameStates.currentState.name == "oneTimeScheme") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color && currentPlayer.oneTimeSchemeCard != null) {
                if (currentPlayer.oneTimeSchemeCard.rewardCoinCost <= currentPlayer.boat.money) {
                    currentPlayer.boat.money = currentPlayer.boat.money - currentPlayer.oneTimeSchemeCard.rewardCoinCost;
                    this.collectSchemeCardReward(currentPlayer, currentPlayer.oneTimeSchemeCard);
                }
                currentPlayer.oneTimeSchemeCard = null;
            }
        }
        this.gameStates.setCurrentState("actionPhase");
    }


    playschemeCard(color, schemeCard) {
        if (this.gameStates.currentState.name == "actionPhase") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color && currentPlayer.schemeCardsCanPlay > 0) {
                if (currentPlayer.hasSchemeCard(schemeCard) && 
                    schemeCard.rewardCoinCost <= currentPlayer.boat.money) {
                    currentPlayer.boat.money = currentPlayer.boat.money - schemeCard.rewardCoinCost;
                    this.collectSchemeCardReward(currentPlayer, schemeCard);
                }
                currentPlayer.schemeCardsCanPlay--;
            }
        }
    }

    collectSchemeCardReward(currentPlayer, schemeCard) {
        for (var i=0; i<schemeCard.rewards.length; i++) {
            var reward = schemeCard.rewards[i];
            // coin, tax, muster, move, build, attack
            if (reward == "coin") {
                currentPlayer.boat.money++;
            } else if (reward == "tax") {
                currentPlayer.taxActions++;
            } else if (reward == "move") {
                currentPlayer.moveActions++;
            } else if (reward == "build") {
                currentPlayer.buildActions++;
            } else if (reward == "attack") {
                currentPlayer.attackActions++;
            } else if (reward == "muster") {
                if (currentPlayer.supplyTroops > 0) {
                    currentPlayer.supplyTroops--;
                    currentPlayer.troopsToDeploy++;
                }
            } else if (reward == "deedCard") {
                // TODO
            }
        }
    }

    endCurrentAction(color) {
        if (this.gameStates.currentState.name == "oneTimeScheme" || this.gameStates.currentState.name == "scheme") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                this.gameStates.setCurrentState("actionPhase");
            }
        }
    }

    endTurn(color) {
        if (this.gameStates.currentState.name == "actionPhase") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                if (currentPlayer.advisorCountByTurn > currentPlayer.advisors.length) {
                    currentPlayer.advisorCountByTurn = currentPlayer.advisors.length;
                    currentPlayer.troopsToDeploy = 0;
                    currentPlayer.taxActions = 0;
                    currentPlayer.buildActions = 0;
                    currentPlayer.moveActions = 0;
                    currentPlayer.attackActions = 0;
                    currentPlayer.tookMainActionForTurn = false;
                    currentPlayer.schemeCardsCanPlay = 1;
                    currentPlayer.accomplishedDeedForTurn = false;
                    currentPlayer.convertedGoodsForTurn = false;
                    currentPlayer.resetMoveActionsFromLocation(this.gameMap.locations);
                    var nextPlayer = this.players.getNextPlayer(currentPlayer);            
                    if (nextPlayer.advisors.length > 0) {
                        this.players.setCurrentPlayer(nextPlayer);
                    } else {
                        this.players.setCurrentPlayer(this.players.firstPlayer);
                        this.gameStates.setCurrentState("claimPhase");
                    }
                } else {
                    throw "Cannot end turn before playing your advisor."
                }
            }
        }
    }


    // round=0-3
    getAdvisorsForRound(numberOfPlayers, round) {
        var advisorsByRound = [];
        advisorsByRound[0] = [1, 2, 4, 5];
        advisorsByRound[1] = [1, 2, 4, 5];
        advisorsByRound[2] = [1, 2, 4, 5, 2];
        if (numberOfPlayers == 2) {
            advisorsByRound[3] = [1, 2, 4, 5, 2, 3];
        } else if (numberOfPlayers == 3) {
            advisorsByRound[3] = [1, 2, 4, 5, 2, 3];
        } else {
            advisorsByRound[3] = [1, 2, 4, 5, 2];
        }
        return advisorsByRound[round];
    }

    getPlayer(color) {
        Validator.validateColor(color);
        return this.players.getPlayerByColor(color);
    }
    
}


module.exports = Games