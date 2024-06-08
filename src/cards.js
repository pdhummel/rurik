//

class Cards {
    constructor() {
        this.setupSecretAgendaCards();

        // TODO: handle scheme decks being exhausted
        this.setupSchemeCards();

        this.setupDeedCards();

    }

    setupDeedCards() {
        this.allDeedCards = {};
        this.displayedDeedCards = [];
        this.deedCardDeck = [];
        var shuffledDeedCardDeck = [];

        // These have simple costs to fulfill
        this.addDeedCard("Generous Prince", 1, "Pay 4 coins.", ["muster", "muster"], ["coin", "coin", "coin", "coin"], []);
        this.addDeedCard("Splendid Feast", 1, "Pay fish, honey, 2 coins.", ["scheme2cards"], ["fish", "honey", "coin", "coin"], []);
        this.addDeedCard("Send Gifts", 1, "Pay fish, fur, 2 coins.", ["move", "move"], ["fish", "fur", "coin", "coin"], []);
        this.addDeedCard("Wilderness Forts", 1, "Pay stone, fur, wood.", ["build"], ["stone", "fur", "wood"], []);
        // TODO: Handle the special attack reward 
        this.addDeedCard("Hire Mercenaries", 1, "Pay fish, stone, 2 coins.", ["attackMinusScheme"], ["fish", "stone", "coin", "coin"], []);
        //this.addDeedCard("Hire Mercenaries", 1, "Pay fish, stone, 2 coins.", ["attack"], ["fish", "stone", "coin", "coin"], []);

        // These are cost based, but requires decision for which resource to pay.
        this.addDeedCard("Trade Route", 1, "Pay 3 different resources.", ["coin", "coin"], {"differentResource":["resource", "resource", "resource"]}, []);
        this.addDeedCard("Reward Laborers", 1, "Pay 2 resources and 2 coins.", ["scheme2Cards"], ["resource", "resource", "coin", "coin"], []);
        this.addDeedCard("Hoard", 1, "Pay 3 of the same resource.", ["scheme2Cards"], {"sameResource":["resource", "resource", "resource"]}, []);

        // These require decisions for sacrificing scheme card, buildings, or troops.
        this.addDeedCard("Great Library", 1, "Pay a scheme card and stone.", ["build"], ["schemeCard", "stone"], []);
        this.addDeedCard("Master Beekeeper", 2, "Pay a scheme card and 2 honey.", ["build"], ["schemeCard", "honey", "honey"], []);
        this.addDeedCard("Honorable Prince", 1, "Pay a scheme card and 3 coin.", ["muster", "muster"], ["schemeCard", "coin", "coin", "coin"], []);
        this.addDeedCard("New Beginning", 1, "Sacrifice market, stronghold, and church.", ["tax", "tax"], ["market", "stronghold", "church"], []);
        this.addDeedCard("Retire Veterans", 1, "Remove 2 troops and pay 2 coins.", ["scheme2Cards"], ["troop", "troop", "coin", "coin"], []);
        // TODO: Handle the special move reward 
        this.addDeedCard("Victory March", 1, "Remove 2 troops and pay a scheme card.", ["moveAnywhere", "moveAnywhere"], ["schemeCard", "troop", "troop"], []);
        //this.addDeedCard("Victory March", 1, "Remove 2 troops and pay a scheme card.", ["move", "move"], ["schemeCard", "troop", "troop"], []);
        this.addDeedCard("Peace Maker", 1, "Remove 2 troops from a ruled region.", ["scheme2Cards"], ["troop", "troop"], []);
        this.addDeedCard("Border Patrols", 1, "Remove 3 troops from different regions.", ["moveAnywhere", "moveAnywhere"], {"differentRegions":["troop", "troop", "troop"]}, []);
        //this.addDeedCard("Border Patrols", 1, "Remove 3 troops from different regions.", ["move", "move"], ["troop", "troop", "troop"], []);

        // These include some achievements which must be fulfilled and may also have costs.
        this.addDeedCard("Enforce Peace", 1, "Pay wood and honey and defeat 2 rebels.", ["attackMinusScheme"], ["wood", "honey"], ["defeatRebel", "defeatRebel"]);
        this.addDeedCard("Law Giver", 1, "Pay 2 coins and defeat 3 rebels.", ["scheme2Cards"], ["coin", "coin"], ["defeatRebel", "defeatRebel", "defeatRebel"]);
        this.addDeedCard("Mead Brewery", 1, "Pay honey and build 2 taverns.", ["tax"], ["honey"], ["tavern", "tavern"]);
        this.addDeedCard("Establish Fortress", 1, "Pay 2 wood and build a stronghold and church in a region.", ["scheme2Cards"], ["wood", "wood"], {"sameRegion":["stronghold", "church"]});
        this.addDeedCard("Besiege Citadel", 1, "Pay 2 coins and rule a region with a stronghold.", ["warTrack"], {"sameRegion":["rule", "stronghold"]});
        this.addDeedCard("Horse Breeder", 1, "Pay wood and build 2 stables.", ["muster"], ["wood"], ["muster", "muster"]);
        this.addDeedCard("Conquest", 1, "Rule 3 regions.", ["move", "move"], [], ["rule", "rule", "rule"]);
        this.addDeedCard("Amass Forces", 1, "Have 6 troops in a region.", ["move"], [], {"sameRegion":["troop", "troop", "troop", "troop", "troop", "troop"]});
        this.addDeedCard("Tithe Payments", 1, "Have 3 churches in adjacent regions.", ["coin", "coin", "coin"], [], {"adjacentRegions":["church", "church", "church"]});
        this.addDeedCard("Dispatch Messengers", 2, "Have troops in 8 regions.", ["muster", "muster"], [], {"differentRegions":["troop","troop","troop","troop","troop","troop","troop","troop"]});
        this.addDeedCard("Create Republic", 2, "Rule Novgorod, Chernigov, Volyn.", ["tax"], [], {"rule":["Novgorod", "Chernigov", "Volyn"]});
        this.addDeedCard("Distant Rule", 2, "Rule Pereyaslavl, Polotsk, Rostov.", ["warTrack"], [], {"rule":["Pereyaslavl", "Polotsk", "Rostov"]});
        this.addDeedCard("Market Day", 2, "Have 3 markets with different resources.", ["scheme2Cards"], [], {"differentResources":["market", "market", "market"]});
        this.addDeedCard("Defensive Belt", 1, "Have 3 strongholds in adjacent regions.", ["attackMinusScheme"], [], {"adjacentRegions":["stronghold", "stronghold", "stronghold"]});
        this.addDeedCard("Capital City", 2, "Have a market, stronghold, and church in a single region.", ["tax"], [], {"sameRegion":["market", "stronghold", "church"]});
        this.addDeedCard("Grand Hunter", 2, "Pay 2 fur and be first player.", ["move"], ["fur", "fur"], ["firstPlayer"]);

        // shuffle the deed cards
        for (var i=0; i<(this.deedCardDeck.length); i++) {
            var r = Math.floor(Math.random() * this.deedCardDeck.length);
            var deedCard = this.deedCardDeck[r];
            shuffledDeedCardDeck.push(deedCard);
            this.deedCardDeck[r] = this.deedCardDeck[this.deedCardDeck.length - 1];
            this.deedCardDeck.pop();
        }
        this.deedCardDeck = shuffledDeedCardDeck;

        var card = this.deedCardDeck.pop();
        this.displayedDeedCards.push(card);
        card = this.deedCardDeck.pop();
        this.displayedDeedCards.push(card);
        card = this.deedCardDeck.pop();
        this.displayedDeedCards.push(card);
    }

