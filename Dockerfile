FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install -g @angular/cli@19.0.1

COPY . .

EXPOSE 4200


ARG ENVIRONMENT=production
ENV ENVIRONMENT=$ENVIRONMENT


COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
