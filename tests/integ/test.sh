#!/bin/bash
set -e

server=http://localhost:3000

move_or_scheme=scheme

rest() {
  url=$1
  method=$2
  data=$3
  if [ "${data}" != "" ];then
    r=$(curl -s -X ${method} -w ";%{http_code}" -H "Content-Type: application/json" \
      --data "${data}" "${url}")
  else
    r=$(curl -s -X ${method} -w ";%{http_code}" -H "Content-Type: application/json" "${url}")    
  fi
  set +e
  response=$(echo ${r} |  cut -d ";" -f 1)
  http_code=$(echo ${r} |  cut -d ";" -f 2 | cut -c1)
  echo ${response} | jq
  rc=$?
  if [ ${rc} -ne 0 ] || [ "${http_code}" != "2" ];then
    set -x
    if [ "${data}" != "" ];then
      echo curl -s -X ${method} -H \""Content-Type: application/json"\" --data \'"${data}"\' \""${url}"\"
    else
      echo curl -s -X ${method} -H \""Content-Type: application/json"\" \""${url}"\"
    fi
    echo ${response}
    set -e
    echo ${response} | jq
    exit 1

  fi
  set -e
}


#r=$(rest "${server}/game/1/testLoad" PUT)
#echo $r
#exit 0


echo "Creating game"
new_game_response=$(rest "${server}/game" POST '{"owner": "Paul", "gameName": "Pauls Game"}')
game_id=$(echo ${new_game_response} | jq -r '.id')


echo "First player joining"
r=$(rest "${server}/game/${game_id}/player" POST '{ "color": "blue", "name": "Paul", "position": "N" }')

echo "Second player joining"
r=$(rest "${server}/game/${game_id}/player" POST '{ "color": "red", "name": "Glen", "position": "S" }')

echo "Start the game"
r=$(rest "${server}/game/${game_id}" PUT)

echo "Choose the starting player"
r=$(rest "${server}/game/${game_id}/firstPlayer/blue" PUT)

echo "First player choose leader"
r=$(rest "${server}/game/${game_id}/player/blue/leaders" POST '{ "leaderName": "Maria" }')

echo "Second player choose leader"
r=$(rest "${server}/game/${game_id}/player/red/leaders" POST '{ "leaderName": "Gleb" }')

echo "Get first player's secret agenda"
r=$(rest "${server}/game/${game_id}/player/blue/secretAgenda" GET)
secret_agenda_response=${r}
first_secret_agenda=$(echo ${secret_agenda_response} | jq -r '.[0].name')

echo "Choose first player's secret agenda"
r=$(rest "${server}/game/${game_id}/player/blue/secretAgenda" POST '{ "cardName": "'${first_secret_agenda}'" }')

echo "Get second player's secret agenda"
r=$(rest "${server}/game/${game_id}/player/red/secretAgenda" GET)
secret_agenda_response=${r}
first_secret_agenda=$(echo ${secret_agenda_response} | jq -r '.[0].name')

echo "Choose second player's secret agenda"
r=$(rest "${server}/game/${game_id}/player/red/secretAgenda" POST '{ "cardName": "'${first_secret_agenda}'" }')

echo "First player place troop"
r=$(rest "${server}/game/${game_id}/location/Novgorod/troops" PUT '{ "color": "blue" }')

echo "Second player place troop"
r=$(rest "${server}/game/${game_id}/location/Polotsk/troops" PUT '{ "color": "red" }')

echo "First player place troop"
r=$(rest "${server}/game/${game_id}/location/Novgorod/troops" PUT '{ "color": "blue" }')

echo "Second player place troop"
r=$(rest "${server}/game/${game_id}/location/Polotsk/troops" PUT '{ "color": "red" }')

echo "First player place troop"
r=$(rest "${server}/game/${game_id}/location/Rostov/troops" PUT '{ "color": "blue" }')

echo "Second player place troop"
r=$(rest "${server}/game/${game_id}/location/Rostov/troops" PUT '{ "color": "red" }')

echo "First player place leader"
r=$(rest "${server}/game/${game_id}/location/Rostov/leader" PUT '{ "color": "blue" }')

echo "Second player place leader"
r=$(rest "${server}/game/${game_id}/location/Smolensk/leader" PUT '{ "color": "red" }')

