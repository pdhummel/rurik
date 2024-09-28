class ClaimBoard {
    constructor() {
        this.claimsByPlayer = {};
        this.previousClaimsByPlayer = {};
        var colors = ["blue", "red", "white", "yellow"];
        for (var i=0; i<colors.length; i++) {
            var color = colors[i];
            this.claimsByPlayer[color] = {};
            this.claimsByPlayer[color]["rule"] = 0;
            this.claimsByPlayer[color]["build"] = 0;
            this.claimsByPlayer[color]["trade"] = 0;
            this.claimsByPlayer[color]["warfare"] = 0;
            this.previousClaimsByPlayer[color] = {};
            this.previousClaimsByPlayer[color]["rule"] = 0;
            this.previousClaimsByPlayer[color]["build"] = 0;
            this.previousClaimsByPlayer[color]["trade"] = 0;
        }

        var possibleWarfareRewards = [];
        var possibleWarfareRewards = ["2 wood", "2 coins", "2 fish", "fur", "schemeCard", "victoryPoint"];
        this.shuffleArray(possibleWarfareRewards);
        this.warfareRewards = {};
        for (var i=0; i<=10; i++) {            
            if (i>0 && (i%2==0)) {
                this.warfareRewards[i] = possibleWarfareRewards.shift();
            } else {
                this.warfareRewards[i] = null;
            }
        }

        this.claimsByTrack = {};
        this.requirementsByTrack = {};
        this.defineRequirementsByTrack();
        this.resetClaimsByTrack();
    }

    defineRequirementsByTrack() {
        var tracks = ["rule", "build", "trade"];
        var points = [8, 5, 3, 2, 1];
        for (var t=0; t<tracks.length; t++) {
            var track = tracks[t];
            this.requirementsByTrack[track] = {};
            for (var p=0; p<points.length; p++) {
                var pointKey = points[p];
                this.requirementsByTrack[track][pointKey] = 0;
            }
        }
        this.requirementsByTrack["rule"][8] = 5; // including Kiev & Novgorod
        this.requirementsByTrack["rule"][5] = 5;
        this.requirementsByTrack["rule"][3] = 4;
        this.requirementsByTrack["rule"][2] = 3;
        this.requirementsByTrack["rule"][1] = 2;
        this.requirementsByTrack["build"][8] = 7;
        this.requirementsByTrack["build"][5] = 5;
        this.requirementsByTrack["build"][3] = 4;
        this.requirementsByTrack["build"][2] = 3;
        this.requirementsByTrack["build"][1] = 2;
        this.requirementsByTrack["trade"][8] = 11;
        this.requirementsByTrack["trade"][5] = 9;
        this.requirementsByTrack["trade"][3] = 7;
        this.requirementsByTrack["trade"][2] = 5;
        this.requirementsByTrack["trade"][1] = 3;
    }

    calculateCoins(color) {
        console.log("calculateCoins(): " + color);
        var coins = 0;
        if (this.claimsByPlayer[color]["rule"] == 0) {
            coins++;
        }
        if (this.claimsByPlayer[color]["build"] == 0) {
            coins++;
        }
        if (this.claimsByPlayer[color]["trade"] == 0) {
            coins++;
        }
        if (this.claimsByPlayer[color]["warfare"] == 0) {
            coins++;
        }
        return coins;
    }

    // This resets the values which are used in the visualization of the claims track.
    resetClaimsByTrack() {
        console.log("resetClaimsByTrack()");
        var tracks = ["rule", "build", "trade"];
        var points = [8, 5, 3, 2, 1, 0];
        for (var t=0; t<tracks.length; t++) {
            var track = tracks[t];
            this.claimsByTrack[track] = {};
            for (var p=0; p<points.length; p++) {
                var pointKey = points[p];
                this.claimsByTrack[track][pointKey] = [];
            }
        }
        this.claimsByTrack["warfare"] = {};
        for (var p=0; p<=10; p++) {
            this.claimsByTrack["warfare"][p] = [];
        }
    }

    // This updates the values which are used in the visualization of the claims track
    // claimsByPlayer -> claimsByTrack
    updateClaimsByTrack() {
        console.log("updateClaimsByTrack()");
        var colors = ["blue", "red", "white", "yellow"];
        for (var i=0; i<colors.length; i++) {
            var color = colors[i];
            var rulePoints = this.claimsByPlayer[color]["rule"];
            this.claimsByTrack["rule"][rulePoints].push(color);
            var buildPoints = this.claimsByPlayer[color]["build"];
            this.claimsByTrack["build"][buildPoints].push(color);
            var tradePoints = this.claimsByPlayer[color]["trade"];
            this.claimsByTrack["trade"][tradePoints].push(color);
            var warfarePoints = this.claimsByPlayer[color]["warfare"];
            if (warfarePoints > 10) {
                warfarePoints = 10;
            }
            this.claimsByTrack["warfare"][warfarePoints].push(color);
        }
    }

    // This is used to save claimsByPlayer to previousClaimsByPlayer after the claimsByPlayer
    // have been calculated at the end of the round.
    updatePreviousClaims() {
        console.log("updatePreviousClaims()");
        var colors = ["blue", "red", "white", "yellow"];
        for (var i=0; i<colors.length; i++) {
            var color = colors[i];
            this.previousClaimsByPlayer[color]["rule"] = this.claimsByPlayer[color]["rule"];
            this.previousClaimsByPlayer[color]["build"] = this.claimsByPlayer[color]["build"];
            this.previousClaimsByPlayer[color]["trade"] = this.claimsByPlayer[color]["trade"];
            this.previousClaimsByPlayer[color]["warfare"] = this.claimsByPlayer[color]["warfare"];
        }
    }

    // This is useful to calculate in game scoring for a player. It is an ephemeral value,
    // which could be used by AI to evaluate who is winning and whether one decision is better than another.
    calculateTotalClaims(player, gameMap) {
        console.log("calculateTotalClaims(): " + player.color);
        var totalClaimPoints = 0;
        var color = player.color;
        var rulePoints = calculateClaimsForRule(player, gameMap);
        if (rulePoints > this.previousClaimsByPlayer[color]["rule"]) {
            totalClaimPoints = totalClaimPoints + rulePoints;
        } else {
            totalClaimPoints = totalClaimPoints + this.previousClaimsByPlayer[color]["rule"];
        }

        var tradePoints = calculateClaimsForTrade(player);
        if (tradePoints > this.previousClaimsByPlayer[color]["trade"]) {
            totalClaimPoints = totalClaimPoints + tradePoints;
        } else {
            totalClaimPoints = totalClaimPoints + this.previousClaimsByPlayer[color]["trade"];
        }

        var buildPoints = calculateClaimsForBuild(player, gameMap);
        if (buildPoints > this.previousClaimsByPlayer[color]["build"]) {
            totalClaimPoints = totalClaimPoints + buildPoints;
        } else {
            totalClaimPoints = totalClaimPoints + this.previousClaimsByPlayer[color]["build"];
        }
        totalClaimPoints = totalClaimPoints + this.claimsByPlayer[color]["warfare"];
        console.log("calculateTotalClaims(): totalClaimPoints=" + totalClaimPoints);
        return totalClaimPoints;
    }

    updateClaimsForClaimsPhase(game, players, gameMap) {
        for (var p=0; p < players.length; p++) {
            var player = players[p];
            // Coin compensation logic is done by players.endRoundForPlayers() - see calculateCoins().
            var coinCompensation = this.updateClaims(player, gameMap);
        }
        this.resetClaimsByTrack();
        this.updateClaimsByTrack();
    }

    // This updates the claimsByPlayer using the player's position on the map.
    // The claimsByPlayer never decrease so it is never worst than the previousClaimsByPlayer.
    updateClaims(player, gameMap) {
        console.log("updateClaims(): " + player.color);
        var coinCompensation = 0;
        var color = player.color;
        var rulePoints = this.calculateClaimsForRule(player, gameMap);
        if (rulePoints > this.previousClaimsByPlayer[color]["rule"]) {
            this.claimsByPlayer[color]["rule"] = rulePoints;
        }
        if (this.claimsByPlayer[color]["rule"] <= 0) {
            coinCompensation++;
        }

        var tradePoints = this.calculateClaimsForTrade(player);
        if (tradePoints > this.previousClaimsByPlayer[color]["trade"]) {
            this.claimsByPlayer[color]["trade"] = tradePoints;
        }
        if (this.claimsByPlayer[color]["trade"] <= 0) {
            coinCompensation++;
        }

        var buildPoints = this.calculateClaimsForBuild(player, gameMap);
        if (buildPoints > this.previousClaimsByPlayer[color]["build"]) {
            this.claimsByPlayer[color]["build"] = buildPoints;
        }
        if (this.claimsByPlayer[color]["build"] <= 0) {
            coinCompensation++;
        }
        return coinCompensation;
    }

    calculateClaimsForRule(player, gameMap) {
        console.log("calculateClaimsForRule(): " + player.color);
        var playerRulePoints = 0;
        var color = player.color;
        var rules = 0;
        var rulesKiev = false;
        var rulesNovgorod = false;
        for (var i=0; i<gameMap.locationsForGame.length; i++) {
            var location = gameMap.locationsForGame[i];
            var isSviatopolk = false;
            if (player.leader.name == "Sviatopolk" && location.leaderByColor[color] > 0) {
                isSviatopolk = true;
            }
            var isYaroslav = false;
            if (player.leader.name == "Yaroslav" && location.leaderByColor[color] > 0) {
                isYaroslav = true;
            }
            var rulesLocation = location.doesRule(color, isSviatopolk, isYaroslav);
            if (rulesLocation) {
                if (location.name == "Kiev") {
                    rulesKiev = true;
                }
                if (location.name == "Novgorod") {
                    rulesNovgorod = true;
                }
                rules++;
            }
        }
        var points = [8, 5, 3, 2, 1];
        for (var p=0; p<points.length; p++) {
            var rulePoints = points[p];
            if (rules >= this.requirementsByTrack["rule"][rulePoints] && rulePoints == 8) {
                if (rulesKiev && rulesNovgorod) {
                    playerRulePoints = rulePoints;
                    break;
                }
            } else if (rules >= this.requirementsByTrack["rule"][rulePoints]) {
                playerRulePoints = rulePoints;
                break;
            }
        }
        console.log("calculateClaimsForRule(): playerRulePoints=" + playerRulePoints);
        return playerRulePoints;
    }

    calculateClaimsForTrade(player) {
        console.log("calculateClaimsForTrade(): " + player.color);
        var playerTradePoints = 0;
        var goodsOnBoat = player.boat.goodsOnBoat["stone"] + player.boat.goodsOnBoat["wood"] +
            player.boat.goodsOnBoat["fish"] + player.boat.goodsOnBoat["honey"] + 
            player.boat.goodsOnBoat["fur"];

        var points = [8, 5, 3, 2, 1];
        for (var p=0; p<points.length; p++) {
            var tradePoints = points[p];
            if (goodsOnBoat >= this.requirementsByTrack["trade"][tradePoints]) {
                playerTradePoints = tradePoints;
                break;
            }
        }
        console.log("calculateClaimsForTrade(): playerTradePoints=" + playerTradePoints);
        return playerTradePoints;
    }

    calculateClaimsForBuild(player, gameMap) {
        console.log("calculateClaimsForBuild(): " + player.color);
        var playerBuildPoints = 0;
        var color = player.color;

        var locationsWithBuildings = [];
        for (var i=0; i<gameMap.locationsForGame.length; i++) {
            var location = gameMap.locationsForGame[i];
            if (location.doesPlayerHaveBuilding(color)) {
                locationsWithBuildings.push(location);
            }
        }
        var adjacentBuildRegions = this.countConnectedLocations(gameMap, color, locationsWithBuildings);

        var points = [8, 5, 3, 2, 1];
        for (var p=0; p<points.length; p++) {
            var buildPoints = points[p];
            if (adjacentBuildRegions >= this.requirementsByTrack["build"][buildPoints]) {
                playerBuildPoints = buildPoints;
                break;
            }
        }
        console.log("calculateClaimsForBuild(): playerBuildPoints=" + playerBuildPoints);
        return playerBuildPoints;
    }

    DFSUtil(gameMap, color, cluster, locationName, visited) {
        //console.log("DFSUtil(): " + locationName);
        // Mark the current node as visited and print it
        visited[locationName] = true;
        var location = gameMap.getLocation(locationName);
        if (location.doesPlayerHaveBuilding(color)) {
            cluster.push(locationName);
        }
            
        // Recur for all the vertices
        // adjacent to this vertex
        if (location.doesPlayerHaveBuilding(color)) {
            for (let x = 0; x < location.neighbors.length; x++) {
                if (!visited[location.neighbors[x]]) {
                    this.DFSUtil(gameMap, color, cluster, location.neighbors[x], visited);
                }   
            }
        }
        return cluster;
    }
     
    countConnectedLocations(gameMap, color, locationsWithBuildings) {
        console.log("countConnectedLocations(): " + locationsWithBuildings);
        var largestClusterCount = 0;
        // Mark all the vertices as not visited
        var V = locationsWithBuildings.length;
        let visited = new Array(V);
        for (let i = 0; i < V; i++) {
            var location = locationsWithBuildings[i];
            visited[location.name] = false;
        }
        for (let v = 0; v < V; ++v) {
            var location = locationsWithBuildings[v];
            if (!visited[location.name] && location.doesPlayerHaveBuilding(color)) {
                // count all reachable vertices from v
                var cluster = this.DFSUtil(gameMap, color, [], location.name, visited);
                if (cluster.length > largestClusterCount) {
                    largestClusterCount = cluster.length;
                }
            }
        }
        console.log("countConnectedLocations(): largestClusterCount=" + largestClusterCount);
        return largestClusterCount;
    }
     
    /* Randomize array in-place using Durstenfeld shuffle algorithm */
    shuffleArray(array) {
      for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
    }    
}

module.exports = ClaimBoard
