FROM node:8-alpine

RUN mkdir -p /app
COPY . /app
WORKDIR /app

EXPOSE 3000
CMD npm run start