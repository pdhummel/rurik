const GameMap = require('./map.js');
const AuctionBoard = require('./auction.js');
const GamePlayers = require('./player.js');
const AvailableLeaders = require('./leader.js');
const GameStates = require('./state.js');
const Cards = require('./cards.js');
const ClaimBoard = require('./claims.js');
const Validator = require('./validations.js');
const Ai = require('./ai.js');
const lodash = require('lodash');


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

    createGame(name, targetNumberOfPlayers, password=null) {
        var gameStatus = null;
        var game = new Game(name, targetNumberOfPlayers, password);
        console.log("createGame(): gameId=" + game.id);
        this.games[game.id] = game;
        gameStatus = new GameStatus(game, null);
        return gameStatus;
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

    clone(obj) {
        function CloneFactory () {}
        CloneFactory.prototype = obj;
        return new CloneFactory();
    }

    restoreGame(gameObject) {
        //var gameProto = clone(Game.prototype);
        //var game = Object.assign(gameProto, gameObject);
        var newGame = new Game(gameObject.gameName, gameObject.targetNumberOfPlayers, gameObject.password);
        var game = Object.assign(newGame, gameObject);

        var newPlayers = new GamePlayers(game.targetNumberOfPlayers);
        game.players = Object.assign(newPlayers, game.players);
        game.players.restorePlayers();

        var newCards = new Cards();
        game.cards = Object.assign(newCards, game.cards);

        var newGameMap = new GameMap();
        game.gameMap = Object.assign(newGameMap, game.gameMap);
        game.gameMap.restoreGameMap();


        var newGameStates = new GameStates();
        newGameStates.setCurrentState(game.gameStates.currentState.name);
        game.gameStates = newGameStates;

        var newClaimBoard = new ClaimBoard();
        game.claimBoard = Object.assign(newClaimBoard, game.claimBoard);

        var newAvailableLeaders = new AvailableLeaders()
        game.availableLeaders = Object.assign(newAvailableLeaders, game.availableLeaders);

        this.games[game.id] = game;

        if (game.gameStates.currentState.name == "claimPhase") {
            game.updateClaimsForClaimsPhase();
        }

        return game;
    }
}

class Game {
    
    // validate targetNumberOfPlayers
    constructor(gameName, targetNumberOfPlayers=4, password="") {
        this.currentRound = 1;
        this.auctionBoard = null;
        this.gameMap = new GameMap();
        this.ai = new Ai();
        this.cards = new Cards();
        this.claimBoard = new ClaimBoard();
        this.targetNumberOfPlayers = targetNumberOfPlayers;
        this.players = new GamePlayers(targetNumberOfPlayers);
        this.availableLeaders = new AvailableLeaders();
        this.gameStates = new GameStates();
        // TODO: generate id with uuid
        this.id = Date.now();
        // TODO: formatted creation date
        this.creationDate = null;
        this.name = gameName;
        this.password = password;
        this.deedCardToVerify = null;
    }

    aiEvaluateGame() {
        var thisGame = this;
        setTimeout(function() { thisGame.ai.evaluateGame(thisGame); });
    }

    changePlayerAndOrState(player, gameStateName) {
        if (player != undefined && player != null) {
            this.players.setCurrentPlayer(player);
        }
        if (gameStateName != undefined && gameStateName != null && gameStateName.length > 0) {
            this.gameStates.setCurrentState("waitingForFirstPlayerSelection");
        }
        this.aiEvaluateGame();
    }