#exit 0

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/muster" PUT '{ "color": "blue", "advisor": "1"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/${move_or_scheme}" PUT '{ "color": "red", "advisor": "1"  }')

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/attack" PUT '{ "color": "blue", "advisor": "2"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/tax" PUT '{ "color": "red", "advisor": "2"  }')

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/tax" PUT '{ "color": "blue", "advisor": "4"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/build" PUT '{ "color": "red", "advisor": "4"  }')

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/build" PUT '{ "color": "blue", "advisor": "5"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/muster" PUT '{ "color": "red", "advisor": "5"  }')

echo "First player retrieve advisor"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/muster" PUT '{ "color": "blue", "advisor": "1", "forfeitAction": "N", "row": 2  }')

echo "First player select muster action"
r=$(rest "${server}/game/${game_id}/player/blue/turn" PUT '{ "action": "musterAction" }')

echo "First player muster troops"
r=$(rest "${server}/game/${game_id}/location/Novgorod/troops" PUT '{ "color": "blue", "numberOfTroops": 2  }')

echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

if [ "${move_or_scheme}" = "move" ];then
  echo "Second player retrieve advisor"
  r=$(rest "${server}/game/${game_id}/advisorRetrieve/move" PUT '{ "color": "red", "advisor": "1", "forfeitAction": "N", "row": 1  }')

  echo "Second player select move action"
  r=$(rest "${server}/game/${game_id}/player/red/turn" PUT '{ "action": "moveAction"  }')

  echo "Second player move troops"
  r=$(rest "${server}/game/${game_id}/player/red/move" PUT '{ "fromLocationName": "Smolensk", "toLocationName": "Polotsk", "moveLeaderYN": "Y" }')

  echo "Second player select move action"
  r=$(rest "${server}/game/${game_id}/player/red/turn" PUT '{ "action": "moveAction"  }')

  echo "Second player move troops"
  r=$(rest "${server}/game/${game_id}/player/red/move" PUT '{ "fromLocationName": "Polotsk", "toLocationName": "Novgorod", "moveLeaderYN": "N" }')

  echo "Second player select move action"
  r=$(rest "${server}/game/${game_id}/player/red/turn" PUT '{ "action": "moveAction"  }')

  echo "Second player move troops"
  r=$(rest "${server}/game/${game_id}/player/red/move" PUT '{ "fromLocationName": "Novgorod", "toLocationName": "Rostov", "moveLeaderYN": "N" }')
fi

if [ "${move_or_scheme}" = "scheme" ];then
  echo "Second player retrieve advisor"
  r=$(rest "${server}/game/${game_id}/advisorRetrieve/scheme" PUT '{ "color": "red", "advisor": "1", "forfeitAction": "N", "row": 1  }')

  echo "Second player assign first player"
  r=$(rest "${server}/game/${game_id}/player/red/schemeFirstPlayer" PUT '{ "firstPlayerColor": "blue" }')

  echo "Second player choose scheme deck"
  r=$(rest "${server}/game/${game_id}/player/red/drawSchemeCards" PUT '{ "schemeDeck": 2  }')

  echo "Second player get player data"
  r=$(rest "${server}/game/${game_id}/player/red" GET)
  player=${r}
  scheme_card1=$(echo $player | jq -r '.temporarySchemeCards[0].id')
  scheme_card2=$(echo $player | jq -r '.temporarySchemeCards[1].id')

  #exit 0

  echo "Second player discard scheme card"
  r=$(rest "${server}/game/${game_id}/player/red/schemeCard" DELETE '{ "schemeCard": "'${scheme_card1}'"  }')

  echo "Second player discard scheme card"
  r=$(rest "${server}/game/${game_id}/player/red/schemeCard" DELETE '{ "schemeCard": "'${scheme_card2}'"  }')
fi

echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)

echo "First player retrieve advisor"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/attack" PUT '{ "color": "blue", "advisor": "2", "forfeitAction": "N", "row": 1  }')

echo "First player select attack action"
r=$(rest "${server}/game/${game_id}/player/blue/turn" PUT '{ "action": "attackAction"  }')

echo "First player attack action"
r=$(rest "${server}/game/${game_id}/player/blue/attack" POST '{ "attackLocationName": "Rostov", "target": "rebel"}')

