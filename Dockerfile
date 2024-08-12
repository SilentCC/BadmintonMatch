FROM node:18.20.4-alpine

# Create app directory
WORKDIR /app

# Bundle app source
COPY . .

# install pnpm and deps
RUN npm install -g pnpm
RUN pnpm install

EXPOSE 8181
CMD [ "pnpm", "dx" ]
