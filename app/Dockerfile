FROM node:14.16.1-alpine3.12

ENV CI=true

WORKDIR /app

COPY package.json ./

RUN npm install

COPY ./ ./

# CMD [ "npm", "run", "start:prod" ]
CMD [ "npm", "start" ]