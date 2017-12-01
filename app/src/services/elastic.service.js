const logger = require('logger');
const elasticsearch = require('elasticsearch');
const config = require('config');
const ElasticError = require('errors/elastic.error');

const elasticUrl = config.get('elastic.url');

class ElasticService {

    constructor() {
        this.client = new elasticsearch.Client({
            host: elasticUrl,
            log: 'error'
        });
        setInterval(() => {
            // logger.debug('Doing ping to elastic');
            this.client.ping({
                // ping usually has a 3000ms timeout
                requestTimeout: 10000
            }, function (error) {
                if (error) {
                    logger.error('elasticsearch cluster is down!');
                    process.exit(1);
                }
            });
        }, 3000);
    }

    async saveBulk(index, data) {
        
        const exists = await new Promise((resolve, reject) => {
            logger.debug('Checking if exist index');
            this.client.indices.exists({ index }, function (err, res) {
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
            logger.error('Index not exists');
            return false;
        }
        return new Promise((resolve, reject) => {
            logger.debug('Sending data in elastic');
            this.client.bulk({ body: data }, function (err, res) {
                if (err) {
                    logger.error(err);
                    reject(new ElasticError(err));
                    return;
                }
                resolve(true);
            });
        });
    }

}

module.exports = new ElasticService();
