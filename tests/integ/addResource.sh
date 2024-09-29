#!/bin/bash
set -e

server=http://localhost:3000


SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
pushd ${SCRIPT_DIR} > /dev/null
source ./rest.sh
popd  > /dev/null


if [ $# -lt 3 ];then
  echo "$0 <gameId> <color> <resource>"
  exit 1
fi

game_id=$1
color=$2
resource=$3

rest "${server}/test/game/${game_id}/player/${color}/resource" PUT '{ "resource": "'${resource}'" }'

