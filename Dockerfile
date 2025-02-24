FROM node:20.17.0-alpine

# Create app directory
WORKDIR /base

# Bundle app source
COPY . .

# install pnpm and deps
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm approve-builds

EXPOSE 3000
CMD ["sh", "-c", "pnpm build && pnpm start"]

