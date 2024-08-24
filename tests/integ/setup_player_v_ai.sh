#!/bin/bash
set -e

server=http://localhost:3000

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
pushd ${SCRIPT_DIR} > /dev/null
source ./rest.sh
popd  > /dev/null

wait_for_state() {
  desiredPlayer=$1
  desiredState=$2
  count=0
  currentState=nothing
  while [ "${currentState}" != "${desiredState}" ] && [ "${currentPlayer}" != "${desiredPlayer}" ] && [ ${count} -lt 10 ];do
    sleep 1
    r=$(rest "${server}/gameStatus/${game_id}" GET)
    currentState=$(echo ${r} | jq -r '.currentState' | tr -d '\n')
    currentPlayer=$(echo ${r} | jq -r '.currentPlayer' | tr -d '\n')
    count=$((count + 1))
  done
  if [ "${currentState}" != "${desiredState}" ] && [ "${currentPlayer}" != "${desiredPlayer}" ];then
    echo "Game ${game_id} appears to have a problem"
    echo "Dump game"
    echo ${game_id}
    r=$(rest "${server}/test/game/${game_id}/dump" GET)
    echo $r
    echo "Game ${game_id} appears to have a problem"
    exit 1
  fi
}

echo "Creating game"
new_game_response=$(rest "${server}/game" POST '{"owner": "Paul", "gameName": "Interactive Game"}')
game_id=$(echo ${new_game_response} | jq -r '.id')


echo "First player joining"
r=$(rest "${server}/game/${game_id}/player" POST '{ "color": "yellow", "name": "Paul", "position": "N", "isAi": false }')

echo "Second player joining"
r=$(rest "${server}/game/${game_id}/player" POST '{ "color": "red", "name": "ai1", "position": "E", "isAi": true }')

r=$(rest "${server}/game/${game_id}/player" POST '{ "color": "blue", "name": "ai2", "position": "W", "isAi": true }')

r=$(rest "${server}/game/${game_id}/player" POST '{ "color": "white", "name": "ai3", "position": "S", "isAi": true }')

echo "Start the game"
r=$(rest "${server}/game/${game_id}" PUT)

echo "Choose the starting player"
r=$(rest "${server}/game/${game_id}/firstPlayer/yellow" PUT)

echo "First player choose leader"
r=$(rest "${server}/game/${game_id}/player/yellow/leaders" POST '{ "leaderName": "Maria" }')

echo "Waiting to pick secret agenda"
wait_for_state yellow waitingForSecretAgendaSelection
r=$(rest "${server}/game/${game_id}/player/yellow/secretAgenda" GET)
secret_agenda_response=${r}
first_secret_agenda=$(echo ${secret_agenda_response} | jq -r '.[0].name')
echo "Choose first player's secret agenda"
r=$(rest "${server}/game/${game_id}/player/yellow/secretAgenda" POST '{ "cardName": "'${first_secret_agenda}'" }')

echo "Waiting to place troop"
wait_for_state yellow waitingForTroopPlacement
r=$(rest "${server}/game/${game_id}/location/Smolensk/troops" PUT '{ "color": "yellow" }')
echo "Waiting to place troop"
wait_for_state yellow waitingForTroopPlacement
r=$(rest "${server}/game/${game_id}/location/Chernigov/troops" PUT '{ "color": "yellow" }')
echo "Waiting to place troop"
wait_for_state yellow waitingForTroopPlacement
r=$(rest "${server}/game/${game_id}/location/Polotsk/troops" PUT '{ "color": "yellow" }')
echo "Waiting to place leader"
wait_for_state yellow waitingForLeaderPlacement
r=$(rest "${server}/game/${game_id}/location/Smolensk/leader" PUT '{ "color": "yellow" }')

echo "Dump game"
echo ${game_id}
r=$(rest "${server}/test/game/${game_id}/dump" GET)
echo $r


