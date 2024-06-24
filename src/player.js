
const BoatMat = require('./boat.js');

class GamePlayers {
    constructor(targetNumberOfPlayers) {
        this.targetNumberOfPlayers = targetNumberOfPlayers;
        this.players = [];
        this.sortedPlayers = [];
        this.playersByColor = {};
        this.playersByName = {};
        this.playersByPosition = {};
    }

    addPlayer(name, color, position, isPlayerAi, cards) {
        if (this.players.length >= this.targetNumberOfPlayers) {
            throw new Error("Target player count has already been reached.", "addPlayer()");
        }
        if (this.playersByColor[color] != undefined && this.playersByColor[color] != null) {
            throw new Error("Color " + color + " has already been selected.", "addPlayer()");
        }
        if (this.playersByPosition[position] != undefined && this.playersByPosition[position] != null) {
            throw new Error("Position " + position + " has already been selected.", "addPlayer()");
        }
        var player = new Player(name, color, position, isPlayerAi);
        console.log("addPlayer(): player created")
        this.players.push(player);
        this.playersByColor[color] = player;
        this.playersByName[name] = player;
        this.playersByPosition[position] = player;
        // Note the player much choose between these 2 cards 
        console.log("addPlayer(): before addSecretAgenda")
        player.addSecretAgenda(cards.dealRandomSecretAgendaCard());
        player.addSecretAgenda(cards.dealRandomSecretAgendaCard());
        return player;
    }

    setTroopsToDeploy(count) {
        for (var i=0; i < this.players.length; i++) {
            this.players[i].troopsToDeploy = count;
        }        
    }

    setAdvisors(advisors) {
        for (var i=0; i < this.players.length; i++) {
            var newAdvisors = [];
            for (var j=0; j<advisors.length; j++) {
                newAdvisors.push(advisors[j]);
            }
            this.players[i].setAdvisors(newAdvisors);
            this.players[i].advisorCountForTurn = advisors.length;
            this.players[i].advisorsToAuctionSpace = {};
            this.players[i].advisorsToAuctionSpace[1] = [];
            this.players[i].advisorsToAuctionSpace[2] = [];
            this.players[i].advisorsToAuctionSpace[3] = [];
            this.players[i].advisorsToAuctionSpace[4] = [];
            this.players[i].advisorsToAuctionSpace[5] = [];
            
        }        
    }

    endRoundForPlayers(claimBoard) {
        for (var i=0; i < this.players.length; i++) {
            var player = this.players[i];
            player.boat.canPlayMusterConversionTile = true;
            player.boat.canPlayAttackConversionTile = true;
            player.boat.canPlayBuildConversionTile = true;
            var coinIncome = player.boat.calculateCoinIncome();
            player.boat.money = player.boat.money + coinIncome;
            var coinCompensation = claimBoard.calculateCoins(player.color);
            player.boat.money = player.boat.money + coinCompensation;
            player.finishedRound = false;
        }
    }

    setFirstPlayer(player) {
        if (this.firstPlayer != undefined) {
            this.firstPlayer.isFirstPlayer = false;
        }
        this.firstPlayer = player;
        player.isFirstPlayer = true;
    }
    setFirstPlayerByColor(color) {
        if (this.firstPlayer != undefined) {
            this.firstPlayer.isFirstPlayer = false;
        }
        this.firstPlayer = this.playersByColor[color];
        this.firstPlayer.isFirstPlayer = true;
    }
    setNextFirstPlayerByColor(color) {
        if (this.nextFirstPlayer != undefined) {
            this.nextFirstPlayer.isNextFirstPlayer = false;
        }
        this.nextFirstPlayer = this.playersByColor[color];
        this.nextFirstPlayer.isNextFirstPlayer = true;
    }

    setCurrentPlayer(player) {
        this.currentPlayer = player;
    }

    setCurrentPlayerByColor(color) {
        this.currentPlayer = this.playersByColor[color];
    }
    getFirstPlayer() {
        return this.firstPlayer;
    }

    getCurrentPlayer() {
        return this.currentPlayer;
    }

