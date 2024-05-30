const Games = require('./game.js');
const Validator = require('./validations.js');
const preGameAndSetupRoutes = require("./routes/preGameAndSetup");
const strategyPhaseRoutes = require("./routes/strategyPhase");
const actionPhaseRoutes = require("./routes/actionPhase");

var games = Games.getInstance();

const express = require('express');
var bodyParser = require('body-parser');
const path = require("path");
const app = express();


const port = 3000;

app.set("view engine", "ejs");

// set static directories
app.use('/', express.static('public'));

app.use(bodyParser.json());

app.use(preGameAndSetupRoutes);
app.use(strategyPhaseRoutes);
app.use(actionPhaseRoutes);

app.get("/", (req, res) => {
  res.render("index"); // index refers to index.ejs
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



app.put('/game/:id/location/:location/troops', (req, res) => {
  console.log("put " + req.path + " " + req.params);
  var game = games.getGameById(req.params.id);
  if (game === undefined) {
    res.status(404).send('Game not found');
    return;
  }
  var locationName = req.params.location;
  var color = req.body.color;
  var gameState = game.gameStates.getCurrentState().name;
  if (gameState == "waitingForTroopPlacement") {
    game.placeInitialTroop(color, req.params.location);
  } else if (gameState == "actionPhase" || gameState == "actionPhaseMuster") {
    var numberOfTroops = 0;
    if (req.body.numberOfTroops != undefined && req.body.numberOfTroops != null) {
      numberOfTroops = req.body.numberOfTroops;
    }  
    game.muster(color, locationName, numberOfTroops);
  }
  var location = game.gameMap.getLocation(locationName);
  res.send(location);
});


app.get('/game/:id/player/:color/location', (req, res) => {
  console.log("get " + req.path + " " + req.params);
  var game = games.getGameById(req.params.id);
  if (game === undefined) {
    res.status(404).send('Game not found');
    return;
  }
  var color = req.params.color;
  var locationMap = game.gameMap.getLocationsForPlayer(color);
  console.log("/game/:id/player/:color/location: " + locationMap);
  res.send(locationMap);
});

app.put('/game/:id/player/:color/boat', (req, res) => {
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
  var direction = req.body.direction;
  var resource = req.body.resource;
  game.transferGood(color, direction, resource);
  res.send(player);
});


app.get('/game/:id/cards', (req, res) => {
  console.log("get " + req.path + " " + req.params);
  var game = games.getGameById(req.params.id);
  if (game === undefined) {
    res.status(404).send('Game not found');
    return;
  }
  var cards = {};
  cards["deedCards"] = game.cards.displayedDeedCards;
  cards["schemeDeck1"] = game.cards.schemeDeck1;
  cards["schemeDeck2"] = game.cards.schemeDeck2;
  cards['discardedSchemeCards'] = game.cards.discardedSchemeCards;
  res.send(cards);
});

app.put('/game/:id/player/:color/takeDeedCard', (req, res) => {
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
  var deedCardName = req.body.deedCard;
  if (deedCardName == undefined || deedCardName == null || deedCardName == "null") {
    res.status(404).send('Deed Card not selected.');
    return;
  }
  game.takeDeedCard(color, deedCardName);
  res.send(player);
});
  
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


