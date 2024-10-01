FROM node:18.20.4-alpine

# Create app directory
WORKDIR /base

# Bundle app source
COPY . .

# install pnpm and deps
RUN npm install -g pnpm
RUN pnpm install

EXPOSE 3000
CMD [ "pnpm", "dx" ]
