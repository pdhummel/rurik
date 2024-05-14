//

class Cards {
    constructor() {
        this.setupSecretAgendaCards();

        // TODO: handle scheme decks being exhausted
        this.setupSchemeCards();

    }

    setupSecretAgendaCards() {
        this.allSecretAgendaCards = {};
        this.secretAgendaCards = [];
        this.availableSecretAgendaCards = {};
        this.addSecretAgendaCard("Esteemed", "Occupy the most regions with your troops.", 2);
        this.addSecretAgendaCard("Conquering", "Finish in first place on the warfare track.", 2);
        this.addSecretAgendaCard("Prosperous", "Finish in first place on the trade track.", 2);
        this.addSecretAgendaCard("Capable", "Have the most goods.", 2);
        this.addSecretAgendaCard("Successful", "Finish in first place on the rule track.", 2);
        this.addSecretAgendaCard("Regal", "Have the most combined fur and honey.", 2);
        this.addSecretAgendaCard("Protective", "Rule the most structures.", 2);
        this.addSecretAgendaCard("Committed", "Finish in first place on the build track.", 2);
        this.addSecretAgendaCard("Dignified", "Accomplish the most deeds.", 2);
        this.addSecretAgendaCard("Courageous", "Defeat the most rebels.", 2);
        this.addSecretAgendaCard("Wealthy", "Have the most coins.", 2);
    }


    addSecretAgendaCard(name, text, points) {
        var card = new SecretAgendaCard(name, text, points);
        this.allSecretAgendaCards[name] = card;
        this.availableSecretAgendaCards[name] = card;
        this.secretAgendaCards.push(card);
    }

    getSecretAgendaCardByName(name) {
        return this.allSecretAgendaCards[name];
    }

    dealRandomSecretAgendaCard() {
        var r = Math.floor(Math.random() * this.secretAgendaCards.length);
        var card = this.secretAgendaCards[r];
        this.secretAgendaCards[r] = this.secretAgendaCards[this.secretAgendaCards.length - 1];
        this.secretAgendaCards.pop();
        delete this.availableSecretAgendaCards[card.name];
        return card;
    }

    chooseSecretAgendaCard(name) {
        if (name in this.availableSecretAgendaCards) {
            delete this.availableSecretAgendaCards[name];
            return this.allSecretAgendaCards[name];
        }
    }

    isSecretAgendaCardAvailable(name) {
        if (name in this.availableSecretAgendaCards) {
            return true;
        } else {
            return false;
        }
    }

    setupSchemeCards() {
        this.schemeCardIds = {};
        this.discardedSchemeCards = [];
        this.schemeDeck1 = [];
        this.schemeDeck2 = [];
        this.schemeCardList = [];
        var schemeCards = this.schemeCardList;
        // Rewards, coin cost, deaths
        this.addSchemeCard(["deedCard", "coin"], 0, 1);
        this.addSchemeCard(["muster"], 1, 0);
        this.addSchemeCard(["move", "move"], 0, 0);
        this.addSchemeCard(["coin", "coin"], 0, 0);
        this.addSchemeCard(["tax"], 0, 0);
        this.addSchemeCard(["move", "move", "move"], 0, 1);
        this.addSchemeCard(["tax"], 0, 0);
        this.addSchemeCard(["attack"], 1, 0);
        this.addSchemeCard(["tax", "coin"], 0, 1);
        this.addSchemeCard(["move", "move", "warTrack"], 0, 1);
        this.addSchemeCard(["build"], 0, 0);
        this.addSchemeCard(["move", "move"], 0, 0);
        this.addSchemeCard(["attack", "coin"], 0, 1);
        this.addSchemeCard(["deedCard"], 1, 0);
        this.addSchemeCard(["build"], 0, 0);
        this.addSchemeCard(["deedCard"], 0, 1);
        this.addSchemeCard(["tax", "tax"], 0, 1);
        this.addSchemeCard(["build", "coin"], 0, 1);
        this.addSchemeCard(["attack"], 0, 0);
        this.addSchemeCard(["attack"], 0, 0);
        this.addSchemeCard(["build"], 1, 0);
        this.addSchemeCard(["muster"], 0, 0);
        this.addSchemeCard(["muster"], 0, 0);
        this.addSchemeCard(["muster", "coin"], 0, 1);
        this.addSchemeCard(["buildOrAttack"], 0, 2);
        this.addSchemeCard(["attack"], 0, 0);
        this.addSchemeCard(["move"], 0, 0);
        this.addSchemeCard(["move", "muster"], 0, 2);
        this.addSchemeCard(["muster", "muster"], 0, 1);
        this.addSchemeCard(["tax", "tax"], 1, 1);
        this.addSchemeCard(["coin", "coin"], 0, 0);
        this.addSchemeCard(["taxOrMuster", "taxOrMuster"], 0, 2);
        for (var i=0; i<(schemeCards.length /2); i++) {
            var r = Math.floor(Math.random() * schemeCards.length);
            var schemeCard = schemeCards[r];
            this.schemeDeck1.push(schemeCard);
            schemeCards[r] = schemeCards[schemeCards.length - 1];
            schemeCards.pop();
        }
        this.schemeDeck2 = schemeCards;
    }

    addSchemeCard(rewards, rewardCoinCost=0, deaths=0) {
        var schemeCard = new SchemeCard(rewards, rewardCoinCost, deaths);
        this.schemeCardList.push(schemeCard);
        this.schemeCardIds[schemeCard.id] = schemeCard;
    }

    drawSchemeCard(schemeDeck) {
        var schemeDeckList = null;
        if (typeof schemeDeck == "number" || typeof schemeDeck == "string") {
            schemeDeckList = this.getSchemeDeckByNumber(schemeDeck);
        } else {
            schemeDeckList = schemeDeck;
        }
        var card = schemeDeckList.shift();
        return card;
    }

    drawAndDiscardSchemeCard(schemeDeck) {
        var schemeDeckList = null;
        if (typeof schemeDeck == "number" || typeof schemeDeck == "string") {
            schemeDeckList = this.getSchemeDeckByNumber(schemeDeck);
        } else {
            schemeDeckList = schemeDeck;
        }
        var card = schemeDeckList.shift();
        this.discardedSchemeCards.push(card);
        return card;
    }

    discardSchemeCard(card) {
        this.discardedSchemeCards.push(card);
    }

    // 1 or 2
    getSchemeDeckByNumber(num) {
        if (num == 1) {
            return this.schemeDeck1;
        } else {
            return this.schemeDeck2;
        }
    }


}

class SchemeCard {
    constructor(rewards, rewardCoinCost=0, deaths=0) {
        this.rewards = rewards;
        this.rewardCoinCost = rewardCoinCost;
        this.deaths = deaths;
        for (var i=0; i< rewards.length; i++) {
            if (i > 0) {
                this.id = this.id + "-" + rewards[i];
            } else {
                this.id = rewards[i]
            }
        }
        this.id = this.id + "-" + rewardCoinCost + "-" + deaths;
    }

    isEqual(schemeCard) {
        if (this.rewardCoinCost == schemeCard.rewardCoinCost && this.deaths == schemeCard.deaths && 
            this.rewards.length == schemeCard.rewards.length) {
            for (var i=0; i < this.rewards.length; i++) {
                if (this.rewards[i] != schemeCard.rewards[i]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
}

class SecretAgendaCard {
    constructor(name, text, points) {
        this.name = name;
        this.text = text;
        this.points = points;
    }
}

module.exports = Cards