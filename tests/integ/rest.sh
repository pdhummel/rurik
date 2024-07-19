
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

