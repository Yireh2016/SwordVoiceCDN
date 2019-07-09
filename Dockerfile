FROM node:8-alpine

RUN mkdir -p /app
COPY . /app
WORKDIR /app

RUN npm install

EXPOSE 3000
CMD npm run start