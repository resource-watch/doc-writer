const nock = require('nock');
const chai = require('chai');
const chaiHttp = require('chai-http');
const config = require('config');

let requester;

chai.use(chaiHttp);

exports.getTestServer = function getTestServer() {
    if (requester) {
        return requester;
    }

    const elasticUri = config.get('elasticsearch.host');

    nock(elasticUri, { allowUnmocked: true });

    const server = require('../../../src/app');
    requester = chai.request(server).keepOpen();

    return requester;
};
