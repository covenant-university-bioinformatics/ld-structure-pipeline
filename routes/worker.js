const { Worker } = require('bullmq');
const path = require('path');
const config = require('./config')
const LDSController = require('../controllers/ldStructureModule');
const processorFile = path.join(__dirname, 'processor.js');

module.exports.worker = function () {
    // Process the jobs in workers
    const worker = new Worker(config.queueName, processorFile, {
        connection: config.connection,
        concurrency: config.concurrency,
    });

    // Listen to jobs for different events
    worker.on("completed", async (job) => {
        const filter = { jobUniqueID: job.data.jobUniqueID }
        var update = { status: 'COMPLETED' }
        await LDSController.updateJobDocument(filter, update)
        console.log(`Completed job ${job.id} successfully`)
    });

    worker.on("failed", async (job, err) => {
        const filter = { jobUniqueID: job.data.jobUniqueID }
        var update = { status: 'FAILED' }
        await LDSController.updateJobDocument(filter, update)
        console.log(`Failed job ${job.id} with ${err}`)
    });
}