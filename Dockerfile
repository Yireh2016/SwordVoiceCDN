FROM node:12.8.0-slim

RUN mkdir -p /app
COPY . /app
WORKDIR /app




RUN npm install

EXPOSE 3000
CMD npm run start