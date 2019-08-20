FROM node:chakracore-10.13.0

RUN mkdir -p /app
COPY . /app
WORKDIR /app




RUN npm install

EXPOSE 3000
CMD npm run start