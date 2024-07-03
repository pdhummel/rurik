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
        if (count + this.troopsByColor[color] >= 0) {
            this.troopsByColor[color] = this.troopsByColor[color] + count;
        }
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
            var hasMatch = this.hasBuilding(buildingName);
            if (! hasMatch) {
                var building = new Building(color, buildingName)
                this.buildings.push(building);
            }
        }
    }

    hasBuilding(buildingName) {
        var hasMatch = false;
        for (var i=0; i<this.buildings.length; i++) {
            if (this.buildings[i].name == buildingName) {
                hasMatch = true;
            }
        }
        return hasMatch;
    }

    countStrongholds(color) {
        var strongholds = 0;
        for (var i=0; i<this.buildings.length; i++) {
            if (this.buildings[i].name == "stronghold" && this.buildings[i].color == color) {
                strongholds++;
            }
        }
        return strongholds;
    }

    doesPlayerHaveMarket(color) {
        var hasMarket = false;
        for (var i=0; i<this.buildings.length; i++) {
            if (this.buildings[i].name == "market" && this.buildings[i].color == color) {
                hasMarket = true;
            }
        }
        return hasMarket;
    }

    doesPlayerHaveBuilding(color) {
        var hasBuilding = false;
        for (var i=0; i<this.buildings.length; i++) {
            if (this.buildings[i].color == color) {
                hasBuilding = true;
            }
        }
        return hasBuilding;
    }

    doesPlayerHaveThisBuilding(color, buildingName) {
        var hasBuilding = false;
        for (var i=0; i<this.buildings.length; i++) {
            if (this.buildings[i].color == color) {
                if (this.buildings[i].name == buildingName) {
                    hasBuilding = true;
                }
            }
        }
        return hasBuilding;

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

    isLeaderInLocation(color) {
        if (this.leaderByColor[color] > 0) {
            return true;
        }
        return false;
    }


    whoRules() {
        var yellow = this.countStrongholds("yellow") + this.troopsByColor["yellow"] + this.leaderByColor["yellow"];
        var red = this.countStrongholds("red") + this.troopsByColor["red"] + this.leaderByColor["red"];
        var white = this.countStrongholds("white") + this.troopsByColor["white"] + this.leaderByColor["white"];
        var blue = this.countStrongholds("blue") + this.troopsByColor["blue"] + this.leaderByColor["blue"];
        var highValue = yellow;
        var ruler = "yellow";
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
        console.log(this.name + " is ruled by " + ruler);
        return ruler;
    }

    isNeighbor(locationName) {
        console.log("isNeighbor(): self=" + this.name + ", neighbor? " + locationName);
        for (var i=0; i<this.neighbors.length; i++) {
            //console.log("isNeighbor(): equal? " + this.neighbors[i] + " " + locationName);
            if (this.neighbors[i] == locationName) {
                return true;
            }
        }
        return false;
    }

    restoreLocation() {
        var tempBuildings = [];
        for (var b=0; b<this.buildings.length; b++) {
            var building = this.buildings[b];
            var newBuilding = new Building(building.color, building.name);
            //var buildingProto = this.clone(Building.proto);
            building = Object.assign(newBuilding, building);
            tempBuildings.push(building);
        }
        this.buildings = tempBuildings;
    }    
}

class GameMap {

    constructor() {
        this.locationByName = {};
        this.locations = [];
        this.locationsForGame = [];
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


    restoreGameMap() {
        var newRebels = new Rebels();
        this.rebels = Object.assign(newRebels, this.rebels);

        for (var i=0; i < Object.keys(this.locationByName).length; i++) {
            var key = Object.keys(this.locationByName)[i];
            var location = this.locationByName[key];
            var newLocation = new Location(location.id, location.name, location.color, location.defaultResource, location.neighbors);
            var location = Object.assign(newLocation, location);
            this.locationByName[key] = location;
        }

        var tempLocations = [];
        for (var i=0; i < this.locations.length; i++) {
            var location = this.locations[i];
            var locationName = location.name;
            location = this.locationByName[locationName];
            tempLocations.push(location);
        }
        this.locations = tempLocations;
        tempLocations = [];
        for (var i=0; i < this.locationsForGame.length; i++) {
            var location = this.locationsForGame[i];
            var locationName = location.name;
            location = this.locationByName[locationName];
            tempLocations.push(location);
        }
        this.locationsForGame = tempLocations;
    }

    addLocation(id, name, color, resource, neighbors) {
        var location = new Location(id, name, color, resource, neighbors);
        this.locations.push(location);
        this.locationByName[name] = location;
        location.rebels.push(this.rebels.placeRandomRebel());
    }

    getLocation(name) {
        return this.locationByName[name];
    }

    setLocationsForGame(numberOfPlayers) {
        var locations = []
        // green
        if (numberOfPlayers <= 2) {
            locations = this.locations.slice(0, 8);
        // yellow
        } else if (numberOfPlayers == 3) {
            locations = this.locations.slice(0, 11);
        // brown
        } else {
            locations = this.locations.slice(0, 15);
        }
        this.locationsForGame = locations;
    }

    getLocations(numberOfPlayers) {
        if (this.locationsForGame.length <= 0) {
            this.setLocationsForGame(numberOfPlayers);
        }
        return this.locationsForGame;
    }

    getLocationsForPlayer(color) {
        var locationMap = {};
        locationMap["rules"] = [];
        locationMap["occupies"] = [];
        locationMap["hasBuildings"] = [];
        locationMap["neighbors"] = [];
        locationMap["enemies"] = [];
        var neighbors = [];
        var locationsForGame = new Set();
        for (var i=0; i < this.locationsForGame.length; i++) {
            locationsForGame.add(this.locationsForGame[i].name);
        }
        console.log("getLocationsForPlayer(): locationsForGame=" + [...locationsForGame].join(' '));
        for (var i=0; i < this.locations.length; i++) {
            var location = this.locations[i];
            locationMap[location.name] = {};
            locationMap[location.name]["rules"] = location.doesRule(color);
            if (locationMap[location.name]["rules"]) {
                locationMap["rules"].push(location.name);
            }
            locationMap[location.name]["occupies"] = location.doesOccupy(color);
            if (locationMap[location.name]["occupies"]) {
                locationMap["occupies"].push(location.name);
                for (var j=0; j<location.neighbors.length; j++) {
                    var locationName = location.neighbors[j];
                    if (locationsForGame.has(locationName)) {
                        neighbors.push(locationName);
                    }    
                }
            }
            locationMap[location.name]["hasStronghold"] = location.countStrongholds(color) > 0 ? true : false; 
            locationMap[location.name]["hasMarket"] = location.doesPlayerHaveMarket(color);
            if (location.doesPlayerHaveBuilding(color)) {
                locationMap["hasBuildings"].push(location.name);
            }
        }
        locationMap["neighbors"] = Array.from(new Set(neighbors));
        return locationMap;
    }

    resetResources() {
        for (var i=0; i<this.locationsForGame.length; i++) {
            var location = this.locationsForGame[i];
            location.resourceCount = 1;
        }
    }

}

module.exports = GameMap, Location


