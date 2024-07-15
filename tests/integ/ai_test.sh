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



echo "Creating game"
new_game_response=$(rest "${server}/game" POST '{"gameName": "AI Game"}')
game_id=$(echo ${new_game_response} | jq -r '.id')


echo "First player joining"
r=$(rest "${server}/game/${game_id}/player" POST '{ "color": "blue", "name": "Paul", "position": "N", "isAi": true }')

echo "Second player joining"
r=$(rest "${server}/game/${game_id}/player" POST '{ "color": "red", "name": "Glen", "position": "S", "isAi": true }')

echo "Start the game"
r=$(rest "${server}/game/${game_id}" PUT)

echo "Choose the starting player"
r=$(rest "${server}/game/${game_id}/firstPlayer/blue" PUT)



echo "Dump game"
echo ${game_id}
r=$(rest "${server}/test/game/${game_id}/dump" GET)
echo $r


