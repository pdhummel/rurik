const GameMap = require('./map.js');
const AuctionBoard = require('./auction.js');
const GamePlayers = require('./player.js');
const AvailableLeaders = require('./leader.js');
const GameStates = require('./state.js');
const Cards = require('./cards.js');
const Validator = require('./validations.js');


class GameStatus {
    constructor(game, clientColor=null) {
        this.gameId = game.id;
        this.id = game.id;
        this.gameName = game.name;
        this.name = game.name;
        this.playerNames = "";
        this.currentPlayer = null;
        this.numberOfPlayers = game.players.players.length;
        this.targetNumberOfPlayers = game.targetNumberOfPlayers;
        var currentGameState = game.gameStates.getCurrentState();
        this.currentState = null;
        if (currentGameState != undefined && currentGameState != null) {
            this.currentState = currentGameState.name;
        }
        var firstPlayer = game.players.getFirstPlayer();
        this.playersByPosition = game.players.playersByPosition;
        for (var i=0; i<this.numberOfPlayers; i++) {
            this.playerNames = this.playerNames + " " + game.players.players[i].name;
        }
        if (firstPlayer != undefined && firstPlayer != null) {
            this.firstPlayer = firstPlayer.color;
        }
        if (!(clientColor == undefined && clientColor == null || clientColor.length < 1)) {
            var clientPlayer = game.getPlayer(clientColor);
            this.clientLeader = clientPlayer.leader;
            this.clientName = clientPlayer.name;
            this.clientPosition = clientPlayer.position;
        }
        if (this.currentState != "waitingForPlayers") {
            this.round = game.currentRound;
            //this.auctionBoard = game.auctionBoard;
            var currentPlayer = game.players.getCurrentPlayer();
            if (currentPlayer != undefined && currentPlayer != null) {
                this.currentPlayer = currentPlayer.color;
                if (currentPlayer.color == clientColor) {
                    this.statusMessage = "Waiting on you";
                    this.availableActions = currentGameState.allowedActions;
                } else if (clientColor == undefined || clientColor == null || clientColor.length < 1) {
                    this.statusMessage = "Waiting on " + currentPlayer.color;
                    this.availableActions = currentGameState.allowedActions;
                } else {
                    this.statusMessage = "Waiting on " + currentPlayer.color;
                    this.availableActions = [];                
                }
            }
            var nextPlayer = game.players.getNextPlayer(this.currentPlayer);
            if (nextPlayer != undefined && nextPlayer != null) {
                this.nextPlayer = nextPlayer.color;
            }
            var nextFirstPlayer = game.players.nextFirstPlayer;
            if (nextFirstPlayer != undefined && nextFirstPlayer != null) {
                this.nextFirstPlayer = nextFirstPlayer.color;
            }
        }
    }
}

class Games {
    constructor() {
        this.games = {};
    }
    createGame(name, targetNumberOfPlayers) {
        var game = new Game(name, targetNumberOfPlayers);
        console.log("createGame(): gameId=" + game.id);
        this.games[game.id] = game;
        return new GameStatus(game, null);
    }

    getGameById(id) {
        return this.games[id];
    }

    getGameStatus(gameId, clientColor=null) {
        var game = this.games[gameId];
        if (game === undefined || game == null) {
            return null;
        }
        var gameStatus = new GameStatus(game, clientColor);
        return gameStatus;
    }

    listGames() {
        var gameStatusList = [];
        for (var i=0; i<Object.keys(this.games).length; i++) {
            var game = this.games[Object.keys(this.games)[i]];
            var gameStatus = new GameStatus(game, null);
            gameStatusList.push(gameStatus);
        }
        return gameStatusList;
    }
}

class Game {
    
    // validate targetNumberOfPlayers
    constructor(gameName, targetNumberOfPlayers=4, password="") {
        this.currentRound = 1;
        this.auctionBoard = null;
        this.gameMap = new GameMap();
        this.cards = new Cards();
        this.targetNumberOfPlayers = targetNumberOfPlayers;
        this.players = new GamePlayers(targetNumberOfPlayers);
        this.availableLeaders = new AvailableLeaders();
        this.gameStates = new GameStates();
        // TODO: generate id with uuid
        this.id = Date.now();
        // TODO: creation date
        this.creationDate = null;
        this.name = gameName;
        this.password = password;
    }



