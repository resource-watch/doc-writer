const logger = require('logger');
const QueueService = require('services/queue.service');
const writerService = require('services/writer.service');
const ElasticError = require('errors/elastic.error');
const config = require('config');


class DataQueueService extends QueueService {

    constructor() {
        super(config.get('queues.data'), true);
    }

    async consume(msg) {
        try {
            logger.debug('Message received');
            const message = JSON.parse(msg.content.toString());
            await writerService.processMessage(message);
            this.channel.ack(msg);
            logger.info('Message processed successfully');
        } catch (err) {
            // Accept the message
            this.channel.ack(msg);
            // check if ElasticError
            // in these cases we do not count
            if (err instanceof ElasticError) {
                this.returnMsg(msg);
            } else {
                const retries = msg.properties.headers['x-redelivered-count'] || 0;
                if (retries < 10) {
                    this.returnMsg(msg);
                }
            }
        }
    }

}

module.exports = new DataQueueService();
