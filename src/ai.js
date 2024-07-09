
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
            "retrieveAdvisor": "",
            "schemeFirstPlayer": "",
            "drawSchemeCards": "",
            "actionPhase": "",
            "selectSchemeCard": ""
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
            r = 1;
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

        while (! success && index < auctions.length) {
            //console.log("placeAdvisor(): " + player.color + " " + auction.action + " " + advisorNumber);
            try {
                auction = auctions[index];
                advisorNumber = auction.advisor;
                game.playAdvisor(player.color, auction.action, advisorNumber, auction.coins);
                success = true;
            } catch(error) {
                console.log("Could not place candidate advisor: ", auction.action, advisorNumber, ": " + error.message);
                index++;
            }
        }
        if (! success) {
            console.log("placeAdvisor(): advisor could not be placed using strategy card");
        }
        var actions = ["muster", "move", "attack", "tax", "build", "scheme"];
        while (! success) {
            var r = Math.floor(Math.random() * this.actions.length);
            var action = actions[r];
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