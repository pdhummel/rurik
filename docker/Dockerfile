FROM ubuntu:latest

USER root

RUN apt-get update
RUN apt-get -y install curl gnupg
RUN apt install -y nodejs
RUN apt install -y npm

RUN mkdir -p /home/app/rurik/src
RUN mkdir -p /home/app/rurik/public
RUN mkdir -p /home/app/rurik/views
COPY package.json /home/app/rurik
ADD ./src /home/app/rurik/src
ADD ./public /home/app/rurik/public
ADD ./views /home/app/rurik/views
WORKDIR /home/app/rurik
RUN npm install
CMD node ./src/routes/server.js

