# rurik
WIP - nodejs, javascript, and html for "Rurik: Dawn of Kiev" game.


## TODO
* game log
* show upcoming advisors on map board
* show reward for deed cards




* action phase
  * build action - stable, tavern
  * handle scheme card rewards
    * warTrack bonus
  * leader abilities
  * leader defeated and leader muster
  * gain war track bonuses on attack
  * get rewards for accomplishing deeds
  
* hack mode
  * add/subtract money
  * muster troop to anywhere
  * remove troop from anywhere
  * remove resource from anywhere
  * refresh resource anywhere
  * add resource to dock
  * remove leader from anywhere
  * place leader in supply to anywhere
  * remove building from anywhere
  * place building in supply to anywhere
  * take scheme card from deck
  * set round
  * set phase
  * set current player
  * add actions for move, tax, build, attack


* player view
  * show leader in supply  
  * show total victory points

* claim phase
  * coins from boat
  * coin compensation from claim board and war tracks

* save game state
* undo action/turn
  * don't allow undo if cards are drawn
* save game
* load game

* other players view
  * show scheme card count for others
  * show completed deed cards for others
  * show player boat, dock, supply
  * show total victory points for others

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
* show captured rebel armies
* show conversion tokens
* first player bear token
* scheme card reward - take deedCard
* show deed cards for self
* bug: fix docker after code refactoring
* show secret agenda
* scheme cards with "Or" rewards
* use conversion token
* build action - church
* show round indicator on map board
* create claim board
* display war track with claim board
* window for claim board and war track
* display war track bonuses
* make assertions for accomplishing a deed
* verify assertions for accomplishing a deed
* indicate accomplished deed cards
* end game logic and scoring
* show error messages in UI


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

```
rurik_server=
# remote onetime setup
ssh  opc@${rurik_server}
sudo su -
# setup ~/.ssh/id_rsa and ~/.ssh/id_rsa.pub
dnf install podman
dnf install git
exit # sudo
git clone git@github.com:pdhummel/rurik.git

# remotely
ssh  opc@${rurik_server}
cd rurik
podman build -f ./docker/Dockerfile -t nodejs-rurik .
podman run -d --name rurik -p 0.0.0.0:8080:3000 -d localhost/nodejs-rurik:latest
podman ps
curl http://localhost:8080
exit

# locally
ssh -L 127.0.0.1:8080:127.0.0.1:8080 opc@${rurik_server} -N
curl http://localhost:8080
# In a browser: http://localhost:8080
```
