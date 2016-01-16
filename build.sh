#!/bin/sh

project=${PWD##*/}
port=8001

if [ ! -z "$1" ];
    then
        project=$1
fi

if [ ! -z "$2" ];
    then
        port=$2
fi

docker stop $project
docker rm $project
docker build -t $project .
docker run -d --name $project -p $port:80 $project
