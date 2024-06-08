const app = require('express').Router();
const Games = require('../game.js');
const GameMap = require('../map.js');
const GameStates = require('../state.js');
const Players = require('../player.js');
const Cards = require('../cards.js');
const ClaimBoard = require('../claims.js');
const AvailableLeaders = require('../leader.js');

var games = Games.Games.getInstance();


app.get('/game/:id/test', (req, res) => {
    var game = games.getGameById(req.params.id);
    res.send(game);
});


app.post('/game/:id/test', (req, res) => {
    var gameStatus = games.createGame("Test Game", 4);
    var game = games.getGameById(gameStatus.id);
    games.games[req.params.id] = game;
    res.send(game);
});

app.put('/game/:id/test', (req, res) => {
    var gameObject = require("../../tests/gameData/claimPhase.json");
    gameObject.id = req.params.id;
    var game = games.restoreGame(gameObject);
    res.send(game);
});


module.exports = app;