FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm install && npm --prefix server install && npm --prefix client install
COPY . .
RUN npm --prefix client run build
ENV NODE_ENV=production
EXPOSE 10000
CMD ["npm","--prefix","server","start"]