    joinGame(name, color, position, isPlayerAi=false) {
        Validator.validateColor(color);
        Validator.validateTablePosition(position);
        if (this.gameStates.currentState.name == "waitingForPlayers") {
            if (this.players.players.length < this.players.targetNumberOfPlayers) {
                var player = this.players.addPlayer(name, color, position, isPlayerAi, this.cards);
                console.log("joinGame(): before resetMoveActionsFromLocation");
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
                this.gameMap.setLocationsForGame(this.players.getNumberOfPlayers());
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
            var player = this.players.getPlayerByColor(color);
            this.players.setFirstPlayer(player);
            this.players.setCurrentPlayer(player);
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
        console.log("playAdvisor():", color, columnName, advisor, bidCoins);
        if (this.gameStates.currentState.name == "strategyPhase") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                if (currentPlayer.isAdvisorAvailable(advisor)) {
                    if (currentPlayer.boat.money < bidCoins) {
                        // TODO: validation error
                        return;
                    }
                    // TODO: check for 2 advisors from the same player
                    this.auctionBoard.auctionBid(columnName, color, advisor, bidCoins);
                    currentPlayer.boat.money = currentPlayer.boat.money - bidCoins;
                    currentPlayer.useAdvisor(advisor);
                    var nextPlayer = this.players.getNextPlayer(currentPlayer);
                    if (nextPlayer.advisors.length > 0) {
                        this.players.setCurrentPlayer(nextPlayer);
                    } else {
                        this.players.setCurrentPlayer(this.players.firstPlayer);
                        var advisors = this.getAdvisorsForRound(this.players.getNumberOfPlayers(), this.currentRound-1);
                        this.players.setAdvisors(advisors);
                        this.players.mapAdvisorsToAuctionSpaces(this.auctionBoard);
                        this.gameStates.setCurrentState("retrieveAdvisor");
                    }
                }
            }
        }
    }

