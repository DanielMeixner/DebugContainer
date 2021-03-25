FROM node
RUN mkdir -p /usr/src/app
COPY ./package.json /usr/src/app/
WORKDIR /usr/src/app
RUN npm install 

COPY ./*.js /usr/src/app/

RUN mkdir -p /usr/src/app/static
COPY ./static/* /usr/src/app/static/

RUN mkdir -p /usr/src/app/public
COPY ./public/* /usr/src/app/public/


EXPOSE 80
CMD [ "node", "server.js" ]
