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

    async saveBulk(data) {
        return new Promise((resolve, reject) => {
            logger.debug('Sending data in elastic');
            this.client.bulk({ body: data }, function (err, res) {
                if (err) {
                    reject(new ElasticError(err));
                    return;
                }
                resolve(res);
            });
        });
    }

}

module.exports = new ElasticService();
