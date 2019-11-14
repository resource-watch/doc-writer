const logger = require('logger');
const { Client } = require('@elastic/elasticsearch');
const config = require('config');
const ElasticError = require('errors/elastic.error');

const elasticUrl = config.get('elastic.url');

class ElasticService {

    constructor() {
        logger.info(`Connecting to Elasticsearch on http://${elasticUrl}`);
        this.client = new Client({
            node: `http://${elasticUrl}`,
            log: 'error'
        });
        setInterval(() => {
            this.client.ping({}, (error) => {
                if (error) {
                    logger.error('Elasticsearch cluster is down!');
                    process.exit(1);
                }
            });
        }, 3000);
    }

    async saveBulk(index, data) {

        const exists = await new Promise((resolve, reject) => {
            logger.debug(`Checking if index ${index} exists`);
            this.client.indices.exists({ index }, (err, res) => {
                logger.info('Response', res);
                if (err) {
                    logger.error(err);
                    reject(err);
                    return;
                }
                resolve(res);
            });
        });
        if (!exists) {
            logger.error(`Index ${index} does not exist`);
            return false;
        }
        return new Promise((resolve, reject) => {
            logger.debug('Sending data to Elasticsearch');
            this.client.bulk({ body: data }, (err, res) => {
                if (err) {
                    logger.error(err);
                    reject(new ElasticError(err));
                    return;
                }

                let itemWithError = null;
                if (res.errors) {
                    itemWithError = res.items.find(item => item && item.index && item.index.status === 400);
                }
                resolve({
                    withErrors: res.errors || false,
                    detail: itemWithError ? JSON.stringify(itemWithError.index.error) : ''
                });
            });
        });
    }

}

module.exports = new ElasticService();
