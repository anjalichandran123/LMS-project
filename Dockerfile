FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production  # Optional: Install only production dependencies

COPY . .

EXPOSE 8000

CMD ["npm", "start"]