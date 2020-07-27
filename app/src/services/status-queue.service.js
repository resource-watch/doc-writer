const logger = require('logger');
const config = require('config');
const sleep = require('sleep');
const amqp = require('amqplib');
const docImporter = require('rw-doc-importer-messages');

let retries = 10;

class StatusQueueService {

    constructor() {
        logger.info(`Connecting to queue ${config.get('queues.status')}`);
        try {
            this.init().then(() => {
                logger.info('Connected');
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
    }

    async sendMessage(msg) {
        return new Promise((resolve, reject) => {
            let numTries = 0;
            const interval = setInterval(async () => {
                try {
                    numTries += 1;
                    logger.info('Sending message', msg);
                    await this.channel.assertQueue(config.get('queues.status'), {
                        durable: true
                    });
                    this.channel.sendToQueue(config.get('queues.status'), Buffer.from(JSON.stringify(msg)));
                    clearInterval(interval);
                    resolve();
                } catch (err) {
                    logger.error('Error sending message (try again in 2 second)', err);
                    if (numTries > 3) {
                        clearInterval(interval);
                        reject(err);
                    }
                }
            }, 2000);
        });
    }

    async sendWriteCorrect(taskId, index, withErrors, detail, hash, file) {
        logger.debug('Sending write correct message of taskId', taskId, index, withErrors, detail, hash, file);
        await this.sendMessage(docImporter.status.createMessage(docImporter.status.MESSAGE_TYPES.STATUS_WRITTEN_DATA, {
            taskId,
            index,
            withErrors,
            detail,
            hash,
            file
        }));
    }

}

module.exports = new StatusQueueService();
