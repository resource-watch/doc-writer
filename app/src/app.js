const logger = require('logger');
const config = require('config');
const amqp = require('amqplib/callback_api');

const { DATA_QUEUE } = require('app.constants');

amqp.connect(process.env.RABBITMQ_URL, function (err, conn) {
  if (err) {
    console.error(err);
    return;
  }
  conn.createChannel(function (err, ch) {
    const q = DATA_QUEUE;

    ch.assertQueue(q, {
      durable: true,
      maxLength: 10
    });
    ch.prefetch(1);
    // Note: on Node 6 Buffer.from(msg) should be used
    logger.debug(` [*] Waiting for messages (pid ${process.pid}) in ${q}. To exit press CTRL+C`, q);
    ch.consume(q, function (msg) {

      console.log(`${process.pid} [x] Received `);
      ch.ack(msg);

      console.log('sending ack');

    }, {
      noAck: false
    });
  });
});