    // retrieve advisor
    takeMainAction(color, advisor, actionColumnName, row, forfeitAction=false) {
        console.log("takeMainAction(): ", color, advisor, actionColumnName, row, forfeitAction);
        if (this.gameStates.currentState.name == "retrieveAdvisor") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color && currentPlayer.tookMainActionForTurn == false) {
                // TODO: figure out how to differentiate if there are 2 with the same advisor number 
                // in the same column - for now, process top to bottom.
                
                if (currentPlayer.advisors.length > 0 && advisor == currentPlayer.advisors[0]) {
                    currentPlayer.advisors.shift();
                    var auctionSpaces = currentPlayer.advisorsToAuctionSpace[advisor];
                    var auctionSpace = null;
                    if (auctionSpaces.length > 0 && auctionSpaces[0].actionName == actionColumnName) {
                        auctionSpace = auctionSpaces.shift();
                        console.log("takeMainAction(): shift " + auctionSpace.actionName);
                    } else if (auctionSpaces.length > 1 && auctionSpaces[1].actionName == actionColumnName) {
                        auctionSpace = auctionSpaces.pop();
                        console.log("takeMainAction(): pop " + auctionSpace.actionName);
                    } else {
                        // TODO: throw exception
                        console.log("takeMainAction(): TODO: exception");
                    }

                    // remove advisor from auctionSpace
                    auctionSpace.color = null;
                    auctionSpace.advisor = 0;
                    auctionSpace.bidCoins = 0;
                    console.log("takeMainAction(): advisor removed");

                    if (forfeitAction == true) {
                        currentPlayer.boat.money++;
                    } else {
                        if (auctionSpace.extraCoin > currentPlayer.boat.money) {
                            throw new Error("Not enough money to take action.", "takeMainAction()");        
                        } else {
                            currentPlayer.boat.money = currentPlayer.boat.money - auctionSpace.extraCoin;
                        }
                        if (actionColumnName == "build") {
                            currentPlayer.buildActions = currentPlayer.buildActions + auctionSpace.quantity;
                        } else if (actionColumnName == "tax") {
                            currentPlayer.taxActions = currentPlayer.taxActions + auctionSpace.quantity;
                        } else if (actionColumnName == "move") {
                            currentPlayer.moveActions = currentPlayer.moveActions + auctionSpace.quantity;
                        } else if (actionColumnName == "attack") {
                            currentPlayer.attackActions = currentPlayer.attackActions + auctionSpace.quantity;
                        } else if (actionColumnName == "muster") {
                            var quantity = auctionSpace.quantity;
                            if (quantity > currentPlayer.supplyTroops) {
                                quantity = currentPlayer.supplyTroops;
                            }
                            currentPlayer.troopsToDeploy = currentPlayer.troopsToDeploy + quantity;
                            //this.gameStates.setCurrentState("muster");
                        } else if (actionColumnName == "scheme") {
                            currentPlayer.schemeCardsToDraw = auctionSpace.quantity;
                            if (auctionSpace.quantity = 3) {
                                currentPlayer.assignFirstPlayer = true;
                            }
                            this.gameStates.setCurrentState("scheme");
                        }
    
                    }
                    console.log("takeMainAction(): tookMainActionForTurn");
                    currentPlayer.tookMainActionForTurn = true;
                    if (currentPlayer.tookMainActionForTurn && this.gameStates.getCurrentState().name == "retrieveAdvisor") {
                        this.gameStates.setCurrentState("actionPhase");
                    }
                } else {
                    console.log("takeMainAction(): advisor does not match: " + advisor + " " + currentPlayer.color + " " + currentPlayer.advisors);
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
        console.log("muster(): " + color + " " + locationName + " " + numberOfTroops);
        if (this.gameStates.currentState.name == "actionPhaseMuster") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                var location = this.gameMap.getLocation(locationName);
                if (location.troopsByColor[color] > 0 && numberOfTroops <= currentPlayer.troopsToDeploy &&
                    numberOfTroops <= currentPlayer.supplyTroops) {
                    location.troopsByColor[color] = location.troopsByColor[color] + numberOfTroops;
                    currentPlayer.troopsToDeploy = currentPlayer.troopsToDeploy - numberOfTroops;
                    currentPlayer.supplyTroops = currentPlayer.supplyTroops - numberOfTroops;
                    this.gameStates.setCurrentState("actionPhase");
                } else {
                    // TODO: split error messages
                    throw new Error("Not enough troops available or you do not occupy the location.", "muster()");        
                }
            } else {
                throw new Error("It is not your turn right now.", "muster()");
            }
        } else {
            throw new Error("Cannot muster troops right now.", "muster()");
        }
    }

    move(color, fromLocationName, toLocationName, numberOfTroops=1, moveLeader=false) {
        if (this.gameStates.currentState.name == "actionPhaseMove") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                var fromLocation = this.gameMap.getLocation(fromLocationName);
                var toLocation = this.gameMap.getLocation(toLocationName);

                if (numberOfTroops <= currentPlayer.moveActions + currentPlayer.moveActionsFromLocation[fromLocationName]) {
                    if (fromLocation.isNeighbor(toLocationName)) {
                        if (moveLeader && fromLocation.isLeaderInLocation(color) && numberOfTroops == 1) {
                            fromLocation.leaderByColor[color] = fromLocation.leaderByColor[color] - numberOfTroops;
                            toLocation.leaderByColor[color] = toLocation.leaderByColor[color] + numberOfTroops;
                        } else if (moveLeader) {
                            throw new Error("Leader must be in location and cannot move other troops at the same time.", "move()");
                        } else {
                            fromLocation.troopsByColor[color] = fromLocation.troopsByColor[color] - numberOfTroops;
                            toLocation.troopsByColor[color] = toLocation.troopsByColor[color] + numberOfTroops;    
                        }
                        for (var i=0; i < numberOfTroops; i++) {
                            if (currentPlayer.moveActionsFromLocation[fromLocationName] > 0) {
                                currentPlayer.moveActionsFromLocation[fromLocationName] - 1;
                            } else {
                                currentPlayer.moveActions = currentPlayer.moveActions - 1;
                            }
                        }
                        this.gameStates.setCurrentState("actionPhase");
                    } else {
                        throw new Error(toLocationName + " is not a neighbor of " + fromLocationName + ".", "move()");        
                    }
                } else {
                    throw new Error("You don't have that many troops available to move.", "move()");    
                }
            } else {
                throw new Error("It is not your turn right now.", "move()");
            }
        } else {
            throw new Error("Cannot move troops right now.", "move()");
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

    attack(color, locationName, target, schemeDeckNumber=1) {
        var troopsLost = 0;
        
        if (this.gameStates.currentState.name == "actionPhaseAttack") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                var location = this.gameMap.getLocation(locationName);

                if ((location.troopsByColor[color] > 0 || location.leaderByColor[color] > 0)) {
                    if (target == "rebel") {
                        if (location.rebels.length > 0) {
                            var reward = location.rebels.shift();
                            if (reward == "coin") {
                                currentPlayer.boat.money = currentPlayer.boat.money + 1;
                            } else if (reward == "2 coins") {
                                currentPlayer.boat.money = currentPlayer.boat.money + 2;
                            } else {
                                currentPlayer.boat.addGoodToBoatOrDock(reward);
                            }
                            currentPlayer.boat.capturedRebels = currentPlayer.boat.capturedRebels + 1;                            
                        } else {
                            throw new Error("There are no rebels  to attack in " + locationName + ".", "attack()");
                        }
                    } else {
                        var targetColor = target;
                        if ((location.troopsByColor[targetColor] > 0 || location.leaderByColor[targetColor] > 0)) {
                            var schemeCardsToDraw = 1;
                            if (location.doesRule(targetColor)) {
                                schemeCardsToDraw++;
                            }
        
                            if (location.troopsByColor[targetColor] > 0) {
                                location.troopsByColor[targetColor]--;
                            } else {
                                location.leaderByColor[targetColor]--;
                            }
        
                            if (location.countStrongholds(targetColor) > 0) {
                                schemeCardsToDraw++;
                            }
                            var schemeDeck = this.cards.getSchemeDeckByNumber(schemeDeckNumber);
                            for (var i=0; i<schemeCardsToDraw; i++) {
                                var card = this.cards.drawAndDiscardSchemeCard(schemeDeck);
                                var deaths = card.deaths;
                                if (deaths > location.troopsByColor[color]) {
                                    deaths = location.troopsByColor[color];
                                }
                                location.troopsByColor[color] = location.troopsByColor[color] - deaths;
                                if (deaths > 0) {
                                    troopsLost = deaths;
                                    break;
                                }
                            }
                            // TODO: go up on the war track
                            
                        } else {
                            throw new Error(target + " does not have troops to attack in " + locationName + ".", "attack()");
                        }
                    }
                    currentPlayer.attackActions = currentPlayer.attackActions - 1;
                    this.gameStates.setCurrentState("actionPhase");
                } else {
                    throw new Error("You do not have troops in " + locationName + ".", "attack()");
                }                
            } else {
                throw new Error("Not your turn right now.", "attack()");
            }
        } else {
            throw new Error("Cannot move attack right now.", "attack()");
        }
        console.log("attack(): troopsLost=" + troopsLost);
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
                if (currentPlayer.advisorCountForTurn > currentPlayer.advisors.length) {
                    currentPlayer.advisorCountForTurn = currentPlayer.advisors.length;
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
                        this.gameStates.setCurrentState("retrieveAdvisor");
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

    beginActionPhaseAction(color, action) {
        console.log("beginActionPhaseAction(): " + color + " " + action);
        var actionToStateMap = {};
        actionToStateMap["musterAction"] = "actionPhaseMuster";
        actionToStateMap["moveAction"] = "actionPhaseMove";
        actionToStateMap["attackAction"] = "actionPhaseAttack";
        actionToStateMap["cancel"] = "actionPhase";
        if (this.gameStates.currentState.name.startsWith("actionPhase")) {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                this.gameStates.setCurrentState(actionToStateMap[action]);
            } else {
                throw new Error("Not your turn.", "beginActionPhaseAction()");
            }
        } else {
            throw new Error("Cannot begin action, not in actionPhase.", "beginActionPhaseAction()");
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