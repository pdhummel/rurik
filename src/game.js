const GameMap = require('./map.js');
const AuctionBoard = require('./auction.js');
const GamePlayers = require('./player.js');
const AvailableLeaders = require('./leader.js');
const GameStates = require('./state.js');
const Cards = require('./cards.js');
const ClaimBoard = require('./claims.js');
const Validator = require('./validations.js');



class GameStatus {
    constructor(game, clientColor=null) {
        this.gameId = game.id;
        this.id = game.id;
        this.gameName = game.name;
        this.name = game.name;
        this.playerNames = "";
        this.currentPlayer = null;
        this.clientPlayer = null;
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
            this.clientPlayer = game.getPlayer(clientColor);
            this.clientLeader = this.clientPlayer.leader;
            this.clientName = this.clientPlayer.name;
            this.clientPosition = this.clientPlayer.position;
        }
        if (this.currentState != "waitingForPlayers" && currentGameState != undefined) {
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

    static getInstance() {
        if (Games.self === undefined) {
            Games.self = new Games();
        }
        return Games.self;
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
        this.claimBoard = new ClaimBoard();
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
        this.validateGameStatus("waitingForPlayers", "joinGame", "Game is no longer accepting players.");
        if (this.players.players.length > this.players.targetNumberOfPlayers) {
            throw new Error("Game is full and already has " + this.players.targetNumberOfPlayers + " players.", "joinGame");
        }

        var player = this.players.addPlayer(name, color, position, isPlayerAi, this.cards);
        console.log("joinGame(): before resetMoveActionsFromLocation");
        player.resetMoveActionsFromLocation(this.gameMap.locations);
        console.log("joinGame(): exit: " + name + ", " + color);
    }

    startGame() {  
        this.validateGameStatus("waitingForPlayers", "startGame");
        // Allows person to play w/o opponent
        if (this.players.getNumberOfPlayers() == 0) {
            throw new Error("Cannot start the game without players.", "startGame");
        }

        this.players.sortPlayers();
        this.auctionBoard = new AuctionBoard(this.players.getNumberOfPlayers());
        this.gameMap.setLocationsForGame(this.players.getNumberOfPlayers());
        this.gameStates.setCurrentState("waitingForFirstPlayerSelection");
        console.log("startGame(): exit");
    }

    selectFirstPlayer(color) {
        Validator.validateColor(color);
        this.validateGameStatus("waitingForFirstPlayerSelection", "selectFirstPlayer");
        var player = this.players.getPlayerByColor(color);
        this.players.setFirstPlayer(player);
        this.players.setCurrentPlayer(player);
        this.gameStates.setCurrentState("waitingForLeaderSelection");
    }

    selectRandomFirstPlayer() {
        this.validateGameStatus("waitingForFirstPlayerSelection", "selectRandomFirstPlayer");
        var randomPlayer = this.players.getRandomPlayer();
        this.players.setFirstPlayer(randomPlayer);
        this.players.setCurrentPlayer(randomPlayer);
        this.gameStates.setCurrentState("waitingForLeaderSelection");
    }    

    chooseLeader(color, leaderName) {
        console.log("chooseLeader(): " + color);
        Validator.validateColor(color);
        this.validateGameStatus("waitingForLeaderSelection", "chooseLeader");
        var currentPlayer = this.validateCurrentPlayer(color, "chooseLeader");

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
    }


    selectSecretAgenda(color, cardName) {
        this.validateGameStatus("waitingForSecretAgendaSelection", "selectSecretAgenda");
        var currentPlayer = this.validateCurrentPlayer(color, "selectSecretAgenda");
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

    placeInitialTroop(color, locationName) {
        this.validateGameStatus("waitingForTroopPlacement", "placeInitialTroop");
        var currentPlayer = this.validateCurrentPlayer(color, "placeInitialTroop");

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

    placeLeader(color, locationName) {
        this.validateGameStatus("waitingForLeaderPlacement", "placeLeader");
        var currentPlayer = this.validateCurrentPlayer(color, "placeLeader");
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

    playAdvisor(color, columnName, advisor, bidCoins=0) {
        console.log("playAdvisor():", color, columnName, advisor, bidCoins);
        this.validateGameStatus("strategyPhase", "playAdvisor");
        var currentPlayer = this.validateCurrentPlayer(color, "playAdvisor");
        if (! currentPlayer.isAdvisorAvailable(advisor)) {
            throw new Error("No advisor is available.", "playAdvisor");
        }
        if (currentPlayer.boat.money < bidCoins) {
            throw new Error("Bid exceeded money available.", "playAdvisor");
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

    // retrieve advisor
    takeMainAction(color, advisor, actionColumnName, row, forfeitAction=false) {
        console.log("takeMainAction(): ", color, advisor, actionColumnName, row, forfeitAction);
        this.validateGameStatus("retrieveAdvisor", "takeMainAction");
        var currentPlayer = this.validateCurrentPlayer(color, "takeMainAction");
        if (currentPlayer.tookMainActionForTurn == true) {
            this.throwError("Player already too main action for this turn.", "takeMainAction");
        }

        if (currentPlayer.advisors.length < 1 || advisor != currentPlayer.advisors[0]) {
            console.log("takeMainAction(): advisor does not match: " + advisor + " " + currentPlayer.color + " " + currentPlayer.advisors);
        }

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
                throw new Error("Could not retrieve advisor.", "takeMainAction()");        
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
                } else if (actionColumnName == "scheme") {
                    currentPlayer.schemeCardsToDraw = auctionSpace.quantity;
                    if (auctionSpace.quantity = 3) {
                        this.gameStates.setCurrentState("schemeFirstPlayer");
                    } else {
                        this.gameStates.setCurrentState("drawSchemeCards");
                    }
                }

            }
            console.log("takeMainAction(): tookMainActionForTurn");
            currentPlayer.tookMainActionForTurn = true;
            if (currentPlayer.tookMainActionForTurn && this.gameStates.getCurrentState().name == "retrieveAdvisor") {
                this.gameStates.setCurrentState("actionPhase");
            }
        }
    }

    schemeFirstPlayer(currentPlayerColor, firstPlayerColor) {
        this.validateGameStatus("schemeFirstPlayer", "schemeFirstPlayer");
        this.validateCurrentPlayer(currentPlayerColor, "schemeFirstPlayer");
        this.players.setNextFirstPlayerByColor(firstPlayerColor);
        this.gameStates.setCurrentState("drawSchemeCards");
    }

    drawSchemeCards(color, schemeDeck) {
        console.log("drawSchemeCards(): " + color + " " + schemeDeck);
        this.validateGameStatus("drawSchemeCards", "drawSchemeCards");
        var currentPlayer = this.validateCurrentPlayer(color, "drawSchemeCards");
        if (currentPlayer.schemeCardsToDraw < 1) {
            this.throwError("You don't have any scheme cards to draw.", "drawSchemeCards");
        }

        currentPlayer.canKeepSchemeCard = true;
        if (currentPlayer.schemeCardsToDraw == 1) {
            var card = this.cards.drawSchemeCard(schemeDeck);
            currentPlayer.temporarySchemeCards.push(card);
            this.selectSchemeCardToKeep(color, card);
        } else {
            for (var i=0; i<currentPlayer.schemeCardsToDraw; i++) {
                var card = this.cards.drawSchemeCard(schemeDeck);
                currentPlayer.temporarySchemeCards.push(card);
                currentPlayer.returnSchemeDeck = schemeDeck;
            }
            this.gameStates.setCurrentState("selectSchemeCard");
        }
        currentPlayer.schemeCardsToDraw == 0;
    }

    selectSchemeCardToKeep(color, schemeCard) {
        if (this.gameStates.currentState.name != "drawSchemeCards" && 
            this.gameStates.currentState.name != "selectSchemeCard") {
            this.throwError("Cannot do that right now, because state is " + this.gameStates.currentState.name + ".", "selectSchemeCardToKeep");
        }
            
        var currentPlayer = this.validateCurrentPlayer(color, "selectSchemeCardToKeep");
        if (currentPlayer.temporarySchemeCards.length < 1 || ! currentPlayer.canKeepSchemeCard) {
            this.throwError("You have no scheme cards to keep.", "selectSchemeCardToKeep");
        }
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
        if (currentPlayer.temporarySchemeCards.length < 1) {
            this.gameStates.setCurrentState("actionPhase");
        }

    }

    selectSchemeCardToReturn(color, schemeDeckNumber, schemeCardId) {
        console.log("selectSchemeCardToReturn(): " + schemeCardId + " " + schemeDeck);
        this.validateGameStatus("selectSchemeCard", "selectSchemeCardToReturn");
        var currentPlayer = this.validateCurrentPlayer(color, "selectSchemeCardToReturn");
        if (currentPlayer.temporarySchemeCards.length < 1) {
            this.throwError("You have no scheme cards to keep.", "selectSchemeCardToKeep");
        }

        var tempCards = [];
        var found = false;
        var schemeDeck = this.cards.getSchemeDeckByNumber(schemeDeckNumber);
        for (var i=0; i<currentPlayer.temporarySchemeCards.length; i++) {
            if (schemeCardId == currentPlayer.temporarySchemeCards[i].id && found == false) {
                schemeDeck.unshift(currentPlayer.temporarySchemeCards[i]);
                found = true;
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
        if (currentPlayer.temporarySchemeCards.length < 1) {
            this.gameStates.setCurrentState("actionPhase");
        }
    }

    muster(color, locationName, numberOfTroops) {
        console.log("muster(): " + color + " " + locationName + " " + numberOfTroops);
        this.validateGameStatus("actionPhaseMuster", "muster");
        var currentPlayer = this.validateCurrentPlayer(color, "muster");
        var location = this.gameMap.getLocation(locationName);
        if (location.troopsByColor[color] < 1 && location.leaderByColor[color] < 1) {
            this.throwError("Cannot muster troops in a location you do not occupy.", "muster");
        }
        if (numberOfTroops > currentPlayer.troopsToDeploy || numberOfTroops > currentPlayer.supplyTroops) {
            throw new Error("Not enough troops available.", "muster");
        }
        
        location.troopsByColor[color] = location.troopsByColor[color] + numberOfTroops;
        currentPlayer.troopsToDeploy = currentPlayer.troopsToDeploy - numberOfTroops;
        currentPlayer.supplyTroops = currentPlayer.supplyTroops - numberOfTroops;
        this.gameStates.setCurrentState("actionPhase");
    }

    move(color, fromLocationName, toLocationName, numberOfTroops=1, moveLeader=false) {
        console.log("move(): " + color + ": from " + fromLocationName + " to " + toLocationName);
        this.validateGameStatus("actionPhaseMove", "move");
        var currentPlayer = this.validateCurrentPlayer(color, "move");

        var fromLocation = this.gameMap.getLocation(fromLocationName);
        var toLocation = this.gameMap.getLocation(toLocationName);

        if (numberOfTroops > currentPlayer.moveActions + currentPlayer.moveActionsFromLocation[fromLocationName]) {
            throw new Error("You don't have that many troops available to move.", "move()");
        }
        if (! fromLocation.isNeighbor(toLocationName)) {
            throw new Error(toLocationName + " is not a neighbor of " + fromLocationName + ".", "move()");
        }

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

    }

    tax(color, locationName, toBoat=true, marketCoinNotResource=false) {
        console.log("tax(): " + color + ": " + locationName);
        this.validateGameStatus("actionPhaseTax", "tax");
        var currentPlayer = this.validateCurrentPlayer(color, "tax");

        var location = this.gameMap.getLocation(locationName);
        if (! location.doesOccupy(color)) {
            throw new Error("You cannot tax a location that you don't occupy.", "tax()");
        }

        var taxActionsRequired = 2;
        if (location.doesRule(color)) {
            taxActionsRequired = 1;
        }

        if (currentPlayer.taxActions < taxActionsRequired) {
            throw new Error("You do not have enough tax actions.", "tax");
        }
        if (location.resourceCount < 1) {
            throw new Error("Location has no resources.", "tax");
        }

        console.log("tax(): after validations");
        location.resourceCount = location.resourceCount - 1;
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
        this.gameStates.setCurrentState("actionPhase");
        console.log("tax(): exit");
    }

    build(color, locationName, buildingName) {
        console.log("build(): " + color + ": " + locationName + " " + buildingName);
        this.validateGameStatus("actionPhaseBuild", "build");
        var currentPlayer = this.validateCurrentPlayer(color, "build");

        var location = this.gameMap.getLocation(locationName);
        if (!location.doesOccupy(color)) {
            throw new Error("You do not occupy this location.", "build");
        }
        if (location.buildings.length >= 3) {
            throw new Error("The location already has 3 buildings.", "build");
        }
        if (location.hasBuilding(buildingName)) {
            throw new Error("The location already has the same building.", "build");
        }

        var buildActionsRequired = 2;
        if (location.doesRule(color)) {
            buildActionsRequired = 1;
        }
        if (currentPlayer.buildActions < buildActionsRequired) {
            throw new Error("You do not have enough build actions.", "build()");
        }
        if (currentPlayer.buildings[buildingName] < 1) {
            throw new Error("Building not available to player.", "build()");
        }

        currentPlayer.buildings[buildingName]--;
        location.addBuilding(color, buildingName);
        currentPlayer.buildActions = currentPlayer.buildActions - buildActionsRequired;

        this.gameStates.setCurrentState("actionPhase");
        if (buildingName == "stable") {
            currentPlayer.moveActionsFromLocation[locationName] = 2;
        } else if (buildingName == "church") {
            // TODO: conversion
        } else if (buildingName == "tavern") {
            // TODO: test tavern
            currentPlayer.boat.money = currentPlayer.boat.money + location.buildings.length;
            this.gameStates.setCurrentState("oneTimeScheme");
        }

    }

    attack(color, locationName, target, schemeDeckNumber=1) {
        console.log("attack(): " + color + ": " + locationName + " " + target);
        this.validateGameStatus("actionPhaseAttack", "attack");
        var currentPlayer = this.validateCurrentPlayer(color, "attack");
        var troopsLost = 0;
        var location = this.gameMap.getLocation(locationName);
        if ((location.troopsByColor[color] < 1 && location.leaderByColor[color] < 1)) {
            throw new Error("You do not have troops in " + locationName + ".", "attack()");
        }

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
            if ((location.troopsByColor[targetColor] < 1 && location.leaderByColor[targetColor] < 1)) {
                throw new Error(target + " does not have troops to attack in " + locationName + ".", "attack()");
            }

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
            var warPoints = this.claimBoard.claimsByPlayer[color]["warfare"];
            warPoints++;
            this.claimBoard.claimsByPlayer[color]["warfare"] = warPoints;
            // TODO: warfare rewards
            var reward = this.claimBoard.warfareRewards[warPoints];
            if (reward != undefined && reward != null) {
                if (reward == "2 wood") {
                    currentPlayer.boat.addGoodToBoatOrDock("wood");
                    currentPlayer.boat.addGoodToBoatOrDock("wood");
                } else if (reward == "2 coins") {
                    currentPlayer.boat.money++;
                    currentPlayer.boat.money++;
                } else if (reward == "fur") {
                    currentPlayer.boat.addGoodToBoatOrDock("fur");
                } else if (reward == "schemeCard") {
                    // TODO: scheme card
                } else if (reward == "victoryPoint") {
                    currentPlayer.victoryPoints++;
                }
            }
        }
        currentPlayer.attackActions = currentPlayer.attackActions - 1;
        this.gameStates.setCurrentState("actionPhase");

        console.log("attack(): troopsLost=" + troopsLost);
        return troopsLost;
    }

    transferGood(color, direction, resource) {
        console.log("transferGood(): " + color + ": " + direction + " " + resource);
        this.validateGameStatus("actionPhaseTransfer", "transferGood");
        var currentPlayer = this.validateCurrentPlayer(color, "transferGood");
        if (direction == "boatToDock") {
            currentPlayer.boat.moveResourceFromBoatToDock(resource);
        } else {
            currentPlayer.boat.moveResourceFromDockToBoat(resource);
        }
        this.gameStates.setCurrentState("actionPhase"); 
    }

    drawOneTimeSchemeCard(color, schemeDeck) {
        this.validateGameStatus("oneTimeScheme", "drawOneTimeSchemeCard");
        var currentPlayer = this.validateCurrentPlayer(color, "drawOneTimeSchemeCard");

        if (currentPlayer.oneTimeSchemeCard == null) {
            var card = this.cards.drawSchemeCard(schemeDeck);
            this.currentPlayer.oneTimeSchemeCard = card;
        } else {
            this.throwError("Player cannot draw scheme card.", "drawOneTimeSchemeCard");
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


    playSchemeCard(color, schemeCardId) {
        this.validateGameStatus("actionPhasePlaySchemeCard", "playSchemeCard");
        var currentPlayer = this.validateCurrentPlayer(color, "playSchemeCard");
        if (currentPlayer.schemeCardsCanPlay < 1 || currentPlayer.schemeCards.length < 1) {
            this.throwError("Player cannot play a scheme card.", "playSchemeCard");
        }
        var schemeCard = this.cards.getSchemeCardById(schemeCardId);
        
        if (currentPlayer.hasSchemeCard(schemeCardId) && 
            schemeCard.rewardCoinCost <= currentPlayer.boat.money) {
            currentPlayer.boat.money = currentPlayer.boat.money - schemeCard.rewardCoinCost;
            this.collectSchemeCardReward(currentPlayer, schemeCard);
            this.cards.discardedSchemeCards.push(schemeCard);
            var playerSchemeCards = [];
            for (var i=0; i < currentPlayer.schemeCards.length; i++) {
                var playerSchemeCard = currentPlayer.schemeCards[i];
                if (playerSchemeCard.id != schemeCard.id) {
                    playerSchemeCards.push(playerSchemeCard);
                }
            }
            currentPlayer.schemeCards = playerSchemeCards;
        }
        currentPlayer.schemeCardsCanPlay--;
    }

    collectSchemeCardReward(currentPlayer, schemeCard) {
        //var schemeCard = this.cards.getSchemeCardById(schemeCardId);
        for (var i=0; i<schemeCard.rewards.length; i++) {
            var reward = schemeCard.rewards[i];
            // coin, tax, muster, move, build, attack, deedCard, warTrack, buildOrAttack, taxOrMuster
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
            } else if (reward == "warTrack") {
                // TODO
            } else if (reward == "deedCard") {
                // TODO
            } else if (reward == "buildOrAttack") {
                // TODO
            } else if (reward == "taxOrMuster") {
                // TODO
            }
        }
        if (this.gameStates.currentState.name == "actionPhasePlaySchemeCard") {
            this.gameStates.setCurrentState("actionPhase");
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
        this.validateGameStatus("actionPhase", "endTurn");
        var currentPlayer = this.validateCurrentPlayer(color, "endTurn");
        if (currentPlayer.advisorCountForTurn <= currentPlayer.advisors.length) {
            this.throwError("Cannot end turn before playing your advisor.", "endTurn");
        }

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
    }

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


    validateGameStatus(desiredState, method, message=null) {
        if (this.gameStates.currentState.name != desiredState) {
            if (message != null) {
                this.throwError(message, method);
            } else {
                this.throwError("Cannot do that right now, because state is " + this.gameStates.currentState.name + 
                    " and not " + desiredState + ".", method);    
            }
        }
    }

    validateCurrentPlayer(color, method) {
        var currentPlayer = this.players.getCurrentPlayer();
        if (currentPlayer.color != color) {
            this.throwError("Not your turn, " + color + ". Please wait for " + currentPlayer.color + ".", method);
        }
        return currentPlayer;
    }

    throwError(message, method) {
        throw new Error(message, method);
    }
    
}


module.exports = Games