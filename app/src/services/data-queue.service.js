const logger = require('logger');
const writerService = require('services/writer.service');
const ElasticError = require('errors/elastic.error');
const config = require('config');
const sleep = require('sleep');
const amqp = require('amqplib');

let retries = 10;

class DataQueueService {

    constructor() {
        logger.info(`Connecting to queue ${config.get('queues.data')}`);
        try {
            this.init().then(() => {
                logger.info('[Data Queue] Connected');
            }, (err) => {
                this.retryConnection(err);
            });
        } catch (err) {
            logger.error(err);
        }
    }

    retryConnection(err) {
        if (retries >= 0) {
            retries--;
            logger.error(`Failed to connect to RabbitMQ uri ${config.get('rabbitmq.url')} with error message "${err.message}", retrying...`);
            sleep.sleep(2);
            this.init().then(() => {
                logger.info('Connected');
            }, (initError) => {
                this.retryConnection(initError);
            });
        } else {
            logger.error(err);
            process.exit(1);
        }
    }

    async init() {
        const conn = await amqp.connect(config.get('rabbitmq.url'));
        this.channel = await conn.createConfirmChannel();
        await this.channel.assertQueue(config.get('queues.data'), { durable: true });
        this.channel.prefetch(1);
        logger.debug(` [*] Waiting for messages in ${config.get('queues.data')}`);
        this.channel.consume(this.q, this.consume.bind(this), {
            noAck: false
        });
    }

    async returnMsg(msg) {
        logger.debug(`Sending message to ${config.get('queues.data')}`);
        try {
            // Sending to queue
            let count = msg.properties.headers['x-redelivered-count'] || 0;
            count += 1;
            this.channel.sendToQueue(config.get('queues.data'), msg.content, { headers: { 'x-redelivered-count': count } });
        } catch (err) {
            logger.error(`Error sending message to ${config.get('queues.data')}`);
            throw err;
        }
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
