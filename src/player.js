
const BoatMat = require('./boat.js');

class GamePlayers {
    constructor(targetNumberOfPlayers) {
        this.targetNumberOfPlayers = targetNumberOfPlayers;
        this.players = [];
        this.sortedPlayers = [];
        this.playersByColor = {};
        this.playersByName = {};
        this.playersByPosition = {};
        this.lastActionTimeStamp = Date.now();
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
        if (this.playersByName[name] != undefined && this.playersByName[name] != null) {
            throw new Error("Player " + name + " has already joined the game.", "addPlayer()");
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

    endRoundForPlayers(game, claimBoard) {
        for (var i=0; i < this.players.length; i++) {
            var player = this.players[i];
            player.boat.canPlayMusterConversionTile = true;
            player.boat.canPlayAttackConversionTile = true;
            player.boat.canPlayBuildConversionTile = true;
            var coinIncome = player.boat.calculateCoinIncome();
            player.boat.money = player.boat.money + coinIncome;
            game.log.info(player.color + " received " + coinIncome + " money from boat resources.");
            var coinCompensation = claimBoard.calculateCoins(player.color);
            game.log.info(player.color + " received " + coinCompensation + " money from claim tracks.");
            player.boat.money = player.boat.money + coinCompensation;
            player.finishedRound = false;
            player.aiCard = null;
            player.aiStrategy = null;
            player.usedGlebAttack = false;
            player.usedTheofanaTax = false;
            player.usedTheofanaTax = false;
            player.usedPredslavaMove = false;
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
        //this.capturedRebels = 0;

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

        this.aiCard = null;
        this.aiStrategy = null;
        this.usedGlebAttack = false;
        this.usedTheofanaTax = false;
        this.usedMariaMuster = false;
        this.usedPredslavaMove = false;
        //this.glebAttackInProgress = false;

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
}


module.exports = GamePlayers