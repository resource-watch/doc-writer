const logger = require('logger');
const config = require('config');
const amqp = require('amqplib');
const writerService = require('services/writer.service');
const ElasticError = require('errors/elastic.error');

const {
    DATA_QUEUE
} = require('app.constants');


class DataQueueService {

    constructor() {
        logger.info(`Connecting to queue ${DATA_QUEUE}`);
        try {
            this.init().then(() => {
                logger.info('Connected');
            }, (err) => {
                logger.error(err);
                process.exit(1);
            });
        } catch (err) {
            logger.error(err);
        }
    }

    async init() {
        const conn = await amqp.connect(config.get('rabbitmq.url'));
        this.channel = await conn.createConfirmChannel();
        const q = DATA_QUEUE;
        this.channel.assertQueue(q, {
            durable: true
        });
        this.channel.prefetch(1);
        logger.info(` [*] Waiting for messages in ${q}`);
        this.channel.consume(q, this.consume.bind(this), {
            noAck: false,

        });
    }

    async consume(msg) {
        try {
            logger.debug('Message received');
            const message = JSON.parse(msg.content.toString());
            
            await writerService.processMessage(message);
            this.channel.ack(msg);
            logger.info('Message processed successfully');
        } catch (err) {
            logger.error(err);
            if (err instanceof ElasticError) {
                logger.error('Error processing message', err);
                this.channel.nack(msg);
                return;
            }
            const retries = msg.fields.deliveryTag;
            if (retries < 10) {
                this.channel.nack(msg);
            } else {
                this.channel.ack(msg);
            }
        }

    }

}

module.exports = new DataQueueService();
