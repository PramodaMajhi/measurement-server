FROM node:alpine
WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY ./src ./src
COPY ./build ./build
CMD ["npm", "run", "start"]
EXPOSE 80
