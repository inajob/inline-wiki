FROM node
MAINTAINER ina

RUN mkdir /app
COPY ./ /app

EXPOSE 3000

WORKDIR /app

CMD ["npm", "start"]
