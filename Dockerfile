# Build stage for Vite frontend & TypeScript
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine
WORKDIR /app

# Install Python3, git, bash for workspace script execution
RUN apk add --no-cache python3 git bash

COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled frontend dist and server source code
COPY --from=build /app/dist ./dist
COPY server ./server
COPY workspace ./workspace
COPY tsconfig.json ./

# Cloud Run sets PORT environment variable (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["node", "./node_modules/tsx/dist/cli.mjs", "server/index.ts"]
