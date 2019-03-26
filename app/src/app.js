const logger = require('logger');

// const nock = require('nock');
// nock.recorder.rec();

logger.debug('Initializing doc-writer');
require('services/data-queue.service');
require('services/status-queue.service');
