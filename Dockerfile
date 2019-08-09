FROM node:10

WORKDIR /blog-service
COPY package*.json /blog-service/
RUN npm install
COPY . /blog-service
EXPOSE 4000
CMD npm start
