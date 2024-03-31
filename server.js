const Games = require('./game.js');
const Validator = require('./validations.js');

var games = new Games();

//import * as express from "express";
//import express from "express";
const express = require('express');
var bodyParser = require('body-parser');

const app = express();
var path    = require("path");
const port = 3000;



// set static directories
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.get('/api-tester', function (req, res) {
    res.sendFile(path.join(__dirname+ '/public/api-tester.html'));
});


app.get('/', (req, res) => {
  res.send('Server for "Rurik: Dawn of Kiev."');
});


// create game
app.post('/game', (req, res) => {
  console.log("post " + req.path);
  // TODO: get target players from request

  var game = null;
  try {
    game = games.createGame(4)
  } catch(error) {
    console.log(error.message);
    res.status(400).send(error.message);
    return;
  } 

  // TODO: send back a subset
  res.send(game);
});



app.get('/game/:id', (req, res) => {
  console.log("get " + req.path + ", id=" + req.params.id);
  var game = games.getGameById(req.params.id);
  console.log(games);
  console.log(game);
  if (game === undefined) {
    res.status(404).send('Not found');
  }    
  res.send(game);
});



// TODO: add game id
// joinGame
app.post('/game/:id/player', (req, res) => {
  console.log("post " + req.path + ", body=" + JSON.stringify(req.body));
  
  try {
    var game = games.getGameById(req.params.id);
    var color = req.body.color;
    var name = req.body.name;
    var position = req.body.position;
    console.log("post /player: name=" + name + ", position=" + position + ", color=" + color);
    game.joinGame(name, color, position);
  } catch(error) {
    console.log(error.message);
    res.status(400).send(error.message);
    return;
  } 

  var player = game.getPlayer(color);
  res.send(player);
  if (player === undefined) {
    res.status(404).send('Not found');
  }  
});

// startGame
app.put('/game/:id', (req, res) => {
  console.log("post " + req.path);
  var game = games.getGameById(req.params.id);
  
  try {
    game.startGame();
  } catch(error) {
    console.log(error.message);
    res.status(400).send(error.message);
    return;
  } 

  // TODO: send back a subset
  res.send(game);
});


app.get('/game/:id/player/:color', (req, res) => {
  console.log(req.path, req.params);
  var game = games.getGameById(req.params.id);
  var color = req.params["color"];
  var player = game.getPlayer(color);
  if (player === undefined) {
    res.status(404).send('Not found');
  }
  console.log(player);
  res.send(player);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

