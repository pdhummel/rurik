# rurik
WIP - nodejs, javascript, and html for "Rurik: Dawn of Kiev" game.


## TODO

* define scheme cards
* show leader in supply

* action phase
  * pick scheme cards
  * use conversion token
  * play scheme card
  * tax action
  * move action
  * build action
  * attack action
  * leader abilities


* player view
  * show scheme cards for self
  * show deed cards for self
  * show secret agenda
  * show captured rebel armies
  * show conversion tokens


* claim phase
  * create claim board
  * create deed cards

* save game state
* undo action/turn
  * don't allow undo if scheme cards drawn
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


* unit tests - mocha+chai
* integration tests


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

