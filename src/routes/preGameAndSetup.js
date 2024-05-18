const app = require('express').Router();
const Games = require('../game.js');

var games = Games.getInstance();


app.get('/game', (req, res) => {
    console.log("get " + req.path);
    var gameList = games.listGames();
    res.send(gameList);
  });
  
  // create game
  app.post('/game', (req, res) => {
    console.log("post " + req.path);
    var targetPlayers = 4;
    if (req.body.targetPlayers != undefined) {
        targetPlayers = req.body.targetPlayers;
    }
    var name = req.body.gameName;
    if (name == undefined || name.length < 1) {
        res.status(400).send("Game name is required.");
        return;
    }
  
    var gameStatus = null;
    try {
        gameStatus = games.createGame(name, targetPlayers);
    } catch(error) {
        console.log(error.message);
        res.status(400).send(error.message);
        return;
    } 
  
    res.send(gameStatus);
  });
  
  
  
  
  
  // joinGame
  app.post('/game/:id/player', (req, res) => {
    console.log("post " + req.path + ", body=" + JSON.stringify(req.body));
    
    var game = null;
    var color = null;
    try {
      var game = games.getGameById(req.params.id);
      var color = req.body.color;
      var name = req.body.name;
      var position = req.body.position;
      console.log("name=" + name + ", position=" + position + ", color=" + color);
      if (color == undefined || color.length < 1) {
        res.status(400).send("Color is required.");
        return;
      }
      if (position == undefined || position.length < 1) {
        res.status(400).send("Position is required.");
        return;
      }
      if (game.getPlayer(color) === undefined) {
        if (name == undefined || name.length < 1) {
          res.status(400).send("Player name is required.");
          return;
        }      
        game.joinGame(name, color, position);
      } else {
        console.log("color already exists in game -- rejoin");
        res.status(400).send("Color already exists in game -- rejoin.");
        return;
      }
    } catch(error) {
      console.log(error.message);
      res.status(400).send(error.message);
      return;
    } 
  
    var player = game.getPlayer(color);
    if (player === undefined) {
      res.status(404).send('Player not found');
      return;
    }  
    res.send(player);
  });
  
  // rejoinGame
  app.put('/game/:id/player', (req, res) => {
    console.log("post " + req.path + ", body=" + JSON.stringify(req.body));
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }    
    var color = req.body.color;
    console.log("color=" + color);
    if (color == undefined || color.length < 1) {
      res.status(400).send("Color is required.");
      return;
    }
    var player = game.getPlayer(color);
    res.send(player);
    if (player === undefined) {
      res.status(404).send('Player not found for color ' + color);
    }  
  });
  
  // startGame
  app.put('/game/:id', (req, res) => {
    console.log("put " + req.path);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }    
    
    try {
      game.startGame();
    } catch(error) {
      console.log(error.message);
      res.status(400).send(error.message);
      return;
    } 
  
    var gameStatus = games.getGameStatus(req.params.id);
    res.send(gameStatus);
  });
  
  
  app.put('/game/:id/firstplayer/:color', (req, res) => {
    console.log("put " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var color = req.params.color;
    game.selectFirstPlayer(color);
    var gameStatus = games.getGameStatus(req.params.id);
    res.send(gameStatus);
  });
  
  app.post('/game/:id/firstplayer', (req, res) => {
    console.log("post " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    game.selectRandomFirstPlayer();
    var gameStatus = games.getGameStatus(req.params.id);
    res.send(gameStatus);
  });
  
  app.get('/game/:id/leaders', (req, res) => {
    console.log("get " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    res.send(game.availableLeaders.availableLeaders);
  });
  
  app.post('/game/:id/player/:color/leaders', (req, res) => {
    console.log("post " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var color = req.params.color;
    var leaderName = req.body.leaderName;
    game.chooseLeader(color, leaderName);
    var player = game.getPlayer(color);
    if (player === undefined) {
      res.status(404).send('Player not found for color ' + color);
      return;
    }
    res.send(player);
  });
  
  
  app.get('/game/:id/player/:color/secretAgenda', (req, res) => {
    console.log("get " +  req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var color = req.params.color;
    var player = game.getPlayer(color);
    if (player === undefined) {
      res.status(404).send('Player not found for color ' + color);
      return;
    }
    res.send(player.temporarySecretAgenda);
  });
  
  app.post('/game/:id/player/:color/secretAgenda', (req, res) => {
    console.log("post " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var color = req.params.color;
    var cardName =  req.body.cardName;
    game.selectSecretAgenda(color, cardName)
    var player = game.getPlayer(color);
    if (player === undefined) {
      res.status(404).send('Player not found for color ' + color);
      return;
    }
    res.send(player.secretAgenda);
  });
    
  app.put('/game/:id/location/:location/leader', (req, res) => {
    console.log("put " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var color = req.body.color;
    game.placeLeader(color, req.params.location);
    var location = game.gameMap.getLocation(req.params.location);
    res.send(location);
  });
  
  
  

module.exports = app;