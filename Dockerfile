FROM node:14.16.1-alpine3.12

ENV CI=true

ENV JWT_KEY=dhjhehrijdfnkerjonjdfbrieuoiojdjfiojdfmkdfd

ENV REDIS_HOST=localhost

WORKDIR /app

COPY package.json ./

RUN npm install

COPY ./ ./

# RUN yarn run build

CMD [ "yarn", "run", "start" ]