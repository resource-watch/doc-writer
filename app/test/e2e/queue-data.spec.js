/* eslint-disable no-unused-vars,no-undef,no-await-in-loop,no-underscore-dangle */
const nock = require('nock');
const chai = require('chai');
const config = require('config');
const amqp = require('amqplib');
const RabbitMQConnectionError = require('errors/rabbitmq-connection.error');
const docImporterMessages = require('rw-doc-importer-messages');
const fs = require('fs');
const path = require('path');
const chaiMatch = require('chai-match');
const sleep = require('sleep');

const { createIndex, deleteTestIndeces, getData } = require('./utils/helpers');
const { getTestServer } = require('./utils/test-server');

chai.use(chaiMatch);
chai.should();

let requester;
let rabbitmqConnection = null;
let channel;

nock.disableNetConnect();
nock.enableNetConnect((host) => [`${process.env.HOST_IP}:${process.env.PORT}`, process.env.ELASTIC_TEST_URL].includes(host));

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
        await channel.assertQueue(config.get('queues.status'));
        await channel.assertQueue(config.get('queues.data'));

        await channel.purgeQueue(config.get('queues.status'));
        await channel.purgeQueue(config.get('queues.data'));

        const statusQueueStatus = await channel.checkQueue(config.get('queues.status'));
        statusQueueStatus.messageCount.should.equal(0);

        const dataQueueStatus = await channel.checkQueue(config.get('queues.data'));
        dataQueueStatus.messageCount.should.equal(0);

        requester = await getTestServer();

        await deleteTestIndeces();
    });

    beforeEach(async () => {
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
        await channel.assertQueue(config.get('queues.status'));
        await channel.assertQueue(config.get('queues.data'));

        await channel.purgeQueue(config.get('queues.status'));
        await channel.purgeQueue(config.get('queues.data'));

        const statusQueueStatus = await channel.checkQueue(config.get('queues.status'));
        statusQueueStatus.messageCount.should.equal(0);

        const dataQueueStatus = await channel.checkQueue(config.get('queues.data'));
        dataQueueStatus.messageCount.should.equal(0);
    });

    // it('Consume a DATA message and create a new task and EXECUTION_CREATE message (happy case)', async () => {
    //     await createIndex(
    //         'test_index_d1ced4227cd5480a8904d3410d75bf42_1587619728489'
    //     );
    //
    //     const message = JSON.parse(fs.readFileSync(path.join(__dirname, 'data-message-content.json')));
    //
    //     const preDataQueueStatus = await channel.assertQueue(config.get('queues.data'));
    //     preDataQueueStatus.messageCount.should.equal(0);
    //     const preStatusQueueStatus = await channel.assertQueue(config.get('queues.status'));
    //     preStatusQueueStatus.messageCount.should.equal(0);
    //
    //     await channel.sendToQueue(config.get('queues.data'), Buffer.from(JSON.stringify(message)));
    //
    //     let expectedStatusQueueMessageCount = 1;
    //
    //     const validateStatusQueueMessages = (resolve) => async (msg) => {
    //         const content = JSON.parse(msg.content.toString());
    //
    //         content.should.have.property('id');
    //         content.should.have.property('type').and.equal(docImporterMessages.status.MESSAGE_TYPES.STATUS_WRITTEN_DATA);
    //         content.should.have.property('detail');
    //         content.detail.should.have.property('took');
    //         content.detail.should.have.property('errors').and.equals(false);
    //         content.detail.should.have.property('itemsWithError').and.be.an('array').and.length(0);
    //         content.detail.should.have.property('itemsResults').and.deep.equal({
    //             created: 10
    //         });
    //         content.should.have.property('taskId').and.equal(message.taskId);
    //         content.should.have.property('hash').and.be.a('string');
    //         content.should.have.property('file').and.equal(message.file);
    //         content.should.have.property('withErrors').and.equal(false);
    //
    //         const data = await getData('test_index_d1ced4227cd5480a8904d3410d75bf42_1587619728489');
    //
    //         data.body.hits.hits.forEach((elem) => {
    //             elem.should.have.property('_index').and.equal('test_index_d1ced4227cd5480a8904d3410d75bf42_1587619728489');
    //             elem.should.have.property('_type').and.equal('_doc');
    //             elem.should.have.property('_score').and.equal(1);
    //             elem.should.have.property('_source').and.be.an('object');
    //
    //             Object.keys(elem._source).should.deep.equal([
    //                 'id', 'type', 'attributes'
    //             ]);
    //
    //             Object.keys(elem._source.attributes).should.deep.equal([
    //                 'name',
    //                 'slug',
    //                 'type',
    //                 'subtitle',
    //                 'application',
    //                 'dataPath',
    //                 'attributesPath',
    //                 'connectorType',
    //                 'provider',
    //                 'userId',
    //                 'connectorUrl',
    //                 'tableName',
    //                 'status',
    //                 'published',
    //                 'overwrite',
    //                 'verified',
    //                 'blockchain',
    //                 'mainDateField',
    //                 'env',
    //                 'geoInfo',
    //                 'protected',
    //                 'legend',
    //                 'clonedHost',
    //                 'errorMessage',
    //                 'taskId',
    //                 'updatedAt',
    //                 'dataLastUpdated',
    //                 'widgetRelevantProps',
    //                 'layerRelevantProps'
    //             ]);
    //         });
    //
    //         await channel.ack(msg);
    //
    //         expectedStatusQueueMessageCount -= 1;
    //
    //         if (expectedStatusQueueMessageCount < 0) {
    //             throw new Error(`Unexpected message count - expectedStatusQueueMessageCount:${expectedStatusQueueMessageCount}`);
    //         }
    //
    //         if (expectedStatusQueueMessageCount === 0) {
    //             resolve();
    //         }
    //     };
    //
    //     return new Promise((resolve) => {
    //         channel.consume(config.get('queues.status'), validateStatusQueueMessages(resolve));
    //     });
    // });

    it('Consume a DATA message and create a new task and EXECUTION_CREATE message, capturing ES errors', async () => {
        await createIndex(
            'test_index_d1ced4227cd5480a8904d3410d75bf42_1587619728489'
        );

        const message = JSON.parse(fs.readFileSync(path.join(__dirname, 'data-message-content.json')));
        // setting the first object's provider to a float, so the following 9 fail to cast from string.
        message.data[1].attributes.provider = 123.45;

        const preDataQueueStatus = await channel.assertQueue(config.get('queues.data'));
        preDataQueueStatus.messageCount.should.equal(0);
        const preStatusQueueStatus = await channel.assertQueue(config.get('queues.status'));
        preStatusQueueStatus.messageCount.should.equal(0);

        await channel.sendToQueue(config.get('queues.data'), Buffer.from(JSON.stringify(message)));

        let expectedStatusQueueMessageCount = 1;

        const validateStatusQueueMessages = (resolve) => async (msg) => {
            const content = JSON.parse(msg.content.toString());

            content.should.have.property('id');
            content.should.have.property('type').and.equal(docImporterMessages.status.MESSAGE_TYPES.STATUS_WRITTEN_DATA);
            content.should.have.property('taskId').and.equal(message.taskId);
            content.should.have.property('hash').and.be.a('string');
            content.should.have.property('file').and.equal(message.file);
            content.should.have.property('withErrors').and.equal(true);

            content.detail.should.have.property('took');
            content.detail.should.have.property('errors').and.equals(true);
            content.detail.should.have.property('itemsWithError').and.be.an('array').and.length(9);
            content.detail.should.have.property('itemsResults').and.deep.equal({
                created: 1,
                error: 9
            });

            const data = await getData('test_index_d1ced4227cd5480a8904d3410d75bf42_1587619728489');

            data.body.hits.hits.forEach((elem) => {
                elem.should.have.property('_index').and.equal('test_index_d1ced4227cd5480a8904d3410d75bf42_1587619728489');
                elem.should.have.property('_type').and.equal('_doc');
                elem.should.have.property('_score').and.equal(1);
                elem.should.have.property('_source').and.be.an('object');

                Object.keys(elem._source).should.deep.equal([
                    'id', 'type', 'attributes'
                ]);

                Object.keys(elem._source.attributes).should.deep.equal([
                    'name',
                    'slug',
                    'type',
                    'subtitle',
                    'application',
                    'dataPath',
                    'attributesPath',
                    'connectorType',
                    'provider',
                    'userId',
                    'connectorUrl',
                    'tableName',
                    'status',
                    'published',
                    'overwrite',
                    'verified',
                    'blockchain',
                    'mainDateField',
                    'env',
                    'geoInfo',
                    'protected',
                    'legend',
                    'clonedHost',
                    'errorMessage',
                    'taskId',
                    'updatedAt',
                    'dataLastUpdated',
                    'widgetRelevantProps',
                    'layerRelevantProps'
                ]);
            });

            await channel.ack(msg);

            expectedStatusQueueMessageCount -= 1;

            if (expectedStatusQueueMessageCount < 0) {
                throw new Error(`Unexpected message count - expectedStatusQueueMessageCount:${expectedStatusQueueMessageCount}`);
            }

            if (expectedStatusQueueMessageCount === 0) {
                resolve();
            }
        };

        return new Promise((resolve) => {
            channel.consume(config.get('queues.status'), validateStatusQueueMessages(resolve));
        });
    });

    afterEach(async () => {
        await deleteTestIndeces();

        await channel.assertQueue(config.get('queues.status'));
        const statusQueueStatus = await channel.checkQueue(config.get('queues.status'));
        statusQueueStatus.messageCount.should.equal(0);

        await channel.assertQueue(config.get('queues.data'));
        const dataQueueStatus = await channel.checkQueue(config.get('queues.data'));
        dataQueueStatus.messageCount.should.equal(0);

        if (!nock.pendingMocks().filter((elem) => elem !== `HEAD ${config.get('elasticsearch.host')}`)) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }

        await channel.close();
        channel = null;

        await rabbitmqConnection.close();
        rabbitmqConnection = null;
    });

    after(() => {
        nock.cleanAll();
    });

});