    joinGame(name, color, position, isPlayerAi=false, password=null) {
        Validator.validateColor(color);
        Validator.validateTablePosition(position);
        this.validateGameStatus("waitingForPlayers", "joinGame", "Game is no longer accepting players.");
        if (this.players.players.length > this.players.targetNumberOfPlayers) {
            throw new Error("Game is full and already has " + this.players.targetNumberOfPlayers + " players.", "joinGame");
        }
        if (this.password != undefined && this.password != null && this.password.length > 0 && this.password != password) {
            throw new Error("Incorrect password specified for the game.", "joinGame")
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
        this.aiEvaluateGame();
    }

    selectRandomFirstPlayer() {
        this.validateGameStatus("waitingForFirstPlayerSelection", "selectRandomFirstPlayer");
        var randomPlayer = this.players.getRandomPlayer();
        this.players.setFirstPlayer(randomPlayer);
        this.players.setCurrentPlayer(randomPlayer);
        this.gameStates.setCurrentState("waitingForLeaderSelection");
        this.aiEvaluateGame();
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
        this.aiEvaluateGame();
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
        this.aiEvaluateGame();
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
        this.aiEvaluateGame();
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
        this.aiEvaluateGame();
    }

    playAdvisor(color, columnName, advisor, bidCoins=0) {
        console.log("playAdvisor():", color, columnName, advisor, bidCoins);
        this.validateGameStatus("strategyPhase", "playAdvisor");
        var currentPlayer = this.validateCurrentPlayer(color, "playAdvisor");
        //console.log("playAdvisor(): currentPlayer=" + currentPlayer);
        if (! currentPlayer.isAdvisorAvailable(advisor)) {
            throw new Error("No advisor=" + advisor + " is available.", "playAdvisor");
        }
        if (currentPlayer.boat.money < bidCoins) {
            throw new Error("Bid exceeded money available.", "playAdvisor");
        }
        // You may only place an advisor in a column that already contains any of your own
        // advisors after you have placed advisors in three or more different columns.
        if (this.auctionBoard.isPlayerAlreadyInColumn(columnName, color)) {
            if (! this.auctionBoard.isPlayerIn3Columns(color)) {
                throw new Error("You cannot place an advisor in the same column, " + columnName + ", until you are present in 3 or more different columns.", "playAdvisor");
            }
        }
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
        this.aiEvaluateGame();
    }

    // retrieve advisor, rows=1-4
    takeMainAction(color, advisor, actionColumnName, row, forfeitAction=false) {
        console.log("takeMainAction(): ", color, "advisor=" + advisor, actionColumnName, "row(1-4)=" + row, forfeitAction);
        this.validateGameStatus("retrieveAdvisor", "takeMainAction");
        var currentPlayer = this.validateCurrentPlayer(color, "takeMainAction");
        if (currentPlayer.tookMainActionForTurn == true) {
            this.throwError("Player already took main action for this turn.", "takeMainAction");
        }

        if (currentPlayer.advisors.length < 1 || advisor != currentPlayer.advisors[0]) {
            // TODO: fix thlis
            console.log("takeMainAction(): advisor does not match: " + advisor + " " + currentPlayer.color + " " + JSON.stringify(currentPlayer.advisors));
        }

        // TODO: figure out how to differentiate if there are 2 with the same advisor number 
        // in the same column - for now, process top to bottom.
        if (currentPlayer.advisors.length > 0 && advisor == currentPlayer.advisors[0]) {
            currentPlayer.advisors.shift();
            var auctionSpaces = currentPlayer.advisorsToAuctionSpace[advisor];
            var auctionSpace = null;
            // auctionSpaces should only be length of 1 or 2
            if (auctionSpaces.length > 0 && auctionSpaces[0].actionName == actionColumnName) {
                auctionSpace = auctionSpaces.shift();
                console.log("takeMainAction(): shift " + auctionSpace.actionName);
            } else if (auctionSpaces.length > 1 && auctionSpaces[1].actionName == actionColumnName) {
                auctionSpace = auctionSpaces.pop();
                console.log("takeMainAction(): pop " + auctionSpace.actionName);
            } else {
                // TODO: Error: Could not retrieve advisor.
                console.log("takeMainAction(): auctionSpaces.length=" + auctionSpaces.length);
                console.log("takeMainAction(): actionColumnName=" + actionColumnName);
                console.log("takeMainAction(): auctionSpaces0=" + auctionSpaces[0].actionName);
                console.log("takeMainAction(): auctionSpaces1=" + auctionSpaces[1].actionName);
                console.log("takeMainAction(): " + JSON.stringify(this.auctionBoard));
                throw new Error("Could not retrieve advisor.", "takeMainAction()");        
            }

            // If a player has no troops on the map, they may muster their leader + 1 other troop
            // to any one region.
            var occupiesSomewhere = false;
            var locationsForPlayer = this.gameMap.getLocationsForPlayer(color);
            if (locationsForPlayer["occupies"].length > 0) {
                occupiesSomewhere = true;
            }
            if (! occupiesSomewhere) {
                currentPlayer.troopsToDeploy = 2;
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
                    console.log("takeMainAction(): build actions=" + currentPlayer.buildActions);
                } else if (actionColumnName == "tax") {
                    currentPlayer.taxActions = currentPlayer.taxActions + auctionSpace.quantity;
                    console.log("takeMainAction(): tax actions=" + currentPlayer.taxActions);
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
        this.aiEvaluateGame();
    }

    schemeFirstPlayer(currentPlayerColor, firstPlayerColor) {
        console.log("schemeFirstPlayer(): " + currentPlayerColor + " " + firstPlayerColor);
        this.validateGameStatus("schemeFirstPlayer", "schemeFirstPlayer");
        this.validateCurrentPlayer(currentPlayerColor, "schemeFirstPlayer");
        this.players.setNextFirstPlayerByColor(firstPlayerColor);
        this.gameStates.setCurrentState("drawSchemeCards");
        this.aiEvaluateGame();
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
            if (card == undefined || card == null) {
                console.log("drawSchemeCards(): Warning null card: schemeCardsToDraw=1");
                this.gameStates.setCurrentState("actionPhase");
            } else {
                currentPlayer.temporarySchemeCards.push(card);
                this.selectSchemeCardToKeep(color, card);
            }
        } else {
            for (var i=0; i<currentPlayer.schemeCardsToDraw; i++) {
                var card = this.cards.drawSchemeCard(schemeDeck);
                if (card == undefined || card == null) {
                    console.log("drawSchemeCards(): Warning null card: schemeCardsToDraw=" + currentPlayer.schemeCardsToDraw);
                    this.gameStates.setCurrentState("actionPhase");
                } else {
                    currentPlayer.temporarySchemeCards.push(card);
                    currentPlayer.returnSchemeDeck = schemeDeck;
                    this.gameStates.setCurrentState("selectSchemeCard");
                }
            }
        }
        currentPlayer.schemeCardsToDraw == 0;
        this.aiEvaluateGame();
    }

    selectSchemeCardToKeep(color, schemeCard) {
        if (this.gameStates.currentState.name != "drawSchemeCards" && 
            this.gameStates.currentState.name != "selectSchemeCard") {
            this.throwError("Cannot do that right now, because state is " + this.gameStates.currentState.name + ".", "selectSchemeCardToKeep");
        }
            
        var currentPlayer = this.validateCurrentPlayer(color, "selectSchemeCardToKeep");
        console.log("selectSchemeCardToKeep():", color, schemeCard, currentPlayer.temporarySchemeCards.length, currentPlayer.canKeepSchemeCard);
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
        this.aiEvaluateGame();
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
        console.log("selectSchemeCardToReturn(): " + JSON.stringify(currentPlayer.temporarySchemeCards));
        for (var i=0; i<currentPlayer.temporarySchemeCards.length; i++) {
            // TODO: TypeError: Cannot read property 'id' of undefined
            var tempSchemeCardId = currentPlayer.temporarySchemeCards[i].id;
            if (schemeCardId == tempSchemeCardId && found == false) {
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
        this.aiEvaluateGame();
    }

    muster(color, locationName, numberOfTroops) {
        console.log("muster(): " + color + " " + locationName + " " + numberOfTroops);
        this.validateGameStatus("actionPhaseMuster", "muster");
        var currentPlayer = this.validateCurrentPlayer(color, "muster");
        var location = this.gameMap.getLocation(locationName);
        var occupiesSomewhere = false;
        var locationsForPlayer = this.gameMap.getLocationsForPlayer(color);
        if (locationsForPlayer["occupies"].length > 0) {
            occupiesSomewhere = true;
        }
        // If a player has no troops on the board, they can muster to any location.
        if (location.troopsByColor[color] < 1 && location.leaderByColor[color] < 1 && occupiesSomewhere) {
            this.throwError("Cannot muster troops in a location you do not occupy.", "muster");
        }
        if (numberOfTroops > currentPlayer.troopsToDeploy || numberOfTroops > (currentPlayer.supplyTroops + currentPlayer.supplyLeader)) {
            throw new Error("Not enough troops available.", "muster");
        }
        // muster leader first
        if (currentPlayer.supplyLeader > 0) {
            location.leaderByColor[color] = 1;
            currentPlayer.supplyLeader = 0;
            currentPlayer.troopsToDeploy--;
            numberOfTroops--;
        }
        location.troopsByColor[color] = location.troopsByColor[color] + numberOfTroops;
        currentPlayer.troopsToDeploy = currentPlayer.troopsToDeploy - numberOfTroops;
        currentPlayer.supplyTroops = currentPlayer.supplyTroops - numberOfTroops;
        this.gameStates.setCurrentState("actionPhase");
    }

    move(color, fromLocationName, toLocationName, numberOfTroops=1, moveLeader=false) {
        console.log("move(): " + color + ": from " + fromLocationName + " to " + toLocationName + " " + numberOfTroops);
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

        if (moveLeader && fromLocation.isLeaderInLocation(color) && (numberOfTroops == 1 || numberOfTroops == 0)) {
            fromLocation.leaderByColor[color] = fromLocation.leaderByColor[color] - 1;
            toLocation.leaderByColor[color] = toLocation.leaderByColor[color] + 1;
        } else if (moveLeader) {
            console.log("move(): fromLocation=" + fromLocation.name + " isLeaderInLocation=" + fromLocation.isLeaderInLocation(color) + " " + JSON.stringify(fromLocation));
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

    build(color, locationName, buildingName, targetToConvert=null) {
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
            var converted = false;
            // Per rules, you can convert an enemy even if you don't have any troops in supply.
            // Also you can't convert leaders.
            if (targetToConvert == "rebel" && location.rebels.length > 0) {
                location.rebels.pop();
                if (currentPlayer.supplyTroops > 0) {
                    location.troopsByColor[color]++;
                    currentPlayer.supplyTroops--;
                }
                converted = true;
            } else if (location.troopsByColor[targetToConvert] > 0) {
                location.troopsByColor[targetToConvert]--;
                if (currentPlayer.supplyTroops > 0) {
                    location.troopsByColor[color]++;
                    currentPlayer.supplyTroops--;
                }
                converted = true;
            }
            if (converted  == false && targetToConvert != undefined && targetToConvert != null && targetToConvert.length > 0) {
                this.throwError("Could not convert enemy " + targetToConvert, "build");
            }
        } else if (buildingName == "tavern") {
            currentPlayer.boat.money = currentPlayer.boat.money + location.buildings.length;
            // Per rules, if you have not played a scheme card yet this turn, you may play the top card
            // from the scheme discard pile and then remove it from the game.
            //this.gameStates.setCurrentState("oneTimeScheme");
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
                    console.log("attack(): rebel award coin");
                } else if (reward == "2 coins") {
                    currentPlayer.boat.money = currentPlayer.boat.money + 2;
                    console.log("attack(): rebel award 2 coins");
                } else {
                    currentPlayer.boat.addGoodToBoatOrDock(reward);
                    console.log("attack(): rebel award " + reward);
                }
                currentPlayer.boat.capturedRebels = currentPlayer.boat.capturedRebels + 1;
                console.log("attack(): " + color + " defeated rebel");
            } else {
                throw new Error("There are no rebels  to attack in " + locationName + ".", "attack()");
            }
        } else {
            var targetColor = target;
            if ((location.troopsByColor[targetColor] < 1 && location.leaderByColor[targetColor] < 1)) {
                throw new Error(target + " does not have troops to attack in " + locationName + ".", "attack()");
            }
            var targetPlayer = this.players.getPlayerByColor(targetColor);

            var schemeCardsToDraw = 1;
            if (location.doesRule(targetColor)) {
                schemeCardsToDraw++;
            }

            if (location.troopsByColor[targetColor] > 0) {
                location.troopsByColor[targetColor]--;
                targetPlayer.supplyTroops++;
                console.log("attack(): " + color + " killed troop for " + targetPlayer.color);
            } else {
                location.leaderByColor[targetColor]--;
                targetPlayer.supplyLeader = 1;
                console.log("attack(): " + color + " killed leader for " + targetPlayer.color);
            }

            if (location.countStrongholds(targetColor) > 0) {
                schemeCardsToDraw++;
            }
            //var schemeDeck = this.cards.getSchemeDeckByNumber(schemeDeckNumber);
            for (var i=0; i<schemeCardsToDraw; i++) {
                //var card = this.cards.drawAndDiscardSchemeCard(schemeDeckNumber);
                var card = this.cards.drawAndReturnSchemeCard(schemeDeckNumber, schemeCardsToDraw);
                var deaths = 0;
                var removeLeader = false;
                if (card != undefined && card != null) {
                    deaths = card.deaths;
                    if (deaths > location.troopsByColor[color]) {
                        if (location.leaderByColor[color] > 0) {
                            removeLeader = true;
                        }
                        deaths = location.troopsByColor[color];
                    }    
                }
                location.troopsByColor[color] = location.troopsByColor[color] - deaths;
                currentPlayer.supplyTroops = currentPlayer.supplyTroops + deaths;
                if (removeLeader) {
                    location.leaderByColor[color] = 0;
                    currentPlayer.supplyLeader = 1;
                    deaths++;
                }
                if (deaths > 0) {
                    troopsLost = deaths;
                    break;
                }
            }
            this.goUpWarTrack(currentPlayer);
        }
        currentPlayer.attackActions = currentPlayer.attackActions - 1;
        this.gameStates.setCurrentState("actionPhase");

        console.log("attack(): " + color + " troopsLost=" + troopsLost);
        return troopsLost;
    }


    goUpWarTrack(currentPlayer) {
        var color = currentPlayer.color;
        var warPoints = this.claimBoard.claimsByPlayer[color]["warfare"];
        warPoints++;
        this.claimBoard.claimsByPlayer[color]["warfare"] = warPoints;
        var reward = this.claimBoard.warfareRewards[warPoints];
        this.handleWarTrackReward(currentPlayer, reward);
    }

    // TODO: warfare rewards
    handleWarTrackReward(currentPlayer, reward) {
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


    playSchemeCard(color, schemeCardId, schemeCardActionChoice) {
        console.log("playSchemeCard(): " + color + " " + schemeCardId + " " + schemeCardActionChoice);
        this.validateGameStatus("actionPhasePlaySchemeCard", "playSchemeCard");
        var currentPlayer = this.validateCurrentPlayer(color, "playSchemeCard");
        if (currentPlayer.schemeCardsCanPlay < 1 || currentPlayer.schemeCards.length < 1) {
            this.throwError("Player cannot play a scheme card.", "playSchemeCard");
        }
        var schemeCard = this.cards.getSchemeCardById(schemeCardId);
        
        if (currentPlayer.hasSchemeCard(schemeCardId) && 
            schemeCard.rewardCoinCost <= currentPlayer.boat.money) {
            currentPlayer.boat.money = currentPlayer.boat.money - schemeCard.rewardCoinCost;
            this.collectSchemeCardReward(currentPlayer, schemeCard, schemeCardActionChoice);
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

    collectSchemeCardReward(currentPlayer, schemeCard, schemeCardActionChoice=null) {
        console.log("collectSchemeCardReward(): " + currentPlayer.color + " " + schemeCard.id + " " + schemeCardActionChoice);
        var takeDeedCard = false;
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
                this.goUpWarTrack(currentPlayer);
                // TODO: handle warTrack reward being a scheme card
            } else if (reward == "deedCard") {
                takeDeedCard = true;
            } else if (reward == "buildOrAttack") {
                if (schemeCardActionChoice == "build") {
                    currentPlayer.buildActions++;
                }
                if (schemeCardActionChoice == "attack") {
                    currentPlayer.attackActions++;
                }
            } else if (reward == "taxOrMuster") {
                if (schemeCardActionChoice == "tax") {
                    currentPlayer.taxActions++;
                }
                if (schemeCardActionChoice == "muster") {
                    if (currentPlayer.supplyTroops > 0) {
                        currentPlayer.supplyTroops--;
                        currentPlayer.troopsToDeploy++;
                    }
                }
            }
        }
        if (takeDeedCard) {
            this.gameStates.setCurrentState("takeDeedCardForActionPhase");
        }
        if (this.gameStates.currentState.name == "actionPhasePlaySchemeCard") {
            this.gameStates.setCurrentState("actionPhase");
        }

    }

    takeDeedCard(color, deedCardName) {
        console.log("takeDeedCard(): " + color + " " + deedCardName);
        if (deedCardName == null) {
            this.throwError("Deed card was not selected.", "takeDeedCard");
        }
        this.validateGameStatus2(["takeDeedCardForActionPhase", "takeDeedCardForClaimPhase"], "takeDeedCard");
        var currentPlayer = this.validateCurrentPlayer(color, "takeDeedCard");
        this.cards.takeDeedCard(currentPlayer, deedCardName);
        if (this.gameStates.currentState.name == "takeDeedCardForActionPhase") {
            this.gameStates.setCurrentState("actionPhase");
        } else {
            currentPlayer.finishedRound = true;
            var nextPlayer = this.players.getNextPlayer(currentPlayer);            
            if (! nextPlayer.finishedRound) {
                this.players.setCurrentPlayer(nextPlayer);
            } else {
                this.endRound();
            }
        }
        this.aiEvaluateGame();
    }

    accomplishedDeed(color, deedCardName, claimStatements) {
        console.log("accomplishedDeed(): " + color + " " + deedCardName);
        this.validateGameStatus("actionPhaseAccomplishDeed", "accomplishedDeed");
        var currentPlayer = this.validateCurrentPlayer(color, "accomplishedDeed");
        this.deedCardToVerify = this.cards.allDeedCards[deedCardName];
        this.deedCardToVerify.playerColor = color;
        this.deedCardToVerify.claimStatements = claimStatements;
        for (var i=0; i<claimStatements.length; i++) {
            var claimText = null;
            var claimStatement = claimStatements[i];
            if (claimStatement.claimStatementChoice == undefined || claimStatement.claimStatementChoice == null ||
                claimStatement.claimStatementChoice == "none" || claimStatement.claimStatementChoice == "") {
                continue;
            } else if (claimStatement.claimStatementChoice == "pay") {
                claimText = "Pay ";
                if (claimStatement.claimPayChoice == "coin") {
                    claimText = claimText + "coin";
                    if (currentPlayer.boat.money < 1) {
                        this.throwError("You do not have enough money", "accomplishedDeed");
                    }
                } else if (claimStatement.claimPayChoice == "resource") {
                    claimText = claimText + claimStatement.claimPayResourceChoice;
                    if (! currentPlayer.boat.goodsOnDock[claimStatement.claimPayResourceChoice] > 0) {
                        this.throwError("You do not have " + claimStatement.claimPayResourceChoice + " on your dock.", "accomplishedDeed");
                    }
                } else if (claimStatement.claimPayChoice == "scheme card") {
                    claimText = claimText + "scheme card";
                    if (currentPlayer.schemeCards.length < 1) {
                        this.throwError("You do not have a scheme card");
                    }
                } else {
                    claimText = claimText + "???"
                    this.throwError("Payment not specified.", "accomplishedDeed");
                }
            } else if (claimStatement.claimStatementChoice == "remove") {
                claimText = "Remove ";
                var location = this.gameMap.locationByName(claimStatement.claimRemoveLocationChoice);
                if (claimStatement.claimRemoveChoice == "troop") {
                    claimText = claimText + "troop"
                    if (! location.doesOccupy(color)) {
                        this.throwError("You do not have troops in " + claimStatement.claimRemoveLocationChoice, "accomplishDeed");
                    }
                } else if (claimStatement.claimRemoveChoice == "building") {
                    claimText = claimText + claimStatement.claimRemoveBuildingChoice;
                    if (! location.doesPlayerHaveThisBuilding(color, claimStatement.claimRemoveBuildingChoice)) {
                        this.throwError("You do not have a " + claimStatement.claimRemoveBuildingChoice + " in " + claimStatement.claimRemoveLocationChoice, "accomplishDeed");
                    }
                } else {
                    claimText = claimText + "???";
                    this.throwError("What to remove not specified.", "accomplishedDeed");
                }
                claimText = claimText + " from " + claimStatement.claimRemoveLocationChoice;
            } else if (claimStatement.claimStatementChoice == "assert") {
                claimText = "Assert: " + claimStatement.claimAssertion;
            }
            this.deedCardToVerify.summarizedClaimStatements.push(claimText);
        }
        this.gameStates.setCurrentState("actionPhaseVerifyDeed");
        var nextPlayer = this.players.getNextPlayer(currentPlayer);
        // The AI trusts you
        while (nextPlayer.isPlayerAi && nextPlayer.color != currentPlayer.color) {
            this.deedCardToVerify.verifiedByPlayers[nextPlayer.color] = true;
            nextPlayer = this.players.getNextPlayer(nextPlayer);
        }
        this.players.setCurrentPlayer(nextPlayer);        
        return this.deedCardToVerify;
    }

    verifyDeed(color, verified) {
        var deedCardName = this.deedCardToVerify.name;
        console.log("verifyDeed(): " + color + " " + deedCardName);
        this.validateGameStatus("actionPhaseVerifyDeed", "verifyDeed");
        var currentPlayer = this.validateCurrentPlayer(color, "verifyDeed");
        var deedCard = this.cards.allDeedCards[deedCardName];
        this.deedCardToVerify = deedCard;
        deedCard.verifiedByPlayers[color] = verified;
        if (currentPlayer.color == this.deedCardToVerify.playerColor) {
            var colors = ["red", "blue", "yellow", "white"];
            var isGood = true;
            for (var c=0; c<colors.length; c++) {
                if (deedCard.verifiedByPlayers[colors[c]] == false) {
                    isGood = false;
                }
            }
            if (isGood) {
                this.redeemDeed(currentPlayer, this.deedCardToVerify);
            } else {
                for (var c=0; c<colors.length; c++) {
                    deedCard.verifiedByPlayers[colors[c]] = null;
                }    
            }
            this.deedCardToVerify = null;
            this.gameStates.setCurrentState("actionPhase");
        } else {
            var nextPlayer = this.players.getNextPlayer(currentPlayer);
            // The AI trusts you
            while (nextPlayer.isPlayerAi && nextPlayer.color) {
                deedCard.verifiedByPlayers[nextPlayer.color] = true;
                nextPlayer = this.players.getNextPlayer(nextPlayer);
            }
            this.players.setCurrentPlayer(nextPlayer);   
        }
        return deedCard;
    }

    redeemDeed(player, deedCard) {
        console.log("reedeemDeed(): " + deedCard.name);
        var claimStatements = deedCard.claimStatements;
        for (var i=0; i<claimStatements.length; i++) {
            var claimStatement = claimStatements[i];
            if (claimStatement.claimStatementChoice == "pay") {
                if (claimStatement.claimPayChoice == "coin") {
                    if (player.boat.money < 1) {
                        this.throwError("You do not have enough money", "reedeemDeed");
                    }
                    player.boat.money--;
                } else if (claimStatement.claimPayChoice == "resource") {
                    if (! player.boat.goodsOnDock[claimStatement.claimPayResourceChoice] > 0) {
                        this.throwError("You do not have " + claimStatement.claimPayResourceChoice + " on your dock.", "reedeemDeed");
                    }
                    player.boat.goodsOnDock[claimStatement.claimPayResourceChoice]--;
                } else if (claimStatement.claimPayChoice == "scheme card") {
                    if (player.schemeCards.length < 1) {
                        this.throwError("You do not have a scheme card");
                    }
                    var schemeCard = this.cards.getSchemeCardById(claimStatement.claimPaySchemeCardChoice);
                    this.cards.discardedSchemeCards.push(schemeCard);
                    // remove the scheme card
                    var playerSchemeCards = [];
                    for (var i=0; i < currentPlayer.schemeCards.length; i++) {
                        var playerSchemeCard = currentPlayer.schemeCards[i];
                        if (playerSchemeCard.id != schemeCard.id) {
                            playerSchemeCards.push(playerSchemeCard);
                        }
                    }
                    currentPlayer.schemeCards = playerSchemeCards;
                }
            } else if (claimStatement.claimStatementChoice == "remove") {
                var location = this.gameMap.locationByName(claimStatement.claimRemoveLocationChoice);
                if (claimStatement.claimRemoveChoice == "troop") {
                    claimText = claimText + "troop"
                    if (! location.doesOccupy(color) && location.troopsByColor[player.color] > 0) {
                        this.throwError("You do not have troops in " + claimStatement.claimRemoveLocationChoice, "accomplishDeed");
                    }
                    location.troopsByColor[player.color]--;
                    player.supplyTroops++;
                } else if (claimStatement.claimRemoveChoice == "building") {
                    if (! location.doesPlayerHaveThisBuilding(color, claimStatement.claimRemoveBuildingChoice)) {
                        this.throwError("You do not have a " + claimStatement.claimRemoveBuildingChoice + " in " + claimStatement.claimRemoveLocationChoice, "accomplishDeed");
                    }
                    // remove the building
                    var locationBuildings = [];
                    for (var j=0; j<location.buildings; j++) {
                        var building = location.buildings[j];
                        if (building.name != claimStatement.claimRemoveBuildingChoice) {
                            locationBuildings.push(building);
                        }
                    }
                    location.buildings = locationBuildings;
                    player.buildings[claimStatement.claimRemoveBuildingChoice]++;
                }
            }
        }
        deedCard.accomplished = true;
        for (var i=0; i<deedCard.rewards.length; i++) {
            // TODO: collect deed card rewards
            // scheme2cards, attackMinusScheme, moveAnywhere, warTrack,
            // muster, move, build, coin, tax
        }
    }

    endRound() {
        console.log("endRound()");
        this.currentRound++;
        if (this.currentRound > 4) {
            this.endGame();
        } else {
            this.players.setCurrentPlayer(this.players.firstPlayer);
            var advisors = this.getAdvisorsForRound(this.players.getNumberOfPlayers(), this.currentRound-1);
            this.players.setAdvisors(advisors);
            this.players.endRoundForPlayers(this.claimBoard);
            this.gameMap.resetResources();
            this.gameStates.setCurrentState("strategyPhase");
        }
    }

    endGame() {
        console.log("endGame() ");
        this.gameStates.setCurrentState("endGame");
    }

    calculateEndGameStats() {
        var endGameStats = {};
        endGameStats["player"] = {};
        endGameStats["rule"] = {};
        endGameStats["build"] = {};
        endGameStats["trade"] = {};
        endGameStats["warfare"] = {};
        endGameStats["vp"] = {};
        endGameStats["deeds"] = {};
        endGameStats["secretAgenda"] = {};
        endGameStats["total"] = {};

        var topWarfare = 0;
        var secondWarfare = 0;
        var playersWithTopWarfare = 0;
        for (var i=0; i<this.players.players.length; i++) {
            var player = this.players.players[i];
            var color = player.color;
            var warfare = this.claimBoard.claimsByPlayer[color]["warfare"];
            if (warfare > topWarfare) {
                topWarfare = warfare;
                playersWithTopWarfare = 1;
            } else if (warfare == topWarfare) {
                playersWithTopWarfare++;
            } else if (warfare > secondWarfare) {
                secondWarfare = warfare;
            }
        }

        for (var i=0; i<this.players.players.length; i++) {
            var player = this.players.players[i];
            var color = player.color;
            endGameStats["player"][color] = player;
            endGameStats["rule"][color] = this.claimBoard.claimsByPlayer[color]["rule"];
            endGameStats["build"][color] = this.claimBoard.claimsByPlayer[color]["build"];
            endGameStats["trade"][color] = this.claimBoard.claimsByPlayer[color]["trade"];
            endGameStats["vp"][color] = player.victoryPoints;

            // 3 points for first place. 
            // If there is a tie for first, each gets 3 points and no second place is awarded.
            // 1 point for second place.
            // If there is a tie for second, each gets 1 point.
            var warfarePoints = 0;
            var warfare = this.claimBoard.claimsByPlayer[color]["warfare"];
            if (warfare == topWarfare) {
                warfarePoints = 3;
            } else if (warfare == secondWarfare && playersWithTopWarfare == 1) {
                warfarePoints = 1;
            }
            endGameStats["warfare"][color] = warfarePoints;

            var deedCardPoints = 0;
            for (var j=0; j<player.deedCards.length; j++) {
                var deedCard = player.deedCards[j];
                if (deedCard.accomplished) {
                    deedCardPoints = deedCardPoints + deedCard.victoryPoints;
                }
            }
            endGameStats["deeds"][color] = deedCardPoints;

            var secretAgendaPoints = 0;
            for (j=0; j<player.secretAgenda.length; j++) {
                var secretAgendaCard = player.secretAgenda[j];
                if (secretAgendaCard.accomplished) {
                    secretAgendaPoints = secretAgendaPoints + secretAgendaCard.points;
                }
            }
            endGameStats["secretAgenda"][color] = secretAgendaPoints;


            endGameStats["total"][color] = endGameStats["rule"][color] + endGameStats["build"][color] + endGameStats["trade"][color] +
              endGameStats["warfare"][color] + endGameStats["vp"][color] + endGameStats["deeds"][color] + endGameStats["secretAgenda"][color];
        }
        return endGameStats;
    }

    getFirstPlacePlayers(endGameStats) {
        var firstPlacePlayers = [];
        var firstPlaceScore = 0;
        var colors = ["blue", "white", "yellow", "red"];
        for (var i=0; i<colors; i++) {
            var color = colors[i];
            var score = endGameStats["total"][color];
            if (score > firstPlaceScore) {
                firstPlaceScore = score;
                firstPlacePlayers = [];
            }
            if (score >= firstPlaceScore) {
                firstPlacePlayers.push(color);
            }
        }
        return firstPlacePlayers;
    }

    playMusterConversionTile(currentPlayer, resource1, resource2) {
        console.log("playMusterConversionTile(): " + currentPlayer.color + " " + resource1 + " " + resource2);
        var actions = currentPlayer.boat.useMusterConversionTile(resource1, resource2);
        if (currentPlayer.supplyTroops >= actions) {
            currentPlayer.troopsToDeploy = currentPlayer.troopsToDeploy + actions;
            currentPlayer.supplyTroops = currentPlayer.supplyTroops - actions;
        }
    }

    playBuildConversionTile(currentPlayer, resource1, resource2) {
        console.log("playBuildConversionTile(): " + currentPlayer.color + " " + resource1 + " " + resource2);
        var actions = currentPlayer.boat.useBuildConversionTile(resource1, resource2);
        currentPlayer.buildActions = currentPlayer.buildActions + actions;
    }

    playAttackConversionTile(currentPlayer) {
        console.log("playBuildAttackConversionTile(): " + currentPlayer.color);
        var actions = currentPlayer.boat.useAttackConversionTile();
        currentPlayer.attackActions = currentPlayer.attackActions + actions;
    }

    playConversionTile(color, conversionTileName, resource1, resource2) {
        console.log("playConversionTile(): " + color + " " + conversionTileName);
        this.validateGameStatus("actionPhasePlayConversionTile", "playConversionTile");
        var currentPlayer = this.validateCurrentPlayer(color, "playConversionTile");
        if (currentPlayer.convertedGoodsForTurn) {
            this.throwError("Cannot play conversion tiles at this time.", "playConversionTile");
        }
        if (conversionTileName == "attack") {
            this.playAttackConversionTile(currentPlayer);
        } else if (conversionTileName == "muster") {
            this.playMusterConversionTile(currentPlayer, resource1, resource2);
        } else if (conversionTileName == "build") {
            this.playBuildConversionTile(currentPlayer, resource1, resource2);
        }
        currentPlayer.convertedGoodsForTurn = true;
        this.gameStates.setCurrentState("actionPhase");
    }

    endCurrentAction(color) {
        console.log("endCurrentAction(): " + color);
        if (this.gameStates.currentState.name == "oneTimeScheme" || this.gameStates.currentState.name == "scheme") {
            var currentPlayer = this.players.getCurrentPlayer();
            if (currentPlayer.color == color) {
                this.gameStates.setCurrentState("actionPhase");
            }
        }
    }

    endTurn(color) {
        console.log("endTurn(): " + color);
        this.validateGameStatus("actionPhase", "endTurn");
        var currentPlayer = this.validateCurrentPlayer(color, "endTurn");
        if (currentPlayer.advisorCountForTurn <= currentPlayer.advisors.length) {
            this.throwError("Cannot end turn before playing your advisor.", "endTurn");
        }
        currentPlayer.troopsToDeploy = 0;
        currentPlayer.advisorCountForTurn = currentPlayer.advisors.length;
        currentPlayer.taxActions = 0;
        currentPlayer.buildActions = 0;
        currentPlayer.moveActions = 0;
        currentPlayer.moveAnywhereActions = 0;
        currentPlayer.moveActionsFromLocation = {};
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
            this.aiEvaluateGame();
        } else {
            var colors = ["blue", "white", "red", "yellow"];
            var hasAdvisors = false;
            for (var i=0; i<colors.length; i++) {
                var player = this.players.getPlayerByColor(colors[i]);
                if (player.advisors.length > 0) {
                    hasAdvisors = true;
                    console.log("endTurn(): Warning: remaining advisors for color=" + colors[i] + ", " + JSON.stringify(player.advisors));
                }
            }
            if (hasAdvisors) {
                console.log("endTurn(): currentPlayer was " + currentPlayer.color + ", nextPlayer=" + nextPlayer.color);
            }
            this.gameStates.setCurrentState("claimPhase");
            this.updateClaimsForClaimsPhase();
        }
    }

    updateClaimsForClaimsPhase() {
        console.log("updateClaimsForClaimsPhase()");
        this.validateGameStatus("claimPhase", "updateClaimsForClaimsPhase");
        this.claimBoard.updateClaimsForClaimsPhase(this.players.players, this.gameMap);
        if (this.currentRound != 4) {
            this.players.setCurrentPlayer(this.players.firstPlayer);
            this.gameStates.setCurrentState("takeDeedCardForClaimPhase")    
        } else {
            this.gameStates.setCurrentState("endGame");
        }
        this.aiEvaluateGame();
        console.log("updateClaimsForClaimsPhase(): " + this.gameStates.currentState);
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
        actionToStateMap["convertGoodsAction"] = "actionPhasePlayConversionTile";
        actionToStateMap["accomplishDeedAction"] = "actionPhaseAccomplishDeed";
        //actionToStateMap["convertGoodsAction"] = "actionPhaseVerifyDeed";
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
        advisorsByRound[2] = [1, 2, 2, 4, 5];
        if (numberOfPlayers == 2) {
            advisorsByRound[3] = [1, 2, 2, 3, 4, 5];
        } else if (numberOfPlayers == 3) {
            advisorsByRound[3] = [1, 2, 2, 3, 4, 5];
        } else {
            advisorsByRound[3] = [1, 2, 2, 4, 5];
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

    validateGameStatus2(possibleStates, method, message=null) {
        console.log("validateGameStatus2(): " + possibleStates + " " + this.gameStates.currentState.name);
        var found = false;
        for (var i=0; i<possibleStates.length; i++) {
            var desiredState = possibleStates[i];
            if (this.gameStates.currentState.name == desiredState) {
                found = true;
                break;
            }
        }
        if (! found) {
            if (message != null) {
                this.throwError(message, method);
            } else {
                this.throwError("Cannot do that right now, because state is " + this.gameStates.currentState.name + 
                    " and not one of the desired states.", method);    
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


//module.exports = Games
module.exports = {
    Games: Games,
    Game: Game
}