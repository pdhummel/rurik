class GameStates {
    constructor() {
        this.gameStates = {};
        this.gameStates["waitingForPlayers"] = new GameState("waitingForPlayers", ["joinGame", "startGame"]);
        this.gameStates["waitingForFirstPlayerSelection"] = new GameState("waitingForFirstPlayerSelection", ["selectFirstPlayer"]);
        this.gameStates["waitingForLeaderSelection"] = new GameState("waitingForLeaderSelection", ["chooseLeader"]);
        this.gameStates["waitingForSecretAgendaSelection"] = new GameState("waitingForSecretAgendaSelection", ["chooseSecretAgenda"]);
        this.gameStates["waitingForTroopPlacement"] = new GameState("waitingForTroopPlacement", ["placeTroop"]);
        this.gameStates["waitingForLeaderPlacement"] = new GameState("waitingForLeaderPlacement", ["placeLeader"]);
        this.gameStates["strategyPhase"] = new GameState("strategyPhase", ["playAdvisor"]);
        this.gameStates["retrieveAdvisor"] = new GameState("retrieveAdvisor", ["retrieveAdvisor"]);
        this.gameStates["actionPhase"] = new GameState("actionPhase", ["takeMainAction", "playSchemeCard", "accomplishDeed", "convertGoods", "endTurn"]);
        this.gameStates["actionPhaseMuster"] = new GameState("actionPhaseMuster", ["muster", "cancel"]);
        this.gameStates["scheme"] = new GameState("scheme", ["drawSchemeCards", "selectSchemeCard", "assignFirstPlayer"]);
        this.gameStates["claimPhase"] = new GameState("claimPhase", ["chooseDeedCard"]);
        this.gameStates["endGame"] = new GameState("endGame", []);

        this.setCurrentState("waitingForPlayers")
    }

    setCurrentState(stateName) {
        this.currentState = this.gameStates[stateName];
    }

    getCurrentState() {
        return this.currentState;
    }
    
}


class GameState {
    constructor(name, allowedActions) {
        this.name = name;
        this.allowedActions = allowedActions;
    }
}

module.exports = GameStates
