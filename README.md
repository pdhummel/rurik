# rurik
WIP - nodejs, javascript, and html for "Rurik: Dawn of Kiev" game.


## TODO
* show leader in supply
* game log
* messages and error messages in UI
* show round indicator on map board
* show upcoming advisors on map board
* first player bear token


* action phase
  * use conversion token
  * handle scheme card rewards - "Or", warTrack, deedCards
  * build action - church, stable, tavern
  * leader abilities
  * gain resources from war track on attack


* player view
  * show deed cards for self
  * show secret agenda
  * show captured rebel armies
  * show conversion tokens


* claim phase
  * create claim board

* save game state
* undo action/turn
  * don't allow undo if cards are drawn
* save game
* load game

* other players view
  * show scheme card count for others
  * show deed cards for others

* add support for AI players
  * AI strategy phase logic -- based on solo
  * AI action phase logic
  * Add AI to game creation/setup views


* game status -- show players joined before 
* game creator - 
  * create and join game in one action
  * only creator can start game
  * only creator can assign first player
  * join - game dropdown -- show only games waitingForPlayers
* join from list
* join game -- only show available positions in dropdown
* join game -- only show available colors in dropdown  


* integration tests
* refactor/redesign psychotic apis



## Complete
* refresh every 10 seconds
* show compass for player position
* bug - leader dropdown has repeat entries
* ability to rejoin from game list
* only rejoin game for valid colors
* strategy phase - auction boards
* show coins on advisor bid
* validation - coins for auction bid
* validation -- multiple advisors same color, same column
* fix troop coordinates on map
* add more leaders
* retrieve advisor from auction board
* show buildings on map
* dockerize
* muster action
* move action
* attack action
* tax action
* build action
* define scheme cards
* move goods between dock and boat
* advance war track after attack
* show scheme cards for self
* pick scheme cards
* add templating to split html into multiple files
* play scheme card
* create deed cards


## APIs


| Path | Method | Return | Purpose |
| :--- | :--- | :--- | :--- |
| /game | get | game list | list games |
| /game | post | Game | create game |
| /game/:id | get | Game | get game |
| /gameStatus/:id | get | GameStatus | X - get game status |
| /game/:id/player | post | Player | player join game |
| /game/:id/player | put | Player | player rejoin game |
| /game/:id/player | get | Player | get player |
| | | |
| | | get advisor board |
| | | player place advisor |
| | | player retrieve advisor |
| | | get map |
| | | get cards - scheme decks, deed cards |
| | | get claim board |


## Notes
```
docker build -f ./docker/Dockerfile -t ubuntu-focus-nodejs-11 .
docker run --name nodejs -d ubuntu-focus-nodejs-11 tail -f /dev/null
docker exec -it  nodejs bash
docker kill nodejs
docker rm nodejs

docker build -f ./docker/Dockerfile -t nodejs-rurik .
docker run -d --name rurik -p 3000:3000 -d nodejs-rurik
docker exec -it  rurik bash
docker kill rurik
docker rm rurik

node_modules/nodemon/bin/nodemon.js ./src/server.js
nodejs ./src/server.js
```

https://cloud.oracle.com
pdhummel

### Deeds
* payments and sacrifices
  * pay resource costs
  * pay a scheme card
  * sacrifice troops
  * sacrifice buildings
* verify achievements
* collect rewards


