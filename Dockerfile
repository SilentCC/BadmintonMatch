FROM node:20.17.0-alpine

# Create app directory
WORKDIR /base

# Bundle app source
COPY . .

# install pnpm and deps
RUN npm install -g pnpm
RUN pnpm approve-builds --all
RUN pnpm install --config.auto-install-peers=true
RUN pnpm approve-builds --all

EXPOSE 3000
CMD ["sh", "-c", "pnpm build && pnpm start"]

