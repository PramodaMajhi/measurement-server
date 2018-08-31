FROM node:alpine
WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY ./src ./src
CMD ["npm", "run", "start"]
EXPOSE 80
