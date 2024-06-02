const app = require('express').Router();
const Games = require('../game.js');

var games = Games.getInstance();

app.post('/game/:id/player/:color/move', (req, res) => {
    console.log("post " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    var color = req.params.color;
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var player = game.getPlayer(color);
    if (player === undefined) {
      res.status(404).send('Player not found for color ' + color);
      return;
    }
    var fromLocationName = req.body.fromLocationName;
    var toLocationName = req.body.toLocationName;
    var fromLocation = game.gameMap.getLocation(fromLocationName);
    if (fromLocation === undefined) {
      res.status(404).send('Location not found, ' + fromLocation);
    }
    var toLocation = game.gameMap.getLocation(toLocationName);
    if (toLocation === undefined) {
      res.status(404).send('Location not found, ' + toLocation);
    }
    var moveLeader = false;
    var moveLeaderYN = req.body.moveLeaderYN;
    if (moveLeaderYN == 'Y') {
      moveLeader = true;
    }
  
    try {
      game.move(color, fromLocationName, toLocationName, 1, moveLeader);
      res.send(game.gameMap.locations);
      return;
    } catch(error) {
      console.log(error.message);
      res.status(400).send(error.message);
      return;
    }     
  });
  
  app.post('/game/:id/player/:color/attack', (req, res) => {
    console.log("post " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    var color = req.params.color;
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var player = game.getPlayer(color);
    if (player === undefined) {
      res.status(404).send('Player not found for color ' + color);
      return;
    }
    var attackLocationName = req.body.attackLocationName;
    var attackLocation = game.gameMap.getLocation(attackLocationName);
    if (attackLocation === undefined) {
      res.status(404).send('Location not found, ' + attackLocation);
    }
    var schemeDeckNumber = req.body.schemeDeckNumber;
    var target = req.body.target;
    try {
      if (schemeDeckNumber == 1 || schemeDeckNumber == 2) {
        game.attack(color, attackLocationName, target, schemeDeckNumber);
      } else {
        game.attack(color, attackLocationName, target);
      }
      res.send(game.gameMap.locations);
      return;
    } catch(error) {
      console.log(error.message);
      res.status(400).send(error.message);
      return;
    }     
  });
  
  app.post('/game/:id/player/:color/tax', (req, res) => {
    console.log("post " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    var color = req.params.color;
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var player = game.getPlayer(color);
    if (player === undefined) {
      res.status(404).send('Player not found for color ' + color);
      return;
    }
    var locationName = req.body.locationName;
    var location = game.gameMap.getLocation(locationName);
    if (location === undefined) {
      res.status(404).send('Location not found, ' + locationName);
    }
    var marketCoin = false;
    var marketCoinYN = req.body.marketCoinYN;
    if (marketCoinYN == 'Y') {
      marketCoin = true;
    }
  
    try {
      game.tax(color, locationName, true, marketCoin);
      res.send(game.gameMap.locations);
      return;
    } catch(error) {
      console.log(error.message);
      res.status(400).send(error.message);
      return;
    }     
  });
  
  
  app.post('/game/:id/player/:color/build', (req, res) => {
    console.log("post " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    var color = req.params.color;
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var player = game.getPlayer(color);
    if (player === undefined) {
      res.status(404).send('Player not found for color ' + color);
      return;
    }
    var locationName = req.body.locationName;
    var location = game.gameMap.getLocation(locationName);
    if (location === undefined) {
      res.status(404).send('Location not found, ' + locationName);
    }
  
    var building = req.body.building;
    try {
      game.build(color, locationName, building);
      res.send(game.gameMap.locations);
      return;
    } catch(error) {
      console.log(error.message);
      res.status(400).send(error.message);
      return;
    }     
  });

  
app.get('/game/:id/player/:color/nextAdvisor', (req, res) => {
    console.log("get " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    var color = req.params.color;
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var player = game.getPlayer(color);
    if (player === undefined) {
      res.status(404).send('Player not found for color ' + color);
      return;
    }
    try {
      var auctionSpaces = game.auctionBoard.getNextAuctionSpaceAdvisor(color);
      res.send(auctionSpaces);
      return;
    } catch(error) {
      console.log(error.message);
      res.status(400).send(error.message);
      return;
    }     
  });
  
  
  
  app.put('/game/:id/advisorRetrieve/:action', (req, res) => {
    console.log("put " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var action = req.params.action;
    var color = req.body.color;
    var advisor = req.body.advisor;
    var row = req.body.row;
    var forfeitActionYN = req.body.forfeitAction;
    var forfeitAction = false;
    if (forfeitActionYN == 'Y') {
      forfeitAction = true;
    }
    try {
      console.log("/game/:id/advisorRetrieve/:action: " + color + " " + advisor + " " + action + " " + " " + row + " " + 
          forfeitActionYN + " " + forfeitAction);
      game.takeMainAction(color, advisor, action, row, forfeitAction)
    } catch(error) {
      console.log(error.message);
      res.status(400).send(error.message);
      return;
    }   
    res.send(game.auctionBoard);
  });
  
  app.delete('/game/:id/player/:color/turn', (req, res) => {
    console.log("delete " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var color = req.params.color;
    game.endTurn(color);
    var gameStatus = games.getGameStatus(req.params.id, color);
    if (gameStatus === undefined || gameStatus == null) {
      res.status(404).send('Game not found');
      return;
    }    
    res.send(gameStatus);
  });
  
  
  // http://localhost:3000/game/1713819462226/player/blue/turn
  app.put('/game/:id/player/:color/turn', (req, res) => {
    console.log("put " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var color = req.params.color;
    var action = req.body.action;
    game.beginActionPhaseAction(color, action);
    var gameStatus = games.getGameStatus(req.params.id, color);
    res.send(gameStatus);
  });

  app.put('/game/:id/player/:color/schemeFirstPlayer', (req, res) => {
    console.log("put " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var color = req.params.color;
    var player = game.getPlayer(color);
    if (player == undefined) {
      res.status(404).send('Player not found');
      return;
    }
    var firstPlayerColor = req.body.firstPlayerColor;
    var otherPlayer = game.getPlayer(firstPlayerColor);
    if (otherPlayer == undefined) {
      res.status(404).send('Player not found for ' + firstPlayerColor);
      return;
    }
  
    game.schemeFirstPlayer(color, firstPlayerColor);
    res.send(player);
  });
  
  app.put('/game/:id/player/:color/drawSchemeCards', (req, res) => {
    console.log("put " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var color = req.params.color;
    var player = game.getPlayer(color);
    if (player == undefined) {
      res.status(404).send('Player not found');
      return;
    }
    var schemeDeck = req.body.schemeDeck;
    game.drawSchemeCards(color, schemeDeck);
    res.send(player);
  });
  
  // Discard a scheme card and return it to its deck
  app.delete('/game/:id/player/:color/schemeCard', (req, res) => {
    console.log("delete " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var color = req.params.color;
    var player = game.getPlayer(color);
    if (player == undefined) {
      res.status(404).send('Player not found');
      return;
    }
    var schemeCard = req.body.schemeCard;
    var schemeDeck = player.returnSchemeDeck;
    game.selectSchemeCardToReturn(color, schemeDeck, schemeCard);
    res.send(player);
  });

  // play a scheme card
  app.post('/game/:id/player/:color/schemeCard', (req, res) => {
    console.log("post " + req.path + " " + req.params);
    var game = games.getGameById(req.params.id);
    if (game === undefined) {
      res.status(404).send('Game not found');
      return;
    }
    var color = req.params.color;
    var player = game.getPlayer(color);
    if (player == undefined) {
      res.status(404).send('Player not found');
      return;
    }
    var schemeCardId = req.body.schemeCard;
    var schemeCardActionChoice = req.body.schemeCardActionChoice;
    try {
      game.playSchemeCard(color, schemeCardId, schemeCardActionChoice);
    } catch(error) {
      console.log(error.message);
      res.status(400).send(error.message);
      return;
    }   
    res.send(player);
  });  


    // play a conversion tile
    app.post('/game/:id/player/:color/conversionTile', (req, res) => {
      console.log("post " + req.path + " " + req.params);
      var game = games.getGameById(req.params.id);
      if (game === undefined) {
        res.status(404).send('Game not found');
        return;
      }
      var color = req.params.color;
      var player = game.getPlayer(color);
      if (player == undefined) {
        res.status(404).send('Player not found');
        return;
      }
      var conversionTileName = req.body.conversionTile;
      var resource1 = req.body.resource1;
      var resource2 = req.body.resource2;
      try {
        game.playConversionTile(color, conversionTileName, resource1, resource2);
      } catch(error) {
        console.log(error.message);
        res.status(400).send(error.message);
        return;
      }   
      res.send(player);
    });  


module.exports = app;