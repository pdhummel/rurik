const app = require('express').Router();
const Games = require('../game.js');

var games = Games.Games.getInstance();

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

  
module.exports = app;
