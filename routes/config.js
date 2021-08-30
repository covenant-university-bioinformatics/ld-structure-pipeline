module.exports = {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || "1"),
    queueName: process.env.QUEUE_NAME || "LDSJob",
    connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || "6379"),
    },
};