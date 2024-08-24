const Games = require('../game.js');
const gameRoutes = require("./game.js");
const preGameAndSetupRoutes = require("./preGameAndSetup.js");
const strategyPhaseRoutes = require("./strategyPhase.js");
const actionPhaseRoutes = require("./actionPhase.js");
const testRoutes = require("./tests.js");

var games = Games.Games.getInstance();

const express = require('express');
var bodyParser = require('body-parser');
const path = require("path");
const app = express();

const port = 3000;

app.set('views', path.join(__dirname, '../../views'))
app.set("view engine", "ejs");

// set static directories
app.use('/', express.static(path.join(__dirname, '../../public')));

app.use(bodyParser.json());
app.use(preGameAndSetupRoutes);
app.use(strategyPhaseRoutes);
app.use(actionPhaseRoutes);
app.use(testRoutes);
app.use(gameRoutes);

app.get("/", (req, res) => {
  res.render("index"); // index refers to index.ejs
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
