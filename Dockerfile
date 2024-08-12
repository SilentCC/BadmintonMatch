FROM node:18.20.4-alpine

# Create app directory
WORKDIR /app

# install pnpm and deps
RUN npm install -g pnpm
RUN pnpm install

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "pnpm", "dx" ]
