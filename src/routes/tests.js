const app = require('express').Router();
const Games = require('../game.js');
const GameMap = require('../map.js');
const GameStates = require('../state.js');
const Players = require('../player.js');
const Cards = require('../cards.js');
const ClaimBoard = require('../claims.js');
const AvailableLeaders = require('../leader.js');

var games = Games.Games.getInstance();


app.get('/test/game/:id/dump', (req, res) => {
    var game = games.getGameById(req.params.id);
    game.log.game = null;
    res.send(game);
});

app.delete('/test/game/:id', (req, res) => {
  var gameId = req.params.id;
  //if(games.games.hasKey(gameId)) {
    //delete games.games[gameId];
  //}
  delete games.games[gameId];
  //games.games.delete(gameId);
  var gameList = games.listGames();
  res.send(gameList);
});


app.post('/test/game/:id/create', (req, res) => {
    var gameStatus = games.createGame("Test Game", 4);
    var game = games.getGameById(gameStatus.id);
    games.games[req.params.id] = game;
    res.send(game);
});

app.put('/test/game/:id/load', (req, res) => {
    var gameObject = require("../../tests/gameData/claimPhase.json");
    gameObject.id = req.params.id;
    var game = games.restoreGame(gameObject);
    res.send(game);
});

app.put('/test/game/:id/player/:color/coin', (req, res) => {
    console.log("get " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send({"error": "Game not found"});
      return;
    }
    var color = req.params.color;
    var player = game.getPlayer(color);
    if (player == undefined) {
      res.status(404).send({"error": "Player not found for color " + color});
      return;
    }
    var amount = req.body.amount;
    if (amount == undefined || amount == null || amount == "") {
        amount = 1;
    }
    if (player.boat.money + amount >= 0) {
      player.boat.money = player.boat.money + amount;
    }
    res.send(player);
  });

  app.put('/test/game/:id/player/:color/troop', (req, res) => {
    console.log("get " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send({"error": "Game not found"});
      return;
    }
    var color = req.params.color;
    var player = game.getPlayer(color);
    if (player == undefined) {
      res.status(404).send({"error": "Player not found for color " + color});
      return;
    }
    var amount = req.body.amount;
    if (amount == undefined || amount == null || amount == "") {
        amount = 1;
    }
    var locationName = req.body.location;
    var location = game.gameMap.getLocation(locationName);
    if (location == undefined) {
        res.status(404).send({"error": "Location not found for " + locationName});
        return;
    }
    location.addTroop(color, amount);
    res.send(location);
  });


  app.put('/test/game/:id/player/:color/action', (req, res) => {
    console.log("get " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send({"error": "Game not found"});
      return;
    }
    var color = req.params.color;
    var player = game.getPlayer(color);
    if (player == undefined) {
      res.status(404).send({"error": "Player not found for color " + color});
      return;
    }
    var action = req.body.action;
    if (this.gameStates.currentState.name.startsWith("actionPhase") && this.players.getCurrentPlayer().color == color) {
        if (action == "muster") {
            player.troopsToDeploy = currentPlayer.troopsToDeploy + 1;
        } else if (action == "build") {
            player.buildActions++;
        } else if (action == "tax") {
            player.taxActions++;
        } else if (action == "move") {
            player.moveActions++;
        } else if (action == "attack") {
            player.attackActions++;
        }
    }
    res.send(player);
  });

  app.put('/test/game/:id/player/:color/resource', (req, res) => {
    console.log("get " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send({"error": "Game not found"});
      return;
    }
    var color = req.params.color;
    var player = game.getPlayer(color);
    if (player == undefined) {
      res.status(404).send({"error": "Player not found for color " + color});
      return;
    }
    var resource = req.body.resource;
    var amount = req.body.amount;
    if (amount == undefined || amount == null || amount == "") {
        amount = 1;
    }
    if (player.boat.goodsOnDock[resource] + amount >= 0) {
      player.boat.goodsOnDock[resource] = player.boat.goodsOnDock[resource] + amount;
    }
    res.send(player);
  });


module.exports = app;