echo "First player select attack action"
r=$(rest "${server}/game/${game_id}/player/blue/turn" PUT '{ "action": "attackAction"  }')

echo "First player attack action"
r=$(rest "${server}/game/${game_id}/player/blue/attack" POST '{ "attackLocationName": "Rostov", "target": "red", "schemeDeckNumber": 1 }')

echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)


echo "Second player retrieve advisor"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/tax" PUT '{ "color": "red", "advisor": "2", "forfeitAction": "N", "row": 2  }')

echo "Second player select tax action"
r=$(rest "${server}/game/${game_id}/player/red/turn" PUT '{ "action": "taxAction"  }')

echo "Second player tax action"
r=$(rest "${server}/game/${game_id}/player/red/tax" POST '{ "locationName": "Polotsk", "marketCoinYN": "N" }')

echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)


echo "First player retrieve advisor"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/tax" PUT '{ "color": "blue", "advisor": "4", "forfeitAction": "N", "row": 2  }')

echo "First player select tax action"
r=$(rest "${server}/game/${game_id}/player/blue/turn" PUT '{ "action": "taxAction"  }')

echo "First player tax action"
r=$(rest "${server}/game/${game_id}/player/blue/tax" POST '{ "locationName": "Novgorod", "marketCoinYN": "N" }')

echo "First player select tax action"
r=$(rest "${server}/game/${game_id}/player/blue/turn" PUT '{ "action": "taxAction"  }')

echo "First player tax action"
r=$(rest "${server}/game/${game_id}/player/blue/tax" POST '{ "locationName": "Rostov", "marketCoinYN": "N" }')

echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)



echo "Second player retrieve advisor"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/build" PUT '{ "color": "red", "advisor": "4", "forfeitAction": "N", "row": 2  }')

echo "Second player select build action"
r=$(rest "${server}/game/${game_id}/player/red/turn" PUT '{ "action": "buildAction"  }')

#exit 0

echo "Second player build action"
r=$(rest "${server}/game/${game_id}/player/red/build" POST '{ "locationName": "Polotsk", "building": "market" }')

echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)

echo "First player retrieve advisor"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/build" PUT '{ "color": "blue", "advisor": "5", "forfeitAction": "N", "row": 1  }')

echo "First player select build action"
r=$(rest "${server}/game/${game_id}/player/blue/turn" PUT '{ "action": "buildAction"  }')

echo "First player build action"
r=$(rest "${server}/game/${game_id}/player/blue/build" POST '{ "locationName": "Rostov", "building": "stronghold" }')

echo "First player select build action"
r=$(rest "${server}/game/${game_id}/player/blue/turn" PUT '{ "action": "buildAction"  }')

#exit 0

echo "First player build action"
r=$(rest "${server}/game/${game_id}/player/blue/build" POST '{ "locationName": "Novgorod", "building": "market" }')

#exit 0

echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

#exit 0

echo "Second player retrieve advisor"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/muster" PUT '{ "color": "red", "advisor": "5", "forfeitAction": "N", "row": 1  }')

echo "Second player select muster action"
r=$(rest "${server}/game/${game_id}/player/red/turn" PUT '{ "action": "musterAction"  }')

echo "Second player muster troops"
r=$(rest "${server}/game/${game_id}/location/Smolensk/troops" PUT '{ "color": "red", "numberOfTroops": 2  }')

echo "Second player select muster action"
r=$(rest "${server}/game/${game_id}/player/red/turn" PUT '{ "action": "musterAction"  }')

echo "Second player muster troops"
r=$(rest "${server}/game/${game_id}/location/Polotsk/troops" PUT '{ "color": "red", "numberOfTroops": 1  }')

echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)



echo "Get available deed cards"
r=$(rest "${server}/game/${game_id}/cards" GET)
deedCard0=$(echo $r | jq -r '.deedCards[0].name')
deedCard1=$(echo $r | jq -r '.deedCards[1].name')
deedCard2=$(echo $r | jq -r '.deedCards[2].name')


echo "First player choose deed card"
data='{ "deedCard": "'${deedCard0}'"  }'
echo $data
r=$(rest "${server}/game/${game_id}/player/blue/takeDeedCard" PUT "${data}")

