FROM node:9.1-alpine
MAINTAINER raul.requero@vizzuality.com

ENV NAME doc-writer
ENV USER doc-writer

RUN apk update && apk upgrade && \
    apk add --no-cache --update bash git openssh python alpine-sdk

RUN addgroup $USER && adduser -s /bin/bash -D -G $USER $USER

RUN npm install --unsafe-perm -g bunyan  grunt-cli

RUN mkdir -p /opt/$NAME
COPY package.json /opt/$NAME/package.json
RUN cd /opt/$NAME && npm install

COPY entrypoint.sh /opt/$NAME/entrypoint.sh
COPY config /opt/$NAME/config

WORKDIR /opt/$NAME

COPY ./app /opt/$NAME/app
RUN npm update doc-importer-messages
RUN chown $USER:$USER /opt/$NAME

USER $USER

ENTRYPOINT ["./entrypoint.sh"]
