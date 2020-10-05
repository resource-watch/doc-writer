const logger = require('logger');
const { Client } = require('@elastic/elasticsearch');
const config = require('config');
const ElasticError = require('errors/elastic.error');
const crypto = require('crypto');
const sleep = require('sleep');

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

        this.elasticClient = new Client(elasticSearchConfig);

        let retries = 10;

        const pingES = () => {
            this.elasticClient.ping({}, (error) => {
                if (error) {
                    if (retries >= 0) {
                        retries--;
                        logger.error(`Elasticsearch cluster is down, attempt #${10 - retries} ... - ${error.message}`);
                        sleep.sleep(5);
                        pingES();
                    } else {
                        logger.error(`Elasticsearch cluster is down, baiging! - ${error.message}`);
                        logger.error(error);
                        throw new Error(error);
                    }
                } else {
                    setInterval(() => {
                        this.elasticClient.ping({}, (error) => {
                            if (error) {
                                logger.error(`Elasticsearch cluster is down! - ${error.message}`);
                                process.exit(1);
                            }
                        });
                    }, 3000);
                }
            });
        };

        pingES();
    }

    async saveBulk(index, data) {

        const exists = await new Promise((resolve, reject) => {
            logger.debug(`Checking if index ${index} exists`);
            this.elasticClient.indices.exists({ index }, (err, res) => {
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

            this.elasticClient.bulk({ body: data, timeout: '90s' }, (err, res) => {
                const hash = crypto.createHash('sha1').update(JSON.stringify(data)).digest('base64');
                const itemsResults = {};

                if (err) {
                    logger.error(err);
                    reject(new ElasticError(err));
                    return;
                }

                res.body.items.forEach((item) => {
                    if (item.index.result) {
                        if (!Object.prototype.hasOwnProperty.call(itemsResults, item.index.result)) {
                            itemsResults[item.index.result] = 0;
                        }
                        itemsResults[item.index.result] += 1;
                    } else if (item.index.error) {
                        if (!itemsResults.error) {
                            itemsResults.error = 0;
                        }
                        itemsResults.error += 1;
                    }
                });

                const detail = {
                    took: res.body.took,
                    errors: res.body.errors,
                    itemsResults,
                    itemsWithError: res.body.items.filter((item) => item.index.status >= 400)
                };

                resolve({
                    withErrors: res.body.errors || false,
                    detail,
                    hash
                });
            });
        });
    }

}

module.exports = new ElasticService();
