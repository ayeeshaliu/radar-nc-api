# Separate setup so the github auth token doesn't leak
FROM node:22 as setup
ARG NPM_TOKEN
WORKDIR /usr/src/app
COPY package*.json .npmrc ./
RUN echo "\n//npm.pkg.github.com/:_authToken=$NPM_TOKEN" >> .npmrc && npm ci && npm install -g typescript
COPY . .
RUN npm run build

FROM node:22-alpine
ARG PORT=80
ENV PORT=$PORT
WORKDIR /usr/src/app
COPY --from=setup /usr/src/app/dist .
COPY --from=setup /usr/src/app/node_modules ./node_modules
EXPOSE $PORT
ENTRYPOINT [ "node", "server.js" ]
