const logger = require('logger');

logger.debug('Initializing doc-writer');
require('services/data-queue.service');
require('services/status-queue.service');
