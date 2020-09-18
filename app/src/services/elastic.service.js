const logger = require('logger');
const { Client } = require('@elastic/elasticsearch');
const config = require('config');
const ElasticError = require('errors/elastic.error');
const crypto = require('crypto');

const elasticUrl = config.get('elasticsearch.host');

class ElasticService {

    constructor() {
        logger.info(`Connecting to Elasticsearch at ${elasticUrl}`);

        const elasticSearchConfig = {
            node: elasticUrl
        };

        if (config.get('elasticsearch.user') && config.get('elasticsearch.password')) {
            elasticSearchConfig.auth = {
                username: config.get('elasticsearch.user'),
                password: config.get('elasticsearch.password')
            };
        }

        this.client = new Client(elasticSearchConfig);

        setInterval(() => {
            this.client.ping({}, (error) => {
                if (error) {
                    logger.error(error);
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
                logger.debug('Response', res);
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
            this.client.bulk({ body: data, timeout: '90s' }, (err, res) => {
                let detail;
                const hash = crypto.createHash('sha1').update(JSON.stringify(data)).digest('base64');
                const itemsResults = {};

                if (err) {
                    logger.error(err);
                    logger.debug(data);
                    reject(new ElasticError(err));
                    return;
                }

                let itemWithError = null;
                if (res.errors) {
                    itemWithError = res.items.find(item => item && item.index && item.index.status === 400);
                    detail = JSON.stringify(itemWithError.index.error);
                } else {
                    res.body.items.forEach((item) => {
                        if (!Object.prototype.hasOwnProperty.call(itemsResults, item.index.result)) {
                            itemsResults[item.index.result] = 0;
                        }
                        itemsResults[item.index.result] += 1;
                    });

                    detail = {
                        took: res.body.took,
                        errors: res.body.errors,
                        itemsResults,
                        itemsWithError: res.body.items.filter(item => item.index.status >= 400)
                    };
                }

                resolve({
                    withErrors: res.errors || false,
                    detail,
                    hash
                });
            });
        });
    }

}

module.exports = new ElasticService();
