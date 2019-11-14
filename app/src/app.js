const logger = require('logger');
const Koa = require('koa');
const koaSimpleHealthCheck = require('koa-simple-healthcheck');

logger.debug('Initializing doc-writer');
require('services/data-queue.service');
require('services/status-queue.service');

const app = new Koa();

app.use(koaSimpleHealthCheck());

const server = app.listen(process.env.PORT);

module.exports = server;
