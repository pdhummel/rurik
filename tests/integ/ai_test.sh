#!/bin/bash
set -e

server=http://localhost:3000
#server=http://localhost:8080
#server=https://real-parts-run.loca.lt/
#server=https://c409-174-87-173-45.ngrok-free.app

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
pushd ${SCRIPT_DIR} > /dev/null
source ./rest.sh
popd  > /dev/null

#echo "Creating game"
new_game_response=$(rest "${server}/game" POST '{"owner": "AI-blue", "gameName": "AI Game"}')
game_id=$(echo ${new_game_response} | jq -r '.id')
echo "Created game ${game_id}"

#echo "First player joining"
r=$(rest "${server}/game/${game_id}/player" POST '{ "color": "blue", "name": "p1", "position": "N", "isAi": true }')

#echo "Second player joining"
r=$(rest "${server}/game/${game_id}/player" POST '{ "color": "red", "name": "p2", "position": "E", "isAi": true }')

r=$(rest "${server}/game/${game_id}/player" POST '{ "color": "yellow", "name": "p3", "position": "S", "isAi": true }')

r=$(rest "${server}/game/${game_id}/player" POST '{ "color": "white", "name": "p4", "position": "W", "isAi": true }')

#echo "Start the game"
r=$(rest "${server}/game/${game_id}" PUT)

#echo "Choose the starting player"
r=$(rest "${server}/game/${game_id}/firstPlayer/blue" PUT)


count=0
currentState=nothing
while [ "${currentState}" != "endGame" ] && [ ${count} -lt 10 ];do
  sleep 10
  r=$(rest "${server}/gameStatus/${game_id}" GET)
  currentState=$(echo ${r} | jq -r '.currentState' | tr -d '\n')
  count=$((count + 1))
done
if [ "${currentState}" != "endGame" ];then
  echo "Game ${game_id} appears to have a problem"

  echo "Dump game"
  echo ${game_id}
  r=$(rest "${server}/test/game/${game_id}/dump" GET)
  echo $r

  echo "Game ${game_id} appears to have a problem"
  exit 1
else
  echo "Game ${game_id} completed"
  r=$(rest "${server}/test/game/${game_id}" DELETE)
fi


