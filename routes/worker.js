const { Worker } = require('bullmq');
const path = require('path');
const config = require('./config')
const processorFile = path.join(__dirname, 'processor.js');

module.exports.worker = function () {
    // Process the jobs in workers
    const worker = new Worker(config.queueName, processorFile, {
        connection: config.connection,
        concurrency: config.concurrency,
    });

    // Listen to jobs for different events
    worker.on("completed", (job) => {
        console.log(`Completed job ${job.id} successfully`)
    });

    worker.on("failed", (job, err) => {
        console.log(`Failed job ${job.id} with ${err}`)
    });
    
    worker.on("wait", (job) => {
        console.log(`A job with ID ${job.id} is waiting`)
    });

    worker.on("progress", (job) => {
        console.log(`Job ${job.id} is in progress`)
    });

    worker.on('error', (err) => {
        console.error(err);
    });
}