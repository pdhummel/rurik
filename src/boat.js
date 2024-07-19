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
        this.tradeBoon["wood"] = 0;
        this.tradeBoon["fish"] = 0;        
        this.tradeBoon["honey"] = 1;
        this.tradeBoon["stone"] = 1;
        this.tradeBoon["fur"] = 1;

        this.canPlayMusterConversionTile = true;
        this.canPlayAttackConversionTile = true;
        this.canPlayBuildConversionTile = true;

    }

    addGoodToBoatOrDock(resource) {
        if (this.doesBoatHaveRoom(resource)) {
            this.addGoodToBoat(resource);
        } else {
            this.addGoodToDock(resource);
        }
    }

    addGoodToDock(resource) {
        console.log("addGoodToDock(): " + resource);
        this.goodsOnDock[resource]++;
    }

    addGoodToBoat(resource) {
        console.log("addGoodToBoat(): " + resource);
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
        var hasRoom = false;
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
        return coinIncome;
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
        console.log("useResourceConversionTile(): " + resource1 + " " + resource2 + " " + resourceToMatch1 + " " + resourceToMatch2);
        var actions = 0;
        var canConvert = false;
        if (resource1 == resourceToMatch1 || resource1 == resourceToMatch2 || 
            resource2 == resourceToMatch1 || resource2 == resourceToMatch2) {
            if (resource1 == resource2 && this.goodsOnDock[resource1] > 1) {
                canConvert = true;
            } else if (this.goodsOnDock[resource1] > 0 && this.goodsOnDock[resource2] > 0 ) {
                canConvert = true;
            }
        }
        if (!canConvert) {
            console.log("useResourceConversionTile(): " + this.goodsOnDock[resource1] + " " + this.goodsOnDock[resource2]);
            throw new Error("Resources not available to complete conversion.", "useResourceConversionTile");
        }
        if (canConvert) {
            this.goodsOnDock[resource1]--;
            this.goodsOnDock[resource2]--;
            actions++;
        }
        return actions;
    }

    useMusterConversionTile(resource1, resource2) {
        if (this.canPlayMusterConversionTile == false) {
            throw new Error("Cannot use muster conversion tile at this time.", "useMusterConversionTile");
        }
        var actions = this.useResourceConversionTile(resource1, resource2, "fish", "honey");
        this.canPlayMusterConversionTile = false;
        return actions;
    }

    useBuildConversionTile(resource1, resource2) {
        if (this.canPlayBuildConversionTile == false) {
            throw new Error("Cannot use build conversion tile at this time.", "useBuildConversionTile");
        }
        var actions = this.useResourceConversionTile(resource1, resource2, "wood", "stone");
        this.canPlayBuildConversionTile = false;
        return actions;
    }

    useAttackConversionTile() {
        if (this.useAttackConversionTile == false) {
            throw new Error("Cannot use attack conversion tile at this time.", "useAttackConversionTile");
        }
        var actions = 0;
        if (this.capturedRebels > 0 && this.money >1) {
            this.capturedRebels--;
            this.money = this.money - 2;
            actions++;
            this.canPlayAttackConversionTile = false;
        } else {
            throw new Error("Either rebels or money are not available to complete the conversion", "useAttackConversionTile");
        }
        return actions;
    }


}

module.exports = BoatMat