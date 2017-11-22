const logger = require('logger');
const elasticService = require('services/elastic.service');
const statusQueueService = require('services/status-queue.service');

class WriterService {

    static async processMessage(message) {
        logger.debug('Processing message of task', message.taskId);
        await elasticService.saveBulk(message.data);
        await statusQueueService.sendWriteCorrect(message.taskId);
    }

}

module.exports = WriterService;