    addDeedCard(name, victoryPoints, requirementText, rewards=[], costs=[], achievements=[], canSolo=true) {
        var card = new DeedCard(name, victoryPoints, requirementText, rewards, costs, achievements, canSolo);
        this.allDeedCards[name] = card;
        this.deedCardDeck.push(card);
    }

    takeDeedCard(player, deedCardName) {
        console.log("takeDeedCard(): " + player.color + " " + deedCardName);
        var newDeedCardDisplay = [];
        for (var i=0; i< this.displayedDeedCards.length; i++) {
            if (this.displayedDeedCards[i].name == deedCardName) {
                player.deedCards.push(this.displayedDeedCards[i]);
            } else {
                newDeedCardDisplay.push(this.displayedDeedCards[i]);
            }
        }
        var nextDeedCard = this.deedCardDeck.pop();
        newDeedCardDisplay.push(nextDeedCard);
        this.displayedDeedCards = newDeedCardDisplay;
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
        for (var i=0; i<16; i++) {
            var r = Math.floor(Math.random() * schemeCards.length);
            var schemeCard = schemeCards[r];
            this.schemeDeck1.push(schemeCard);
            schemeCards[r] = schemeCards[schemeCards.length - 1];
            schemeCards.pop();
        }
        this.schemeDeck2 = schemeCards;
        console.log("setupSchemeCards(): " + this.schemeDeck1.length + " " + this.schemeDeck2.length);
    }

    addSchemeCard(rewards, rewardCoinCost=0, deaths=0) {
        var schemeCard = new SchemeCard(rewards, rewardCoinCost, deaths);
        this.schemeCardList.push(schemeCard);
        this.schemeCardIds[schemeCard.id] = schemeCard;
    }

    getSchemeCardById(schemeCardId) {
        return this.schemeCardIds[schemeCardId];
    }

    drawSchemeCard(schemeDeck) {
        console.log("drawSchemeCard(): " + schemeDeck);
        var schemeDeckList = null;
        if (typeof schemeDeck == "number" || typeof schemeDeck == "string") {
            schemeDeckList = this.getSchemeDeckByNumber(schemeDeck);
        } else {
            schemeDeckList = schemeDeck;
        }
        var card = schemeDeckList.shift();
        console.log("drawSchemeCard(): " + this.schemeDeck1.length + " " + this.schemeDeck2.length);
        return card;
    }

    drawAndDiscardSchemeCard(schemeDeck) {
        console.log("drawAndDiscardSchemeCard(): " + schemeDeck);
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
        console.log("getSchemeDeckByNumber(): " + num);
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

class DeedCard {
    constructor(name, victoryPoints, requirementText, rewards=[], costs=[], achievements=[], canSolo=true) {
        this.name = name;
        this.victoryPoints = victoryPoints;
        this.requirementText = requirementText;
        this.rewards = rewards;
        this.costs = costs;
        this.achievements = achievements;
        this.canSolo = canSolo;
    }
}

module.exports = Cards