echo "Second player choose deed card"
data='{ "deedCard": "'${deedCard1}'"  }'
echo $data
r=$(rest "${server}/game/${game_id}/player/red/takeDeedCard" PUT "${data}")

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/muster" PUT '{ "color": "blue", "advisor": "1"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/muster" PUT '{ "color": "red", "advisor": "1"  }')

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/tax" PUT '{ "color": "blue", "advisor": "2"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/tax" PUT '{ "color": "red", "advisor": "2"  }')

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/build" PUT '{ "color": "blue", "advisor": "4"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/build" PUT '{ "color": "red", "advisor": "4"  }')

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/move" PUT '{ "color": "blue", "advisor": "5"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/move" PUT '{ "color": "red", "advisor": "5"  }')


echo "First player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/muster" PUT '{ "color": "blue", "advisor": "1", "forfeitAction": "Y", "row": 1  }')
echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

echo "Second player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/muster" PUT '{ "color": "red", "advisor": "1", "forfeitAction": "Y", "row": 2  }')
echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)

echo "First player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/tax" PUT '{ "color": "blue", "advisor": "2", "forfeitAction": "Y", "row": 1  }')
echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

echo "Second player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/tax" PUT '{ "color": "red", "advisor": "2", "forfeitAction": "Y", "row": 2  }')
echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)

echo "First player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/build" PUT '{ "color": "blue", "advisor": "4", "forfeitAction": "Y", "row": 1  }')
echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

echo "Second player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/build" PUT '{ "color": "red", "advisor": "4", "forfeitAction": "Y", "row": 2  }')
echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)

echo "First player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/move" PUT '{ "color": "blue", "advisor": "5", "forfeitAction": "Y", "row": 1  }')
echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

echo "Second player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/move" PUT '{ "color": "red", "advisor": "5", "forfeitAction": "Y", "row": 2  }')
echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)



echo "Get available deed cards"
r=$(rest "${server}/game/${game_id}/cards" GET)
deedCard0=$(echo $r | jq -r '.deedCards[0].name')
deedCard1=$(echo $r | jq -r '.deedCards[1].name')
deedCard2=$(echo $r | jq -r '.deedCards[2].name')

echo "First player choose deed card"
data='{ "deedCard": "'${deedCard0}'"  }'
echo $data
r=$(rest "${server}/game/${game_id}/player/blue/takeDeedCard" PUT "${data}")

echo "Second player choose deed card"
data='{ "deedCard": "'${deedCard1}'"  }'
echo $data
r=$(rest "${server}/game/${game_id}/player/red/takeDeedCard" PUT "${data}")

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/muster" PUT '{ "color": "blue", "advisor": "1"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/muster" PUT '{ "color": "red", "advisor": "1"  }')

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/tax" PUT '{ "color": "blue", "advisor": "2"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/tax" PUT '{ "color": "red", "advisor": "2"  }')

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/attack" PUT '{ "color": "blue", "advisor": "2"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/attack" PUT '{ "color": "red", "advisor": "2"  }')

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/build" PUT '{ "color": "blue", "advisor": "4"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/build" PUT '{ "color": "red", "advisor": "4"  }')

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/move" PUT '{ "color": "blue", "advisor": "5"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/move" PUT '{ "color": "red", "advisor": "5"  }')

echo "First player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/muster" PUT '{ "color": "blue", "advisor": "1", "forfeitAction": "Y", "row": 1  }')
echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

echo "Second player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/muster" PUT '{ "color": "red", "advisor": "1", "forfeitAction": "Y", "row": 2  }')
echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)

echo "First player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/tax" PUT '{ "color": "blue", "advisor": "2", "forfeitAction": "Y", "row": 1  }')
echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

echo "Second player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/tax" PUT '{ "color": "red", "advisor": "2", "forfeitAction": "Y", "row": 2  }')
echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)

echo "First player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/attack" PUT '{ "color": "blue", "advisor": "2", "forfeitAction": "Y", "row": 1  }')
echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

echo "Second player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/attack" PUT '{ "color": "red", "advisor": "2", "forfeitAction": "Y", "row": 2  }')
echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)

echo "First player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/build" PUT '{ "color": "blue", "advisor": "4", "forfeitAction": "Y", "row": 1  }')
echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