    getPlayerByColor(color) {
        return this.playersByColor[color];
    }

    getPlayerByName(name) {
        return this.playersByColor[name];
    }

    getPlayerByPosition(position) {
        return this.playersByPosition[position];
    }

    getNextPlayer(player) {
        if (player === undefined || player == null) {
            return null;
        }
        for (var i=0; i < this.sortedPlayers.length; i++) {
            if (this.sortedPlayers[i].color == player.color) {
                var nextIndex = i + 1;
                if (nextIndex >= this.sortedPlayers.length) {
                    nextIndex = 0;
                }
                return this.sortedPlayers[nextIndex];
            }
        }
    }

    advanceToNextPlayer() {
        for (var i=0; i < this.sortedPlayers.length; i++) {
            if (this.sortedPlayers[i].color == this.currentPlayer.color) {
                var nextIndex = i + 1;
                if (i >= this.sortedPlayers.length) {
                    nextIndex = 0;
                }
                this.currentPlayer = this.sortedPlayers[nextIndex];
                break;
            }
        }
    }


    
    getNumberOfPlayers() {
        return this.players.length;
    }

    sortPlayers() {
        if ('N' in this.playersByPosition) {
            this.sortedPlayers.push( this.playersByPosition['N']);
        }
        if ('E' in this.playersByPosition) {
            this.sortedPlayers.push( this.playersByPosition['E']);
        }
        if ('S' in this.playersByPosition) {
            this.sortedPlayers.push( this.playersByPosition['S']);
        }
        if ('W' in this.playersByPosition) {
            this.sortedPlayers.push( this.playersByPosition['W']);
        }
    }

    getRandomPlayer() {
        var i = Math.floor(Math.random() * this.getNumberOfPlayers());
        return this.players[i];
    }

    mapAdvisorsToAuctionSpacesByAction(auctionBoard, action) {
        for (var i=0; i<auctionBoard.numberOfRows; i++) {
            var auctionSpace = auctionBoard.board[action][i];
            var color = auctionSpace.color;
            if (color != null) {
                var player = this.getPlayerByColor(color);
                var advisor = auctionSpace.advisor;
                player.advisorsToAuctionSpace[advisor].push(auctionSpace);
            }
        }
    }    

    mapAdvisorsToAuctionSpaces(auctionBoard) {
        this.mapAdvisorsToAuctionSpacesByAction(auctionBoard, "muster");
        this.mapAdvisorsToAuctionSpacesByAction(auctionBoard, "move");
        this.mapAdvisorsToAuctionSpacesByAction(auctionBoard, "attack");
        this.mapAdvisorsToAuctionSpacesByAction(auctionBoard, "build");
        this.mapAdvisorsToAuctionSpacesByAction(auctionBoard, "tax");
        this.mapAdvisorsToAuctionSpacesByAction(auctionBoard, "scheme");
    }

    restorePlayers() {
        var keys = Object.keys(this.playersByColor);
        for (var i=0; i < keys.length; i++) {
            var key =keys[i];
            var color = key;
            var player = this.playersByColor[key];
            var newPlayer = new Player(player.name, player.color, player.tablePosition, player.isPlayerAi);
            player = Object.assign(newPlayer, player);
            this.playersByColor[key] = player;
            player.restorePlayer();
        }

        var color = this.currentPlayer.color;
        this.currentPlayer = this.playersByColor[color];
        color = this.firstPlayer.color;
        this.firstPlayer = this.playersByColor[color];
        this.playersByColor[color].isFirstPlayer = true;
        color = this.nextFirstPlayer.color;
        this.nextFirstPlayer = this.playersByColor[color];
        this.playersByColor[color].isNextFirstPlayer = true;  
        
        for (var i=0; i < Object.keys(this.playersByName).length; i++) {
            var key = Object.keys(this.playersByName)[i];
            var player = this.playersByName[key];
            var color = player.color;
            this.playersByName[key] =  this.playersByColor[color];
        }        

        for (var i=0; i < Object.keys(this.playersByPosition).length; i++) {
            var key = Object.keys(this.playersByPosition)[i];
            var player = this.playersByPosition[key];
            var color = player.color;
            this.playersByPosition[key] = this.playersByColor[color];
        }

        var tempPlayers = [];
        for (var i=0; i < this.players.length; i++) {
            var player = this.players[i];
            var color = player.color;
            player = this.playersByColor[color];
            tempPlayers.push(player);
        }

        this.players = tempPlayers;
        for (var i=0; i < this.sortedPlayers.length; i++) {
            var player = this.sortedPlayers[i];
            var color = player.color;
            player = this.playersByColor[color];
            tempPlayers.push(player);
        }
        this.sortedPlayers = tempPlayers;

    }
}

