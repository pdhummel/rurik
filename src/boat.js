class BoatMat {
    constructor() {
        this.capturedRebels = 0;
        this.money = 3;

        this.goodsOnDock = {};
        this.goodsOnDock["stone"] = 0;
        this.goodsOnDock["wood"] = 0;
        this.goodsOnDock["fish"] = 0;
        this.goodsOnDock["honey"] = 0;
        this.goodsOnDock["fur"] = 0;
        this.goodsOnDock["tradeBoon"] = 0;

        this.goodsOnBoatSlots = {};
        this.goodsOnBoatSlots["stone"] = 2;
        this.goodsOnBoatSlots["wood"] = 3;
        this.goodsOnBoatSlots["fish"] = 3;
        this.goodsOnBoatSlots["honey"] = 2;
        this.goodsOnBoatSlots["fur"] = 1;

        this.goodsOnBoat = {};
        this.goodsOnBoat["stone"] = 0;
        this.goodsOnBoat["wood"] = 0;
        this.goodsOnBoat["fish"] = 0;
        this.goodsOnBoat["honey"] = 0;
        this.goodsOnBoat["fur"] = 0;

        this.tradeBoon = {};
        this.tradeBoon["wood"] = 1;
        this.tradeBoon["fish"] = 1;        
        this.tradeBoon["honey"] = 1;
        this.tradeBoon["stone"] = 0;
        this.tradeBoon["fur"] = 0;

        this.canPlayMusterConversionTile = true;
        this.canPlayAttackConversionTile = true;
        this.canPlayBuildConversionTile = true;

    }

    addGoodToDock(resource) {
        this.goodsOnDock[resource]++;
    }

    addGoodToBoat(resource) {
        var openSlots = this.goodsOnBoatSlots[resource] - this.goodsOnBoat[resource];
        if (openSlots > 0) {
            this.goodsOnBoat[resource] = this.goodsOnBoat[resource] + 1;
            if (openSlots == 1 && this.tradeBoon[resource] > 0) {
                this.goodsOnDock["tradeBoon"]++;
                this.tradeBoon[resource] = 0;
            }
        }
    }

    doesBoatHaveRoom(resource) {
        hasRoom = false;
        var openSlots = this.goodsOnBoatSlots[resource] - this.goodsOnBoat[resource];
        if (openSlots > 0) {
            hasRoom = true;
        }
        return hasRoom;
    }
    
    calculateCoinIncome() {
        var coinIncome = 0;
        if ( this.goodsOnBoatSlots["stone"] == this.goodsOnBoat["stone"]) {
            coinIncome++;
        }
        if ( this.goodsOnBoatSlots["wood"] == this.goodsOnBoat["wood"]) {
            coinIncome++;
        }
        if ( this.goodsOnBoatSlots["fish"] == this.goodsOnBoat["fish"]) {
            coinIncome++;
        }
        if ( this.goodsOnBoatSlots["honey"] == this.goodsOnBoat["honey"]) {
            coinIncome++;
        }
        if ( this.goodsOnBoatSlots["fur"] == this.goodsOnBoat["fur"]) {
            coinIncome++;
        }
    }

    moveResourceFromBoatToDock(resource) {
        if (this.goodsOnBoat[resource] > 0) {
            this.goodsOnBoat[resource]--;
            this.goodsOnDock[resource]++;
        }
    }

    moveResourceFromDockToBoat(resource) {
        var openSlots = this.goodsOnBoatSlots[resource] - this.goodsOnBoat[resource];
        if (this.goodsOnDock[resource] > 0 && openSlots > 0) {
            this.goodsOnBoat[resource]++;
            this.goodsOnDock[resource]--;
        }
    }

    useResourceConversionTile(resource1, resource2, resourceToMatch1, resourceToMatch2) {
        var actions = 0;
        if (resource1 == resourceToMatch1 || resource1 == resourceToMatch2 || 
            resource2 == resourceToMatch1 || resource2 == resourceToMatch2) {
            var canConvert = false;
            if (resource1 == resource2 && this.goodsOnDock[resource1] > 1) {
                canConvert = true;
            } else if (this.goodsOnDock[resource1] > 0 && this.goodsOnDock[resource2] > 0 ) {
                canConvert = true;
            }
            if (canConvert) {
                this.goodsOnDock[resource1]--;
                this.goodsOnDock[resource2]--;
                actions++;
            }
        }
        return actions;
    }

    useMusterConversionTile(resource1, resource2) {
        var actions = useResourceConversionTile(resource1, resource2, "fish", "honey");
        return actions;
    }

    useBuildConversionTile(resource1, resource2) {
        var actions = useResourceConversionTile(resource1, resource2, "wood", "stone");
        return actions;
    }

    useAttackConversionTile() {
        var actions = 0;
        if (this.capturedRebels > 0 && this.money >1) {
            this.capturedRebels--;
            this.money = this.money - 2;
            actions++;
        }
        return actions;
    }


}

module.exports = BoatMat