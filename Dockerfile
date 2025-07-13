FROM node:22.16.0

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY ./src ./src

EXPOSE 8085

CMD ["npm","start"]