echo "Second player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/build" PUT '{ "color": "red", "advisor": "4", "forfeitAction": "Y", "row": 2  }')
echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)

echo "First player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/move" PUT '{ "color": "blue", "advisor": "5", "forfeitAction": "Y", "row": 1  }')
echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

echo "Second player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/move" PUT '{ "color": "red", "advisor": "5", "forfeitAction": "Y", "row": 2  }')
echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)

echo "Get available deed cards"
r=$(rest "${server}/game/${game_id}/cards" GET)
deedCard0=$(echo $r | jq -r '.deedCards[0].name')
deedCard1=$(echo $r | jq -r '.deedCards[1].name')
deedCard2=$(echo $r | jq -r '.deedCards[2].name')

echo "First player choose deed card"
data='{ "deedCard": "'${deedCard0}'"  }'
echo $data
r=$(rest "${server}/game/${game_id}/player/blue/takeDeedCard" PUT "${data}")

echo "Second player choose deed card"
data='{ "deedCard": "'${deedCard1}'"  }'
echo $data
r=$(rest "${server}/game/${game_id}/player/red/takeDeedCard" PUT "${data}")


echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/muster" PUT '{ "color": "blue", "advisor": "1"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/muster" PUT '{ "color": "red", "advisor": "1"  }')

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/tax" PUT '{ "color": "blue", "advisor": "2"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/tax" PUT '{ "color": "red", "advisor": "2"  }')

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/attack" PUT '{ "color": "blue", "advisor": "2"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/attack" PUT '{ "color": "red", "advisor": "2"  }')

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/scheme" PUT '{ "color": "blue", "advisor": "3"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/scheme" PUT '{ "color": "red", "advisor": "3"  }')

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/build" PUT '{ "color": "blue", "advisor": "4"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/build" PUT '{ "color": "red", "advisor": "4"  }')

echo "First player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/move" PUT '{ "color": "blue", "advisor": "5"  }')

echo "Second player advisor bid"
r=$(rest "${server}/game/${game_id}/advisorBid/move" PUT '{ "color": "red", "advisor": "5"  }')


echo "First player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/muster" PUT '{ "color": "blue", "advisor": "1", "forfeitAction": "Y", "row": 1  }')
echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

echo "Second player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/muster" PUT '{ "color": "red", "advisor": "1", "forfeitAction": "Y", "row": 2  }')
echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)

echo "First player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/tax" PUT '{ "color": "blue", "advisor": "2", "forfeitAction": "Y", "row": 1  }')
echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

echo "Second player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/tax" PUT '{ "color": "red", "advisor": "2", "forfeitAction": "Y", "row": 2  }')
echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)

echo "First player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/attack" PUT '{ "color": "blue", "advisor": "2", "forfeitAction": "Y", "row": 1  }')
echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

echo "Second player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/attack" PUT '{ "color": "red", "advisor": "2", "forfeitAction": "Y", "row": 2  }')
echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)

echo "First player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/scheme" PUT '{ "color": "blue", "advisor": "3", "forfeitAction": "Y", "row": 1  }')
echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

echo "Second player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/scheme" PUT '{ "color": "red", "advisor": "3", "forfeitAction": "Y", "row": 2  }')
echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)

echo "First player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/build" PUT '{ "color": "blue", "advisor": "4", "forfeitAction": "Y", "row": 1  }')
echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

echo "Second player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/build" PUT '{ "color": "red", "advisor": "4", "forfeitAction": "Y", "row": 2  }')
echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)

echo "First player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/move" PUT '{ "color": "blue", "advisor": "5", "forfeitAction": "Y", "row": 1  }')
echo "First player end turn"
r=$(rest "${server}/game/${game_id}/player/blue/turn" DELETE)

#exit 0

echo "Second player retrieve advisor and forfeit action"
r=$(rest "${server}/game/${game_id}/advisorRetrieve/move" PUT '{ "color": "red", "advisor": "5", "forfeitAction": "Y", "row": 2  }')
echo "Second player end turn"
r=$(rest "${server}/game/${game_id}/player/red/turn" DELETE)


echo "Dump game"
echo ${game_id}
r=$(rest "${server}/test/game/${game_id}/dump" GET)
echo $r


