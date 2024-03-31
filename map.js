const Rebels = require('./rebels.js');

class Building {
    constructor(color, name) {
        this.name = name;
        this.color = color;
    }
}

class Location {
    constructor(id, name, color, defaultResource, neighbors) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.defaultResource = defaultResource;
        this.resourceCount = 1;
        this.neighbors = neighbors;
        this.troopsByColor = {};
        this.troopsByColor["red"] = 0;
        this.troopsByColor["blue"] = 0;
        this.troopsByColor["white"] = 0;
        this.troopsByColor["yellow"] = 0;
        this.leaderByColor = {};
        this.leaderByColor["red"] = 0;
        this.leaderByColor["blue"] = 0;
        this.leaderByColor["white"] = 0;
        this.leaderByColor["yellow"] = 0;
        this.rebels = [];
        this.buildings = [];
    }

    addTroop(color, count=1) {
        this.troopsByColor[color] = this.troopsByColor[color] + count;
    }

    addLeader(color, count=1) {
        if (count > 0) {
            this.leaderByColor[color] = 1;
        } else {
            this.leaderByColor[color] = 0;
        }
    }

    addBuilding(color, buildingName) {
        if (this.buildings.length < 3) {
            hasMatch = this.hasBuilding(buildingName);
            if (! hasMatch) {
                var building = new Building(color, buildingName)
                this.buildings.push(building);
            }
        }
    }

    hasBuilding(buildingName) {
        hasMatch = false;
        for (var i=0; i<this.buildings.length; i++) {
            if (buildings[i].name == buildingName) {
                hasMatch = true;
            }
        }
        return hasMatch;
    }

    countStrongholds(color) {
        var strongholds = 0;
        for (var i=0; i<this.buildings.length; i++) {
            if (buildings[i].name == "stronghold" && buildings[i].color == color) {
                strongholds++;
            }
        }
        return strongholds;
    }

    doesPlayerHaveMarket(color) {
        var hasMarket = false;
        for (var i=0; i<this.buildings.length; i++) {
            if (buildings[i].name == "market" && buildings[i].color == color) {
                hasMarket = true;
            }
        }
        return hasMarket;
    }

    doesOccupy(color) {
        if (this.troopsByColor[color] > 0 || this.leaderByColor[color] > 0) {
            return true;
        }
        return false;
    }

    doesRule(color) {
        if (this.whoRules() == color) {
            return true;
        }
        return false;
    }


    whoRules() {
        yellow = this.countStrongholds("yellow") + this.troopsByColor["yellow"] + this.leaderByColor["yellow"];
        red = this.countStrongholds("red") + this.troopsByColor["red"] + this.leaderByColor["red"];
        white = this.countStrongholds("white") + this.troopsByColor["white"] + this.leaderByColor["white"];
        blue = this.countStrongholds("blue") + this.troopsByColor["blue"] + this.leaderByColor["blue"];
        var highValue = yellow;
        ruler = "yellow";
        if (red > highValue) {
            ruler = "red"
            highValue = red;
        } else if (red == highValue) {
            ruler = null;
        }
        if (blue > highValue) {
            ruler = "blue"
            highValue = blue;
        } else if (blue == highValue) {
            ruler = null;
        }
        if (white > highValue) {
            ruler = "white"
            highValue = white;
        } else if (white == highValue) {
            ruler = null;
        }
        return ruler;
    }

    isNeighbor(locationName) {
        for (var i=0; i<this.neighbors.length; i++) {
            if (this.neighbors[i].name == locationName) {
                return true;
            }
        }
        return false;
    }
    
}

class GameMap {

    constructor() {
        this.locationByName = {};
        this.locations = [];
        this.rebels = new Rebels();
        this.addLocation(1, "Novgorod", "green", "wood", ["Pskov", "Polotsk", "Smolensk", "Rostov"]);
        this.addLocation(2, "Rostov", "green", "stone", ["Novgorod", "Smolensk", "Chernigov", "Suzdal"]);
        this.addLocation(3, "Polotsk", "green", "stone", ["Novgorod", "Pskov", "Brest", "Volyn", "Kiev", "Chernigov", "Smolensk"]);
        this.addLocation(4, "Smolensk", "green", "honey", ["Novgorod", "Rostov", "Polotsk", "Chernigov"]);
        this.addLocation(5, "Volyn", "green", "fish", ["Brest", "Polotsk", "Galich", "Kiev"]);
        this.addLocation(6, "Kiev", "green", "wood", ["Volyn", "Polotsk", "Chernigov", "Galich", "Azov", "Pereyaslavl"]);
        this.addLocation(7, "Chernigov", "green", "fish", ["Rostov", "Polotsk", "Smolensk", "Kiev", "Suzdal", "Murom", "Pereyaslavl"]);
        this.addLocation(8, "Pereyaslavl", "green", "fur", ["Chernigov", "Kiev", "Murom", "Azov"]);
        this.addLocation(9, "Pskov", "yellow", "fish", ["Novgorod", "Polotsk", "Brest"]);
        this.addLocation(10, "Suzdal", "yellow", "wood", ["Rostov", "Chernigov", "Murom"]);
        this.addLocation(11, "Galich", "yellow", "honey", ["Volyn", "Kiev", "Peresech", "Azov", "Brest"]);
        this.addLocation(12, "Brest", "brown", "wood", ["Polotsk", "Volyn", "Pskov", "Galich", "Peresech"]);
        this.addLocation(13, "Murom", "brown", "stone", ["Chernigov", "Pereyaslavl", "Suzdal", "Azov"]);
        this.addLocation(14, "Peresech", "brown", "fur", ["Galich", "Brest", "Azov"]);
        this.addLocation(15, "Azov", "brown", "fish", ["Kiev", "Pereyaslavl", "Galich", "Murom", "Peresech"]);
    }

    addLocation(id, name, color, resource) {
        var location = new Location(id, name, color, resource);
        this.locations.push(location);
        this.locationByName[name] = location;
        location.rebels.push(this.rebels.placeRandomRebel());
    }

    getLocation(name) {
        return this.locationByName[name];
    }


    getLocations(numberOfPlayers) {
        locations = []
        // green
        if (numberOfPlayers < 2) {
            locations = this.locations.slice(0, 7);
        // yellow
        } else if (numberOfPlayers == 3) {
            locations = this.locations.slice(0, 10);
        // brown
        } else {
            locations = this.locations.slice(0, 14);
        }
        return locations;
    }

}

module.exports = GameMap, Location

//map = new GameMap();
//console.log(map);
