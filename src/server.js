const Games = require('./game.js');
const Validator = require('./validations.js');

var games = new Games();

const express = require('express');
var bodyParser = require('body-parser');

const app = express();
var path    = require("path");
const port = 3000;



// set static directories
app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());

app.get('/api-tester', function (req, res) {
    res.sendFile(path.join(__dirname + '../public/api-tester.html'));
});
app.get('/view/rurik', function (req, res) {
  res.sendFile(path.join(__dirname + '../public/rurik.html'));
});


app.get('/', (req, res) => {
  res.send('Server for "Rurik: Dawn of Kiev."');
});


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



app.get('/game/:id', (req, res) => {
  console.log("get " + req.path + ", id=" + req.params.id);

  var game = games.getGameById(req.params.id);
  if (game === undefined) {
    res.status(404).send('Game not found');
    return;
  }
  res.send(game);
});

app.get('/gameStatus/:id', (req, res) => {
  console.log("get " + req.path + ", id=" + req.params.id + ", " +  req.query.clientColor);
  var gameStatus = games.getGameStatus(req.params.id, req.query.clientColor);
  if (gameStatus === undefined || gameStatus == null) {
    res.status(404).send('Game not found');
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


// getPlayer
app.get('/game/:id/player/:color', (req, res) => {
  console.log("get " + req.path + " " + req.params);
  var game = games.getGameById(req.params.id);
  if (game === undefined) {
    res.status(404).send('Game not found');
    return;
  }   
  var color = req.params["color"];
  var player = game.getPlayer(color);
  if (player === undefined) {
    res.status(404).send('Player not found for color ' + color);
    return;
  }
  //console.log(player);
  // TODO: if requesting player != player, then protect hidden info.
  res.send(player);
});

app.get('/game/:id/map', (req, res) => {
  console.log("get " + req.path + " " + req.params);
  var game = games.getGameById(req.params.id);
  if (game === undefined) {
    res.status(404).send('Game not found');
    return;
  }
  var locations = game.gameMap.getLocations(game.players.players.length);  
  res.send(locations);
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

app.put('/game/:id/location/:location/troops', (req, res) => {
  console.log("put " + req.path + " " + req.params);
  var game = games.getGameById(req.params.id);
  if (game === undefined) {
    res.status(404).send('Game not found');
    return;
  }
  var color = req.body.color;
  game.placeInitialTroop(color, req.params.location);
  var location = game.gameMap.getLocation(req.params.location);
  res.send(location);
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

app.get('/game/:id/auction', (req, res) => {
  console.log("get " + req.path + " " + req.params);
  var game = games.getGameById(req.params.id);
  if (game === undefined) {
    res.status(404).send('Game not found');
    return;
  }
  res.send(game.auctionBoard);
});

app.put('/game/:id/advisorBid/:action', (req, res) => {
  console.log("put " + req.path + " " + req.params);
  var game = games.getGameById(req.params.id);
  if (game === undefined) {
    res.status(404).send('Game not found');
    return;
  }
  var action = req.params.action;
  var color = req.body.color;
  var advisor = req.body.advisor;
  var bidCoins = req.body.bidCoins;
  var coins = 0;
  if (bidCoins != undefined && bidCoins != null && bidCoins > 0){
    coins = bidCoins;
  }
  try {
    game.playAdvisor(color, action, advisor, coins);
  } catch(error) {
    console.log(error.message);
    res.status(400).send(error.message);
    return;
  }   
  res.send(game.auctionBoard);
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



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

