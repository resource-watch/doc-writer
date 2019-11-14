FROM node:12-alpine
MAINTAINER info@vizzuality.com

ENV NAME doc-writer
ENV USER doc-writer

RUN apk update && apk upgrade && \
    apk add --no-cache --update bash git openssh python alpine-sdk

RUN addgroup $USER && adduser -s /bin/bash -D -G $USER $USER

RUN yarn global add bunyan  grunt-cli

RUN mkdir -p /opt/$NAME
COPY package.json /opt/$NAME/package.json
RUN cd /opt/$NAME && yarn install

COPY entrypoint.sh /opt/$NAME/entrypoint.sh
COPY config /opt/$NAME/config

WORKDIR /opt/$NAME

COPY ./app /opt/$NAME/app
RUN yarn update doc-importer-messages
RUN chown $USER:$USER /opt/$NAME

EXPOSE 7400
USER $USER

ENTRYPOINT ["./entrypoint.sh"]
