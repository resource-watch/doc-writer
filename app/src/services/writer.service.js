const logger = require('logger');
const elasticService = require('services/elastic.service');
const statusQueueService = require('services/status-queue.service');

class WriterService {

    static async processMessage(message) {
        logger.debug('Processing message of task', message.taskId);
        const response = await elasticService.saveBulk(message.index, message.data);
        if (response === false) {
            logger.debug('Not saved correctly');
            return;
        }
        await statusQueueService.sendWriteCorrect(message.taskId, message.index, response.withErrors, response.detail, response.hash, message.file);
    }

}

module.exports = WriterService;
