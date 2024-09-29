# rurik
WIP - nodejs, javascript, 
and html for "Rurik: Dawn of Kiev" game.
The ruleset is fixed as a hybrid of Stone and Blade with taverns and stables.  
The AI players follow the same ruleset as the human players; the AI does not play like the solo mode. 
The AI is very weak, but can be useful for adding variety for 1v1 with human players.
The AI is also useful as an opponent when someone is first learning the game.  
The game is incomplete, but playable. Please review the TODOs for game-play gaps and features that are missing. 

## Roadmap
Ultimately this project was built so I could play Rurik against some competant AI opponents. So while rule and gameplay features may be important, I mostly want to get a challenging Rurik-like experience when there are no humans around who want to play.

### TODOs

* Miscellaneous
  * add leader special abilities - 4 of 11
  * fix deed card bonuses - scheme2cards, attackMinusScheme, moveAnywhere
  * retrieveAdvisor - for a player, handle 2 advisors with the same number in the same column
  * add version info
  * show upcoming advisors on map board
  * add support for scheme card option for building a tavern

* AI
  * ai bid money
  * ai build adjacency
  * ai complete deed cards - 24 out of 32 supported
  * ai conversion token
  * try and compare candidate moves and pick the best

* Game management
  * save game state
  * undo action/turn
    * don't allow undo if cards are drawn
  * save game
  * load game

* Table/game setup
  * join game -- only show available positions in dropdown
  * join game -- only show available colors in dropdown  

* hack mode
  * remove resource from anywhere
  * refresh resource anywhere
  * remove leader from anywhere
  * place leader in supply to anywhere
  * remove building from anywhere
  * place building from supply to anywhere
  * take scheme card from deck
  * set round
  * set current player
  * scheme
  * remove advisor
  * place advisor
  * switch human player to AI
  * switch AI player to human

### Known Bugs not in TODOs
* Claim board not displaying region-rule points for all players.
* Could not play conversion token using 2 tradeboon resources.
* Get rid of scroll bar on modal windows. Appears when dragging.

## Build and Deploy
### Local setup with nodejs
```
# assume nodejs + npm is installed
cd rurik
npm install
# optionally, build binary
npm run build
# run from source
nodejs ./src/routes/server.js
# In a browser: http://localhost:3000
```

### Local binary
```
# download binary from github or locally build binary as above
./rurik-server-linux
# In a browser: http://localhost:3000
```

### Local setup with docker
```
# assume docker is installed and running
docker kill rurik
docker rm rurik
docker build -f ./docker/Dockerfile -t nodejs-rurik .
docker run -d --name rurik -p 3000:3000 -d nodejs-rurik
#docker exec -it  rurik bash
# In a browser: http://localhost:3000
```


### Server setup with podman on RedHat flavored linux
```
rurik_server=<ip>
# remote onetime setup
ssh  ${rurik_server}
sudo su -
# setup ~/.ssh/id_rsa and ~/.ssh/id_rsa.pub
dnf install podman
dnf install git
exit # sudo

# remotely
ssh  ${rurik_server}
git clone git@github.com:pdhummel/rurik.git
cd rurik
podman build -f ./docker/Dockerfile -t nodejs-rurik .
podman run -d --name rurik -p 0.0.0.0:8080:3000 -d localhost/nodejs-rurik:latest
podman ps
curl http://localhost:8080
exit

# locally
# setup an ssh tunnel to the server
ssh -L 127.0.0.1:8080:127.0.0.1:8080 ${rurik_server} -N
curl http://localhost:8080
# In a browser: http://localhost:8080
```