class Player {
    constructor(name, color, tablePosition, isPlayerAi) {
        this.boat = new BoatMat();
        this.name = name;
        this.color = color;
        this.tablePosition = tablePosition; // N, E, S, W
        this.isPlayerAi = isPlayerAi;
        this.leader = null;
        this.secretAgenda = [];
        this.temporarySecretAgenda = [];
        this.deedCards = [];
        this.victoryPoints = 0;
        this.capturedRebels = 0;

        this.schemeCards = [];
        this.temporarySchemeCards = [];
        this.returnSchemeDeck = 1;
        this.schemeCardsToDraw = 0;
        this.canKeepSchemeCard = false;

        this.troopsToDeploy = 3;

        this.advisors = [];
        this.advisorsToAuctionSpace = {};
        this.advisorCountForTurn = 0;

        this.tookMainActionForTurn = false;
        this.schemeCardsCanPlay = 1;
        this.oneTimeSchemeCard = null;
        this.accomplishedDeedForTurn = false;
        this.convertedGoodsForTurn = false;
        this.taxActions = 0;
        this.buildActions = 0;
        this.moveActions = 0;
        this.attackActions = 0;
        this.moveActionsFromLocation = {};
        this.moveAnywhereActions = 0;
        this.finishedRound = false;

        this.isFirstPlayer = false;
        this.isNextFirstPlayer = false;

        // 12 - 3 to deploy.
        this.supplyTroops = 9;
        this.supplyLeader = 0;
        this.buildings = {};
        this.buildings["church"] = 3;
        this.buildings["stronghold"] = 3;
        this.buildings["market"] = 3;
        this.buildings["tavern"] = 2;
        this.buildings["stable"] = 2;

    }

    resetMoveActionsFromLocation(locations) {
        for (var i=0; i < locations.length; i ++) {
            this.moveActionsFromLocation[locations[i].name] = 0;
        }
    }

    setLeader(leader) {
        this.leader = leader;
    }

    addSecretAgenda(card) {
        this.temporarySecretAgenda.push(card);
    }

    setAdvisors(advisors) {
        this.advisors = advisors;
    }

    isAdvisorAvailable(advisor) {
        for (var i=0; i<this.advisors.length; i++) {
            if (advisor == this.advisors[i]) {
                return true;
            }
        }
        return false;
    }

    useAdvisor(advisor) {
        var newAdvisors = [];
        var advisorFound = false;
        for (var i=0; i<this.advisors.length; i++) {
            if (advisor == this.advisors[i] && !advisorFound) {
                advisorFound = true;
            } else {
                newAdvisors.push(this.advisors[i]);
            }
        }
        this.advisors = newAdvisors;
    }

    getTotalMoveActions() {
        var moveActions = this.moveActions;
        for (var locationName in moveActionsFromLocation) {
            moveActions = moveActions + moveActionsFromLocation[locationName];
        }
        return moveActions;
    }

    hasSchemeCard(schemeCardId) {
        for (var i=0; i<this.schemeCards.length; i++) {
            if (schemeCardId == this.schemeCards[i].id) {
                return true;
            }
        }
        return false;
    }

    restorePlayer() {
        var newBoat = new BoatMat();
        this.boat = Object.assign(newBoat, this.boat);
    }
}


module.exports = GamePlayers