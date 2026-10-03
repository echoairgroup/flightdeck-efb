FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY client ./client
COPY server ./server
COPY index.html ./index.html
RUN npm run build
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/client/dist ./client/dist
COPY server ./server
EXPOSE 10000
CMD ["npm","start"]