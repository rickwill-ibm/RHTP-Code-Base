FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY src ./src
COPY policies ./policies
EXPOSE 8083
CMD ["node", "src/index.mjs"]
