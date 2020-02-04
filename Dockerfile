FROM node:8.2.0-alpine
RUN mkdir -p /usr/src/app
COPY ./package.json /usr/src/app/
WORKDIR /usr/src/app
RUN npm install 

COPY ./*.js /usr/src/app/

RUN mkdir -p /usr/src/app/public
COPY ./static.html /usr/src/app/public/



EXPOSE 80
CMD [ "node", "server.js" ]
