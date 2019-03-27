/* eslint-disable no-unused-vars,no-undef,no-await-in-loop */
const nock = require('nock');
const chai = require('chai');
const amqp = require('amqplib');
const config = require('config');
const RabbitMQConnectionError = require('errors/rabbitmq-connection.error');
const docImporterMessages = require('rw-doc-importer-messages');
const fs = require('fs');
const path = require('path');
const chaiMatch = require('chai-match');
const sleep = require('sleep');

const { getTestServer } = require('./test-server');

chai.use(chaiMatch);
const should = chai.should();

let requester;
let rabbitmqConnection = null;
let channel;

nock.disableNetConnect();
nock.enableNetConnect(process.env.HOST_IP);

describe('DATA handling process', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }

        let connectAttempts = 10;
        while (connectAttempts >= 0 && rabbitmqConnection === null) {
            try {
                rabbitmqConnection = await amqp.connect(config.get('rabbitmq.url'));
            } catch (err) {
                connectAttempts -= 1;
                await sleep.sleep(5);
            }
        }
        if (!rabbitmqConnection) {
            throw new RabbitMQConnectionError();
        }

        channel = await rabbitmqConnection.createConfirmChannel();
        await channel.assertQueue(config.get('queues.data'));

        channel = await rabbitmqConnection.createConfirmChannel();
        await channel.assertQueue(config.get('queues.status'));

        nock(`http://${process.env.ELASTIC_URL}`)
            .head('/')
            .reply(200);

        requester = await getTestServer();
    });

    beforeEach(async () => {
        await channel.purgeQueue(config.get('queues.data'));
        await channel.purgeQueue(config.get('queues.status'));

        const dataQueueStatus = await channel.checkQueue(config.get('queues.data'));
        dataQueueStatus.messageCount.should.equal(0);

        const statusQueueStatus = await channel.checkQueue(config.get('queues.status'));
        statusQueueStatus.messageCount.should.equal(0);
    });

    it('Consume a DATA message and create a new task and EXECUTION_CREATE message (happy case)', async () => {
        nock(`http://${process.env.ELASTIC_URL}`)
            .head('/index_e447128aa229430cbddef8c1adece5c2_1553581674433')
            .reply(200);

        nock(`http://${process.env.ELASTIC_URL}`)
            .post('/_bulk', fs.readFileSync(path.join(__dirname, 'elasticsearch-bulk.txt')).toString())
            .reply(200, {
                took: 73,
                errors: false,
                items: [{
                    index: {
                        _index: 'index_e447128aa229430cbddef8c1adece5c2_1553581674433',
                        _type: 'type',
                        _id: 'AWm5CkJ2BICarNiY1syu',
                        _version: 1,
                        result: 'created',
                        _shards: { total: 1, successful: 1, failed: 0 },
                        created: true,
                        status: 201
                    }
                }, {
                    index: {
                        _index: 'index_e447128aa229430cbddef8c1adece5c2_1553581674433',
                        _type: 'type',
                        _id: 'AWm5CkJ2BICarNiY1syv',
                        _version: 1,
                        result: 'created',
                        _shards: { total: 1, successful: 1, failed: 0 },
                        created: true,
                        status: 201
                    }
                }, {
                    index: {
                        _index: 'index_e447128aa229430cbddef8c1adece5c2_1553581674433',
                        _type: 'type',
                        _id: 'AWm5CkJ2BICarNiY1syw',
                        _version: 1,
                        result: 'created',
                        _shards: { total: 1, successful: 1, failed: 0 },
                        created: true,
                        status: 201
                    }
                }, {
                    index: {
                        _index: 'index_e447128aa229430cbddef8c1adece5c2_1553581674433',
                        _type: 'type',
                        _id: 'AWm5CkJ2BICarNiY1syx',
                        _version: 1,
                        result: 'created',
                        _shards: { total: 1, successful: 1, failed: 0 },
                        created: true,
                        status: 201
                    }
                }, {
                    index: {
                        _index: 'index_e447128aa229430cbddef8c1adece5c2_1553581674433',
                        _type: 'type',
                        _id: 'AWm5CkJ2BICarNiY1syy',
                        _version: 1,
                        result: 'created',
                        _shards: { total: 1, successful: 1, failed: 0 },
                        created: true,
                        status: 201
                    }
                }, {
                    index: {
                        _index: 'index_e447128aa229430cbddef8c1adece5c2_1553581674433',
                        _type: 'type',
                        _id: 'AWm5CkJ2BICarNiY1syz',
                        _version: 1,
                        result: 'created',
                        _shards: { total: 1, successful: 1, failed: 0 },
                        created: true,
                        status: 201
                    }
                }, {
                    index: {
                        _index: 'index_e447128aa229430cbddef8c1adece5c2_1553581674433',
                        _type: 'type',
                        _id: 'AWm5CkJ2BICarNiY1sy0',
                        _version: 1,
                        result: 'created',
                        _shards: { total: 1, successful: 1, failed: 0 },
                        created: true,
                        status: 201
                    }
                }, {
                    index: {
                        _index: 'index_e447128aa229430cbddef8c1adece5c2_1553581674433',
                        _type: 'type',
                        _id: 'AWm5CkJ2BICarNiY1sy1',
                        _version: 1,
                        result: 'created',
                        _shards: { total: 1, successful: 1, failed: 0 },
                        created: true,
                        status: 201
                    }
                }, {
                    index: {
                        _index: 'index_e447128aa229430cbddef8c1adece5c2_1553581674433',
                        _type: 'type',
                        _id: 'AWm5CkJ2BICarNiY1sy2',
                        _version: 1,
                        result: 'created',
                        _shards: { total: 1, successful: 1, failed: 0 },
                        created: true,
                        status: 201
                    }
                }, {
                    index: {
                        _index: 'index_e447128aa229430cbddef8c1adece5c2_1553581674433',
                        _type: 'type',
                        _id: 'AWm5CkJ2BICarNiY1sy3',
                        _version: 1,
                        result: 'created',
                        _shards: { total: 1, successful: 1, failed: 0 },
                        created: true,
                        status: 201
                    }
                }]
            });


        const message = JSON.parse(fs.readFileSync(path.join(__dirname, 'data-message-content.json')));

        const preDataQueueStatus = await channel.assertQueue(config.get('queues.data'));
        preDataQueueStatus.messageCount.should.equal(0);
        const preStatusQueueStatus = await channel.assertQueue(config.get('queues.status'));
        preStatusQueueStatus.messageCount.should.equal(0);

        await channel.sendToQueue(config.get('queues.data'), Buffer.from(JSON.stringify(message)));

        // Give the code 3 seconds to do its thing
        await new Promise(resolve => setTimeout(resolve, 3000));

        const postStatusQueueStatus = await channel.assertQueue(config.get('queues.status'));
        postStatusQueueStatus.messageCount.should.equal(1);
        const postDataQueueStatus = await channel.assertQueue(config.get('queues.data'));
        postDataQueueStatus.messageCount.should.equal(0);

        const validateStatusQueueMessages = async (msg) => {
            const content = JSON.parse(msg.content.toString());

            content.should.have.property('id');
            content.should.have.property('type').and.equal(docImporterMessages.status.MESSAGE_TYPES.STATUS_WRITTEN_DATA);
            content.should.have.property('detail').and.equal('');
            content.should.have.property('taskId').and.equal(message.taskId);
            content.should.have.property('withErrors').and.equal(false);

            await channel.ack(msg);
        };

        await channel.consume(config.get('queues.status'), validateStatusQueueMessages);

        process.on('unhandledRejection', (error) => {
            should.fail(error);
        });
    });

    afterEach(async () => {
        await channel.assertQueue(config.get('queues.data'));
        await channel.purgeQueue(config.get('queues.data'));
        const executorQueueStatus = await channel.checkQueue(config.get('queues.data'));
        executorQueueStatus.messageCount.should.equal(0);

        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });

    after(async () => {
        await channel.purgeQueue(config.get('queues.status'));
        await channel.purgeQueue(config.get('queues.data'));

        rabbitmqConnection.close();
    });
});
