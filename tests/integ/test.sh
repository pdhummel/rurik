#!/bin/bash
set -e

server=http://localhost:3000

echo "Creating game"
new_game_response=$(curl -X POST -H "Content-Type: application/json" \
--data '{"gameName": "Pauls Game"}' \
"${server}/game")
game_id=$(echo ${new_game_response} | jq -r '.id')

echo "First player joining"
curl -X POST -H "Content-Type: application/json" \
--data '{ "color": "blue", "name": "Paul", "position": "N" }' \
"${server}/game/${game_id}/player"

echo "Second player joining"
curl -X POST -H "Content-Type: application/json" \
--data '{ "color": "red", "name": "Glen", "position": "S" }' \
"${server}/game/${game_id}/player"

echo "Start the game"
curl -X PUT -H "Content-Type: application/json" \
"${server}/game/${game_id}"

echo "Choose the starting player"
curl -X PUT -H "Content-Type: application/json" \
"${server}/game/${game_id}/firstPlayer/blue"

echo "First player choose leader"
curl -X POST -H "Content-Type: application/json" \
--data '{ "leaderName": "Maria" }' \
"${server}/game/${game_id}/player/blue/leaders"

echo "Second player choose leader"
curl -X POST -H "Content-Type: application/json" \
--data '{ "leaderName": "Gleb" }' \
"${server}/game/${game_id}/player/red/leaders"

echo "Get first player's secret agenda"
secret_agenda_response=$(curl -H "Content-Type: application/json" \
"${server}/game/${game_id}/player/blue/secretAgenda")

first_secret_agenda=$(echo ${secret_agenda_response} | jq -r '.[0].name')

echo "Choose first player's secret agenda"
curl -X POST -H "Content-Type: application/json" \
--data '{ "cardName": "'${first_secret_agenda}'" }' \
"${server}/game/${game_id}/player/blue/secretAgenda"

echo "Get second player's secret agenda"
secret_agenda_response=$(curl -H "Content-Type: application/json" \
"${server}/game/${game_id}/player/red/secretAgenda")

first_secret_agenda=$(echo ${secret_agenda_response} | jq -r '.[0].name')

echo "Choose second player's secret agenda"
curl -X POST -H "Content-Type: application/json" \
--data '{ "cardName": "'${first_secret_agenda}'" }' \
"${server}/game/${game_id}/player/red/secretAgenda"


echo "First player place troop"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "blue" }' \
"${server}/game/${game_id}/location/Novgorod/troops"

echo "Second player place troop"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "red" }' \
"${server}/game/${game_id}/location/Polotsk/troops"

echo "First player place troop"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "blue" }' \
"${server}/game/${game_id}/location/Novgorod/troops"

echo "Second player place troop"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "red" }' \
"${server}/game/${game_id}/location/Polotsk/troops"

echo "First player place troop"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "blue" }' \
"${server}/game/${game_id}/location/Rostov/troops"

echo "Second player place troop"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "red" }' \
"${server}/game/${game_id}/location/Smolensk/troops"

echo "First player place leader"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "blue" }' \
"${server}/game/${game_id}/location/Rostov/leader"

echo "Second player place leader"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "red" }' \
"${server}/game/${game_id}/location/Smolensk/leader"


echo "First player advisor bid"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "blue", "advisor": "1"  }' \
"${server}/game/${game_id}/advisorBid/muster"

echo "Second player advisor bid"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "red", "advisor": "1"  }' \
"${server}/game/${game_id}/advisorBid/attack"

echo "First player advisor bid"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "blue", "advisor": "2"  }' \
"${server}/game/${game_id}/advisorBid/attack"

echo "Second player advisor bid"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "red", "advisor": "2"  }' \
"${server}/game/${game_id}/advisorBid/tax"

echo "First player advisor bid"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "blue", "advisor": "4"  }' \
"${server}/game/${game_id}/advisorBid/tax"

echo "Second player advisor bid"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "red", "advisor": "4"  }' \
"${server}/game/${game_id}/advisorBid/build"

echo "First player advisor bid"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "blue", "advisor": "5"  }' \
"${server}/game/${game_id}/advisorBid/build"

echo "Second player advisor bid"
curl -X PUT -H "Content-Type: application/json" \
--data '{ "color": "red", "advisor": "5"  }' \
"${server}/game/${game_id}/advisorBid/muster"


